# 车位管理系统

用于管理 Netflix、Spotify、HBO 等共享订阅账号、成员席位、续费记录和到期提醒的后台系统。

## 功能

- 总览统计、到期提醒和全局搜索
- 共享账号表格、看板、日历三种视图
- 成员席位分配、退出、续费和历史记录
- 平台账号密码加密存储、按权限查看和复制
- 车友、续费、数据统计和操作日志
- 管理员与操作员权限
- 完整数据备份与恢复
- 页面检查更新和一键升级
- Docker Compose + PostgreSQL 容器化部署

## 一键安装

服务器需要提前安装：

- Linux（推荐 Ubuntu、Debian）
- Docker 和 Docker Compose Plugin
- Git、curl、OpenSSL
- root 权限或 sudo

使用公开仓库一键拉取代码并安装：

```bash
curl -fsSL https://raw.githubusercontent.com/zxyszx/parking-space-manager/main/bootstrap.sh | sudo bash
```

安装过程中会要求设置管理员账号和密码。代码默认安装到 `/opt/parking-space-manager`，容器启动后访问：

```text
http://服务器IP:3000
```

脚本只拉取代码、生成密钥并启动 Docker 容器，不会绑定域名、修改 Nginx 或申请证书。

### 在 1Panel 中使用

1. 打开 1Panel 的“网站”，创建一个反向代理网站。
2. 代理地址填写 `http://127.0.0.1:3000`。
3. 在 1Panel 中绑定自己的域名。
4. 在 1Panel 中申请并启用 HTTPS 证书。

应用、数据库和数据卷仍由 Docker Compose 管理，网站反代与证书由 1Panel 管理。

### 自定义安装目录或端口

更换安装目录：

```bash
curl -fsSL https://raw.githubusercontent.com/zxyszx/parking-space-manager/main/bootstrap.sh | sudo PARKING_INSTALL_DIR=/opt/my-parking bash
```

安装完成后可编辑 `/opt/parking-space-manager/.env.production` 中的 `APP_PORT`，再执行：

```bash
cd /opt/parking-space-manager
sudo ./install.sh update
```

## 更新

管理员进入“系统设置”，默认就会看到“更新与备份”页面。点击“检查更新”后可直接升级；升级前系统会自动备份数据库，构建失败会恢复旧版本。

也可以在服务器执行：

```bash
cd /opt/parking-space-manager
sudo ./install.sh update
```

## 备份与恢复

网页中的“系统设置 > 更新与备份”支持下载和恢复完整 JSON 备份。

服务器数据库备份：

```bash
cd /opt/parking-space-manager
sudo ./install.sh backup
```

恢复指定数据库备份：

```bash
cd /opt/parking-space-manager
sudo ./install.sh restore backups/parking-年月日时间.dump
```

恢复时必须保留原来的 `.env.production`，尤其是 `ENCRYPTION_KEY`，否则无法解密已经保存的平台密码。

## 常用管理命令

```bash
cd /opt/parking-space-manager
sudo ./install.sh status   # 查看容器和健康状态
sudo ./install.sh logs     # 查看应用日志
sudo ./install.sh backup   # 立即备份数据库
sudo ./install.sh update   # 拉取、备份并升级
```

## 手动安装

不使用远程引导脚本时：

```bash
sudo git clone https://github.com/zxyszx/parking-space-manager.git /opt/parking-space-manager
cd /opt/parking-space-manager
sudo ./install.sh install
```

## 本地开发

需要 Node.js 22.18+ 和 PostgreSQL 15+：

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

访问 `http://localhost:3000`。本地 Seed 测试账号为 `admin`，密码为 `Parking@2026`，不要在生产环境使用这个密码。

## 质量检查

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

更完整的迁移、回滚和故障排查说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 开源协议

[MIT License](./LICENSE)
