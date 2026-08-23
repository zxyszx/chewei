# 日本服务器部署说明

本文以 Ubuntu / Debian 服务器和 Docker Compose 为例。数据库只在容器网络内开放，不暴露公网端口。

## 推荐：一键脚本

```bash
chmod +x install.sh
./install.sh install
```

首次安装会生成生产密钥、启动服务，并提示选择 Web 模式：

1. 自动配置 Nginx + SSL：适合没有现有 Web 面板且 `80/443` 未占用的服务器。
2. 1Panel / 宝塔 / 已有 Nginx 反代：应用仅绑定 `127.0.0.1:3000`，脚本生成 `reverse-proxy.conf` 参考文件。
3. 仅 HTTP 测试：直接开放 `3000`，不适合正式公网使用。

常用维护命令：

```bash
./install.sh update
./install.sh backup
./install.sh status
./install.sh logs
./install.sh web 2 parking.example.com
```

`update` 会先生成并校验 PostgreSQL 备份，再构建镜像、执行迁移和健康检查。失败时会恢复旧应用镜像，并保留数据库备份供明确回滚。

## 1. 准备服务器

安装 Docker Engine 和 Compose Plugin，并确认：

```bash
docker --version
docker compose version
git --version
```

防火墙只需开放 SSH 和应用端口；直接测试时开放 `3000/tcp`，绑定域名后建议仅开放 `80/443`。

## 2. 拉取私有仓库

推荐为服务器配置 GitHub Deploy Key，然后执行：

```bash
git clone git@github.com:zxyszx/parking-space-manager.git
cd parking-space-manager
```

也可以使用只具备该仓库读取权限的 GitHub fine-grained token，不要把 token 写进仓库。

## 3. 配置生产环境

```bash
cp .env.production.example .env.production
openssl rand -base64 48
openssl rand -hex 32
```

将生成值和强密码写入 `.env.production`：

```dotenv
POSTGRES_PASSWORD=建议使用 openssl rand -hex 24 生成的数据库密码
AUTH_SECRET=上一步生成的会话密钥
ENCRYPTION_KEY=上一步生成的64位十六进制密钥
ADMIN_USERNAME=admin
ADMIN_PASSWORD=高强度管理员密码
SESSION_COOKIE_SECURE=false
APP_PORT=3000
```

限制文件权限：

```bash
chmod 600 .env.production
```

`ENCRYPTION_KEY` 用于解密共享账号密码，投入真实数据后必须安全备份；丢失后数据库中的密码无法恢复。

## 4. 构建并启动

```bash
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

应用启动时会自动运行数据库迁移。首次测试环境再执行一次 Seed：

```bash
docker compose --env-file .env.production exec app npm run db:seed
```

Seed 只用于首次测试数据初始化；检测到已有共享账号时会跳过，不要在正式运营后强制重置。

## 5. 验证

```bash
curl -fsS http://127.0.0.1:3000/api/health
docker compose --env-file .env.production logs --tail=100 app
```

健康检查应返回：

```json
{ "status": "ok", "database": "connected" }
```

然后访问 `http://服务器IP:3000`，使用 `.env.production` 中的管理员账号登录，验证新建共享账号、添加车友、续费和 JSON 备份。该方式只用于临时测试；HTTP 无法保护登录密码，浏览器密码管理器也会显示安全警告。

## 6. 更新版本

```bash
git pull --ff-only
docker compose --env-file .env.production up -d --build
docker image prune -f
```

迁移随新容器启动自动执行。

## 7. 备份与恢复

数据库备份：

```bash
docker compose --env-file .env.production exec -T db pg_dump -U parking -d parking_manager -Fc > parking-$(date +%F).dump
```

恢复前先停止应用写入，再执行：

```bash
docker compose --env-file .env.production stop app
docker compose --env-file .env.production exec -T db pg_restore -U parking -d parking_manager --clean --if-exists < parking-2026-08-20.dump
docker compose --env-file .env.production start app
```

建议每日异机备份数据库，同时备份 `.env.production` 中的 `ENCRYPTION_KEY`。

## 8. 域名与 HTTPS

生产环境建议在前面使用 Caddy 或 Nginx，将域名反向代理到 `127.0.0.1:3000`。Caddy 示例：

```caddyfile
parking.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

启用反向代理后，将 `.env.production` 中的 `SESSION_COOKIE_SECURE` 改为 `true`，再重建应用容器。把 `APP_PORT` 仅绑定本机，或通过防火墙关闭公网 `3000` 端口。
