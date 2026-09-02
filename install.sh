#!/usr/bin/env bash
set -Eeuo pipefail

INSTALL_DIR="${PARKING_INSTALL_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
ENV_FILE="${INSTALL_DIR}/.env.production"
STATE_DIR="${INSTALL_DIR}/.deploy"
CONTROL_DIR="${INSTALL_DIR}/data/control"
BACKUP_DIR="${PARKING_BACKUP_DIR:-${INSTALL_DIR}/backups}"
SERVICE_NAME="parking-space-manager-update"

log() { printf '[车位系统] %s\n' "$*"; }
warn() { printf '[警告] %s\n' "$*" >&2; }
fail() { printf '[错误] %s\n' "$*" >&2; exit 1; }
require_command() { command -v "$1" >/dev/null 2>&1 || fail "缺少命令：$1"; }
require_env() { [[ -s "${ENV_FILE}" ]] || fail "缺少 ${ENV_FILE}，请先执行 ./install.sh install"; }
compose() { docker compose --env-file "${ENV_FILE}" "$@"; }

set_env() {
  local key="$1" value="$2" tmp
  tmp="$(mktemp)"
  awk -v key="${key}" -v value="${value}" 'BEGIN{done=0} $0 ~ "^" key "=" {print key "=" value; done=1; next} {print} END{if(!done) print key "=" value}' "${ENV_FILE}" > "${tmp}"
  install -m 0600 "${tmp}" "${ENV_FILE}"; rm -f "${tmp}"
}

ensure_docker() {
  require_command docker
  docker compose version >/dev/null 2>&1 || fail "需要 Docker Compose Plugin"
  docker info >/dev/null 2>&1 || fail "Docker 未运行或当前用户没有访问权限"
}

app_port() { local value; value="$(awk -F= '$1=="APP_PORT"{print $2}' "${ENV_FILE}" | tail -n 1)"; printf '%s' "${value##*:}"; }
wait_for_health() {
  local attempts="${1:-60}" port; port="$(app_port)"
  for ((i=1; i<=attempts; i++)); do
    curl -fsS --max-time 3 "http://127.0.0.1:${port}/api/health" >/dev/null 2>&1 && return 0
    sleep 2
  done
  return 1
}

backup_database() {
  require_env; ensure_docker; install -d -m 0700 "${BACKUP_DIR}"
  local destination; destination="${BACKUP_DIR}/parking-$(date -u +%Y%m%dT%H%M%SZ).dump"
  compose exec -T db pg_dump -U parking -d parking_manager -Fc > "${destination}"
  [[ -s "${destination}" ]] || fail "数据库备份为空"
  compose exec -T db pg_restore -l < "${destination}" >/dev/null || fail "数据库备份校验失败"
  chmod 0600 "${destination}"; printf '%s\n' "${destination}"
}

deploy() {
  require_env; ensure_docker; require_command curl; install -d -m 0700 "${STATE_DIR}"
  local backup="" old_image="" rollback_tag="" app_was_running=false
  compose ps --status running -q app | grep -q . && app_was_running=true
  old_image="$(compose images -q app 2>/dev/null | head -n 1 || true)"
  if [[ -n "${old_image}" ]]; then
    rollback_tag="parking-space-manager-app:rollback-$(date -u +%Y%m%dT%H%M%SZ)"
    docker tag "${old_image}" "${rollback_tag}"; printf '%s\n' "${rollback_tag}" > "${STATE_DIR}/last-rollback-image"
  fi
  log "正在构建新版本，现有服务会继续运行..."
  compose build app
  if compose ps --status running -q db | grep -q .; then
    [[ "${app_was_running}" == true ]] && compose stop app
    log "正在备份并校验数据库..."; backup="$(backup_database)"; printf '%s\n' "${backup}" > "${STATE_DIR}/last-backup"
  fi
  if ! compose run --rm app sh -c './node_modules/.bin/prisma migrate deploy && npm run db:bootstrap'; then
    warn "数据库迁移或初始化失败，正在恢复更新前状态。"
    if [[ -n "${backup}" ]]; then compose exec -T db pg_restore -U parking -d parking_manager --clean --if-exists < "${backup}"; fi
    if [[ -n "${rollback_tag}" ]]; then docker tag "${rollback_tag}" parking-space-manager-app:latest; fi
    [[ "${app_was_running}" == true ]] && compose up -d --no-build app
    fail "更新未完成，应用和数据库已恢复"
  fi
  compose up -d --remove-orphans app
  if wait_for_health 60; then log "更新完成，健康检查通过。"; compose ps; return 0; fi
  compose logs --tail=120 app >&2 || true
  if [[ -n "${rollback_tag}" ]]; then
    warn "新版本检查失败，正在恢复旧镜像和数据库。"
    compose stop app
    if [[ -n "${backup}" ]]; then compose exec -T db pg_restore -U parking -d parking_manager --clean --if-exists < "${backup}"; fi
    docker tag "${rollback_tag}" parking-space-manager-app:latest; compose up -d --no-build app
    wait_for_health 30 || fail "旧镜像恢复后仍未通过检查"
  fi
  fail "更新未完成，数据库备份已保留"
}

