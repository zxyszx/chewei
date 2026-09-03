#!/usr/bin/env bash
set -Eeuo pipefail

INSTALL_DIR="${PARKING_INSTALL_DIR:-/opt/chewei}"
REPOSITORY_URL="https://github.com/zxyszx/chewei.git"

log() { printf '[车位系统] %s\n' "$*"; }
fail() { printf '[错误] %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || fail "缺少 Git，请先安装 Git"
command -v docker >/dev/null 2>&1 || fail "缺少 Docker，请先在 1Panel 或服务器中安装 Docker"
docker compose version >/dev/null 2>&1 || fail "缺少 Docker Compose Plugin"

if [[ -d "${INSTALL_DIR}/.git" ]]; then
  log "检测到已有仓库，将继续使用 ${INSTALL_DIR}"
elif [[ -e "${INSTALL_DIR}" ]] && [[ -n "$(ls -A "${INSTALL_DIR}" 2>/dev/null)" ]]; then
  fail "安装目录 ${INSTALL_DIR} 已存在且不为空，请更换 PARKING_INSTALL_DIR"
else
  log "正在从公开仓库拉取代码..."
  mkdir -p "$(dirname "${INSTALL_DIR}")"
  git clone --branch main --single-branch "${REPOSITORY_URL}" "${INSTALL_DIR}"
fi

cd "${INSTALL_DIR}"
chmod +x install.sh
exec ./install.sh install
