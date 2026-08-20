#!/usr/bin/env bash
set -Eeuo pipefail

INSTALL_DIR="${PARKING_INSTALL_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
ENV_FILE="${INSTALL_DIR}/.env.production"
STATE_DIR="${INSTALL_DIR}/.deploy"
BACKUP_DIR="${PARKING_BACKUP_DIR:-/root/backups}"
NGINX_CONFIG="/etc/nginx/conf.d/parking-space-manager.conf"
ACME_ROOT="/var/www/parking-acme"
CERT_DIR="/etc/nginx/ssl/parking-space-manager"

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
  install -m 0600 "${tmp}" "${ENV_FILE}"
  rm -f "${tmp}"
}

ensure_docker() {
  require_command docker
  docker compose version >/dev/null 2>&1 || fail "需要 Docker Compose Plugin"
  docker info >/dev/null 2>&1 || fail "Docker 未运行或当前用户没有访问权限"
}

wait_for_health() {
  local attempts="${1:-60}"
  for ((i=1; i<=attempts; i++)); do
    if curl -fsS --max-time 3 http://127.0.0.1:3000/api/health >/dev/null 2>&1; then return 0; fi
    sleep 2
  done
  return 1
}

backup_database() {
  require_env
  ensure_docker
  install -d -m 0700 "${BACKUP_DIR}"
  local timestamp destination
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  destination="${BACKUP_DIR}/parking-${timestamp}.dump"
  compose exec -T db pg_dump -U parking -d parking_manager -Fc > "${destination}"
  [[ -s "${destination}" ]] || fail "数据库备份为空"
  compose exec -T db pg_restore -l < "${destination}" >/dev/null || fail "数据库备份校验失败"
  chmod 0600 "${destination}"
  printf '%s\n' "${destination}"
}

deploy() {
  require_env
  ensure_docker
  require_command curl
  install -d -m 0700 "${STATE_DIR}"

  local backup="" old_image="" rollback_tag=""
  if compose ps --status running -q db | grep -q .; then
    log "正在备份并校验数据库..."
    backup="$(backup_database)"
    printf '%s\n' "${backup}" > "${STATE_DIR}/last-backup"
    log "备份完成：${backup}"
  fi
  old_image="$(compose images -q app 2>/dev/null | head -n 1 || true)"
  if [[ -n "${old_image}" ]]; then
    rollback_tag="parking-space-manager-app:rollback-$(date -u +%Y%m%dT%H%M%SZ)"
    docker tag "${old_image}" "${rollback_tag}"
    printf '%s\n' "${rollback_tag}" > "${STATE_DIR}/last-rollback-image"
  fi

  log "正在构建新镜像，现有服务会继续运行..."
  compose build app
  log "正在应用数据库迁移..."
  compose run --rm app ./node_modules/.bin/prisma migrate deploy
  log "正在切换应用容器..."
  compose up -d --remove-orphans app
  if wait_for_health 60; then
    log "更新完成，健康检查通过。"
    compose ps
    return 0
  fi

  warn "新版本健康检查失败。"
  compose logs --tail=120 app >&2 || true
  if [[ -n "${rollback_tag}" ]]; then
    warn "正在恢复更新前镜像；数据库备份保留在 ${backup:-${BACKUP_DIR}}。"
    docker tag "${rollback_tag}" parking-space-manager-app:latest
    compose up -d --no-build app
    wait_for_health 30 || fail "旧镜像恢复后仍未通过健康检查，请执行 ./install.sh logs"
  fi
  fail "更新未完成，已恢复旧应用镜像"
}

configure_env() {
  [[ ! -e "${ENV_FILE}" ]] || return 0
  local username password confirm
  read -r -p '管理员账号 [admin]: ' username </dev/tty
  username="${username:-admin}"
  while true; do
    read -r -s -p '管理员密码（至少 10 位）: ' password </dev/tty
    printf '\n' >/dev/tty
    [[ ${#password} -ge 10 ]] || { warn "密码至少 10 位"; continue; }
    read -r -s -p '再次输入管理员密码: ' confirm </dev/tty
    printf '\n' >/dev/tty
    [[ "${password}" == "${confirm}" ]] && break
    warn "两次密码不一致"
  done
  umask 077
  {
    printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 24)"
    printf 'AUTH_SECRET=%s\n' "$(openssl rand -base64 48 | tr -d '\n')"
    printf 'ENCRYPTION_KEY=%s\n' "$(openssl rand -hex 32)"
    printf 'ADMIN_USERNAME=%s\n' "${username}"
    printf 'ADMIN_PASSWORD=%s\n' "${password}"
    printf 'SESSION_COOKIE_SECURE=false\n'
    printf 'APP_PORT=3000\n'
  } > "${ENV_FILE}"
  chmod 0600 "${ENV_FILE}"
}

write_proxy_example() {
  local domain="$1"
  cat > "${INSTALL_DIR}/reverse-proxy.conf" <<EOF
server {
    listen 80;
    server_name ${domain};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};

    # 证书路径由 1Panel、宝塔或现有 Nginx 管理。
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 443;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
        proxy_buffering off;
    }
}
EOF
  log "反代示例已生成：${INSTALL_DIR}/reverse-proxy.conf"
}