configure_env() {
  [[ ! -e "${ENV_FILE}" ]] || return 0
  local username password confirm
  read -r -p '管理员账号 [admin]: ' username </dev/tty; username="${username:-admin}"
  while true; do
    read -r -s -p '管理员密码（至少 10 位）: ' password </dev/tty; printf '\n' >/dev/tty
    [[ ${#password} -ge 10 ]] || { warn "密码至少 10 位"; continue; }
    read -r -s -p '再次输入管理员密码: ' confirm </dev/tty; printf '\n' >/dev/tty
    [[ "${password}" == "${confirm}" ]] && break; warn "两次密码不一致"
  done
  umask 077
  {
    printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 24)"
    printf 'AUTH_SECRET=%s\n' "$(openssl rand -base64 48 | tr -d '\n')"
    printf 'ENCRYPTION_KEY=%s\n' "$(openssl rand -hex 32)"
    printf 'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=%s\n' "$(openssl rand -base64 32 | tr -d '\n')"
    printf 'ADMIN_USERNAME=%s\nADMIN_PASSWORD=%s\n' "${username}" "${password}"
    printf 'SESSION_COOKIE_SECURE=\nAPP_PORT=3000\nUPDATE_REPOSITORY=zxyszx/parking-space-manager\nUPDATE_BRANCH=main\n'
  } > "${ENV_FILE}"
  chmod 0600 "${ENV_FILE}"
}

ensure_deployment_env() {
  require_env; require_command openssl
  grep -q '^NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=.' "${ENV_FILE}" || set_env NEXT_SERVER_ACTIONS_ENCRYPTION_KEY "$(openssl rand -base64 32 | tr -d '\n')"
}

configure_web_updater() {
  install -d -m 0750 "${CONTROL_DIR}"; chown 1001:1001 "${CONTROL_DIR}" 2>/dev/null || true
  set_env APP_COMMIT_SHA "$(git rev-parse HEAD 2>/dev/null || printf unknown)"
  if [[ ${EUID} -ne 0 ]] || ! command -v systemctl >/dev/null 2>&1; then
    set_env WEB_UPDATE_ENABLED false; warn "非 root 或无 systemd：网页更新按钮将禁用，命令行更新仍可用。"; return
  fi
  cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Parking Space Manager controlled updater
After=docker.service network-online.target
[Service]
Type=oneshot
WorkingDirectory=${INSTALL_DIR}
ExecStart=${INSTALL_DIR}/install.sh process-update
EOF
  cat > "/etc/systemd/system/${SERVICE_NAME}.path" <<EOF
[Unit]
Description=Watch Parking Space Manager update requests
[Path]
PathExists=${CONTROL_DIR}/update.request
Unit=${SERVICE_NAME}.service
[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload; systemctl enable --now "${SERVICE_NAME}.path"; set_env WEB_UPDATE_ENABLED true
}

write_update_status() {
  local state="$1" message="$2"; install -d -m 0750 "${CONTROL_DIR}"
  printf '{"state":"%s","message":"%s","updatedAt":"%s"}\n' "${state}" "${message}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${CONTROL_DIR}/update-status.json"
  chown 1001:1001 "${CONTROL_DIR}/update-status.json" 2>/dev/null || true
}

process_update() {
  require_env; require_command git; require_command flock; ensure_deployment_env; install -d -m 0700 "${STATE_DIR}"; rm -f "${CONTROL_DIR}/update.request"
  exec 9>"${STATE_DIR}/update.lock"; flock -n 9 || { write_update_status failed "已有更新任务在运行"; exit 1; }
  local branch repository source_sha latest installed_sha
  installed_sha="$(awk -F= '$1=="APP_COMMIT_SHA"{print $2}' "${ENV_FILE}" | tail -n1)"; installed_sha="${installed_sha:-unknown}"
  trap 'set_env APP_COMMIT_SHA "${installed_sha}"; write_update_status failed "更新失败，请查看 systemd 日志"' EXIT
  write_update_status updating "正在备份、构建并更新"
  if ! git diff --quiet || ! git diff --cached --quiet; then fail "仓库有未提交修改，已停止网页更新"; fi
  branch="$(awk -F= '$1=="UPDATE_BRANCH"{print $2}' "${ENV_FILE}" | tail -n1)"; branch="${branch:-main}"
  repository="$(awk -F= '$1=="UPDATE_REPOSITORY"{print $2}' "${ENV_FILE}" | tail -n1)"; repository="${repository:-zxyszx/parking-space-manager}"
  git fetch "https://github.com/${repository}.git" "${branch}"
  source_sha="$(git rev-parse HEAD)"; latest="$(git rev-parse FETCH_HEAD)"
  if [[ "${source_sha}" != "${latest}" ]]; then git merge --ff-only FETCH_HEAD; fi
  if [[ "${installed_sha}" == "${latest}" ]]; then write_update_status success "已是最新版本"; trap - EXIT; return; fi
  set_env APP_COMMIT_SHA "${latest}"; deploy
  write_update_status success "更新完成"; trap - EXIT
}

restore_database() {
  require_env; ensure_docker
  local backup="${1:-}" answer
  [[ -n "${backup}" && -s "${backup}" ]] || fail "请指定有效备份：./install.sh restore backups/parking-*.dump"
  read -r -p '恢复会覆盖当前数据库，确认继续吗？[y/N]: ' answer </dev/tty
  [[ "${answer}" =~ ^([Yy]|[Yy][Ee][Ss])$ ]] || { log "已取消"; return; }
  compose stop app
  if ! compose exec -T db pg_restore -U parking -d parking_manager --clean --if-exists < "${backup}"; then
    compose start app; fail "数据库恢复失败，应用已重新启动"
  fi
  compose start app; wait_for_health 60 || fail "恢复后健康检查失败"; log "数据库恢复完成"
}

usage() {
  cat <<'EOF'
用法：./install.sh <命令>
  install             一键安装并开放 APP_PORT（默认 3000）
  update              备份、构建、迁移并更新
  backup              备份并校验 PostgreSQL
  restore <备份>     恢复 PostgreSQL 备份
  status              查看容器与健康状态
  logs                查看应用日志
EOF
}

cd "${INSTALL_DIR}"
case "${1:-}" in
  install) ensure_docker; require_command openssl; require_command git; configure_env; ensure_deployment_env; configure_web_updater; deploy; log "安装完成：请在 1Panel 反向代理到 http://127.0.0.1:$(app_port)" ;;
  update) process_update ;;
  process-update) process_update ;;
  backup) backup_database ;;
  restore) restore_database "${2:-}" ;;
  status) require_env; compose ps; curl -fsS "http://127.0.0.1:$(app_port)/api/health" || true; printf '\n' ;;
  logs) require_env; compose logs --tail=200 app ;;
  *) usage; [[ -n "${1:-}" ]] && exit 1 || true ;;
esac
