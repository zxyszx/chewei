# Docker + 1Panel 部署

仓库只负责启动应用和 PostgreSQL，不修改 Nginx、不申请证书、不绑定域名。域名、HTTPS 和反向代理全部在 1Panel 中管理。

## 一键安装

服务器需要 Git、Docker Engine 和 Docker Compose Plugin。

```bash
git clone https://github.com/zxyszx/chewei.git
cd chewei
chmod +x install.sh
sudo ./install.sh install
```

首次只会询问管理员账号和密码，其余密钥自动生成。包括 Server Action 密钥在内的密钥会跨版本保留，避免更新后旧页面操作失效。默认对外提供 `3311` 端口，可在 `.env.production` 修改 `APP_PORT`。

## 在 1Panel 中反代

1. 新建一个“反向代理”网站。
2. 代理地址填写 `http://127.0.0.1:3311`。
3. 在 1Panel 中绑定域名、申请证书并开启 HTTPS。
4. 保留 `Host` 头，并让 1Panel 传递 `X-Forwarded-Proto`。

`SESSION_COOKIE_SECURE` 默认留空，应用会根据 1Panel 传入的 HTTPS 协议自动设置安全 Cookie。

## 网页更新

root 用户执行一键安装时，脚本会安装一个受限的 systemd 文件监视器。设置页的“立即更新”只会写入请求文件，应用容器不会挂载 Docker Socket。宿主机收到请求后会：

1. 检查仓库是否有未提交修改。
2. 拉取 GitHub `main` 分支并仅允许快进更新。
3. 备份和校验 PostgreSQL。
4. 重建镜像、迁移数据库并执行健康检查。

也可手动执行：

```bash
sudo ./install.sh update
```

## 备份与恢复

设置页支持下载完整 JSON 备份和恢复。JSON 包含加密后的平台密码和管理员密码哈希，必须与原服务器使用相同的 `ENCRYPTION_KEY`。

宿主机级 PostgreSQL 备份：

```bash
sudo ./install.sh backup
sudo ./install.sh restore backups/parking-20260903T120000Z.dump
```

请异机保存 `backups/` 和 `.env.production`。丢失 `ENCRYPTION_KEY` 后，已保存的平台密码无法解密。

## 常用命令

```bash
sudo ./install.sh status
sudo ./install.sh logs
sudo ./install.sh backup
sudo ./install.sh update
```