configure_auto_nginx() {
  local domain="$1"
  [[ $EUID -eq 0 ]] || fail "自动 Nginx + SSL 模式需要 root 权限"
  if ss -lntp 2>/dev/null | grep -Eq ':(80|443)[[:space:]]' && ! command -v nginx >/dev/null 2>&1; then
    fail "80/443 已被其他服务占用，请使用模式 2（已有 Nginx/1Panel 反代）"
  fi
  require_command nginx
  install -d -m 0755 "${ACME_ROOT}/.well-known/acme-challenge" "${CERT_DIR}"
  cat > "${NGINX_CONFIG}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    location ^~ /.well-known/acme-challenge/ { root ${ACME_ROOT}; }
    location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; }
}
EOF
  nginx -t
  systemctl reload nginx
  if [[ ! -x /root/.acme.sh/acme.sh ]]; then
    curl -fsSL https://get.acme.sh | sh -s email="hostmaster@${domain}"
  fi
  /root/.acme.sh/acme.sh --issue --server letsencrypt --keylength ec-256 -d "${domain}" --webroot "${ACME_ROOT}"
  /root/.acme.sh/acme.sh --install-cert --ecc -d "${domain}" --fullchain-file "${CERT_DIR}/fullchain.pem" --key-file "${CERT_DIR}/privkey.pem" --reloadcmd "nginx -t && systemctl reload nginx"
  cat > "${NGINX_CONFIG}" <<EOF
server { listen 80; listen [::]:80; server_name ${domain}; location ^~ /.well-known/acme-challenge/ { root ${ACME_ROOT}; } location / { return 301 https://\$host\$request_uri; } }
server {
    listen 443 ssl http2; listen [::]:443 ssl http2; server_name ${domain};
    ssl_certificate ${CERT_DIR}/fullchain.pem; ssl_certificate_key ${CERT_DIR}/privkey.pem; ssl_protocols TLSv1.2 TLSv1.3;
    location / { proxy_pass http://127.0.0.1:3000; proxy_http_version 1.1; proxy_set_header Host \$http_host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto https; proxy_set_header X-Forwarded-Port 443; proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection upgrade; proxy_read_timeout 60s; proxy_buffering off; }
}
EOF
  nginx -t
  systemctl reload nginx
}

configure_web() {
  require_env
  local mode="${1:-}" domain="${2:-}"
  if [[ -z "${mode}" ]]; then
    printf 'Web 部署方式：\n1. 自动配置 Nginx + SSL\n2. 1Panel/宝塔/已有 Nginx 反代\n3. 仅 HTTP 测试\n'
    read -r -p '请选择 [2]: ' mode </dev/tty
    mode="${mode:-2}"
  fi
  case "${mode}" in
    1)
      [[ -n "${domain}" ]] || read -r -p '请输入已解析到本机的域名: ' domain </dev/tty
      [[ "${domain}" =~ ^[A-Za-z0-9.-]+$ ]] || fail "域名格式不正确"
      set_env APP_PORT '127.0.0.1:3000'
      set_env SESSION_COOKIE_SECURE true
      compose up -d app
      configure_auto_nginx "${domain}"
      ;;
    2)
      [[ -n "${domain}" ]] || read -r -p '请输入域名（可暂时留空）: ' domain </dev/tty
      set_env APP_PORT '127.0.0.1:3000'
      set_env SESSION_COOKIE_SECURE true
      compose up -d app
      [[ -z "${domain}" ]] || write_proxy_example "${domain}"
      log "请在 1Panel/宝塔中反代到 http://127.0.0.1:3000，并为域名启用 HTTPS。"
      ;;
    3)
      set_env APP_PORT 3000
      set_env SESSION_COOKIE_SECURE false
      compose up -d app
      warn "HTTP 测试模式会直接暴露 3000 端口，不适合正式公网使用。"
      ;;
    *) fail "Web 模式只能是 1、2 或 3" ;;
  esac
}

rollback() {
  require_env
  ensure_docker
  local backup="${1:-}" answer rollback_image
  [[ -n "${backup}" && -s "${backup}" ]] || fail "请指定有效备份文件：./install.sh rollback /root/backups/parking-*.dump"
  read -r -p '回滚会覆盖当前数据库，确认继续吗？[y/N]: ' answer </dev/tty
  [[ "${answer}" =~ ^([Yy]|[Yy][Ee][Ss])$ ]] || { log "已取消"; return 0; }
  rollback_image="$(cat "${STATE_DIR}/last-rollback-image" 2>/dev/null || true)"
  compose stop app
  compose exec -T db pg_restore -U parking -d parking_manager --clean --if-exists < "${backup}"
  if [[ -n "${rollback_image}" ]]; then docker tag "${rollback_image}" parking-space-manager-app:latest; fi
  compose up -d --no-build app
  wait_for_health 60 || fail "回滚后健康检查失败"
  log "回滚完成"
}

usage() {
  cat <<'EOF'
用法：./install.sh <命令>
  install             首次安装并启动
  update              备份、构建、迁移并更新
  web [1|2|3] [域名]  配置三种 Web/反代模式
  backup              备份并校验数据库
  rollback <备份>     恢复数据库和上一个应用镜像
  status              查看容器与健康状态
  logs                查看应用日志
EOF
}

cd "${INSTALL_DIR}"
case "${1:-}" in
  install) ensure_docker; require_command openssl; configure_env; deploy; configure_web ;;
  update) deploy ;;
  web) configure_web "${2:-}" "${3:-}" ;;
  backup) backup_database ;;
  rollback) rollback "${2:-}" ;;
  status) require_env; compose ps; curl -fsS http://127.0.0.1:3000/api/health || true; printf '\n' ;;
  logs) require_env; compose logs --tail=200 app ;;
  *) usage; [[ -n "${1:-}" ]] && exit 1 || true ;;
esac
