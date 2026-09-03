# 车位管理系统

面向 Netflix、Spotify、Prime Video、ChatGPT 等共享订阅业务的自托管管理后台。集中管理平台账号、成员席位、到期提醒、续费收入、操作审计和数据备份。

## 主要功能

- 总览：账号、有效容量、在位席位、真实剩余席位、本月收入与待处理事项
- 合租车位：表格、看板、日历三种视图，支持席位分配、换位、退出与续费
- 车友与续费：多条件筛选、分页、CSV 导出和完整历史记录
- 提醒与统计：到期分组、平台利用率、近 6 个月收入和席位状态图表
- 安全与审计：平台密码加密、角色权限、敏感操作日志和详情追溯
- 系统管理：平台、管理员、提醒规则、完整备份恢复和网页更新
- 响应式界面：桌面侧栏、移动底部导航、深浅色主题和 PWA 安装

## 最快安装

适用于已经安装 Docker 的 Linux 服务器或 1Panel 主机。脚本只安装应用与 PostgreSQL，不绑定域名、不修改 Nginx，也不申请证书。

### 1. 准备环境

服务器需要：

- Linux（Ubuntu、Debian、Rocky Linux 等）
- Docker Engine 与 Docker Compose Plugin
- Git、curl、OpenSSL
- root 权限或可使用 sudo 的账号

在 1Panel 中可先通过“容器”页面安装 Docker。

### 2. 一键拉取并安装

```bash
curl -fsSL https://raw.githubusercontent.com/zxyszx/parking-space-manager/main/bootstrap.sh | sudo bash
```

安装时只需输入管理员账号和不少于 10 位的密码。脚本会自动：

1. 将公开仓库克隆到 `/opt/parking-space-manager`。
2. 生成数据库、登录、加密和 Server Action 密钥。
3. 构建应用镜像并启动 PostgreSQL 与应用容器。
4. 执行数据库迁移和初始化。
5. 配置受限的网页更新服务并完成健康检查。

安装完成后直接访问：

```text
http://服务器IP:3000
```

### 3. 使用 1Panel 配置域名和 HTTPS

1. 打开 1Panel 的“网站”，新建“反向代理”网站。
2. 代理地址填写 `http://127.0.0.1:3000`。
3. 绑定自己的域名。
4. 在 1Panel 中申请证书并开启 HTTPS。

域名、证书和反向代理全部由 1Panel 管理，应用容器无需设置域名。

## 自定义安装

指定安装目录：

```bash
curl -fsSL https://raw.githubusercontent.com/zxyszx/parking-space-manager/main/bootstrap.sh | sudo PARKING_INSTALL_DIR=/opt/my-parking bash
```

手动拉取公开仓库：

```bash
sudo git clone https://github.com/zxyszx/parking-space-manager.git /opt/parking-space-manager
cd /opt/parking-space-manager
sudo ./install.sh install
```

修改端口时编辑 `/opt/parking-space-manager/.env.production` 中的 `APP_PORT`，然后执行：

```bash
cd /opt/parking-space-manager
sudo ./install.sh update
```

## 更新

管理员可进入“系统设置 > 系统更新”，先检查 GitHub 最新版本，再点击“立即更新”。更新过程会自动备份并校验数据库、构建新镜像、执行迁移与健康检查；失败时恢复更新前镜像和数据库。

也可以在服务器手动更新：

```bash
cd /opt/parking-space-manager
sudo ./install.sh update
```

网页更新要求首次安装由 root 执行且服务器使用 systemd。若页面提示网页更新未启用，重新运行 `sudo ./install.sh install` 即可补充配置，不会清空现有数据。

## 备份与恢复

### 网页完整备份

进入“系统设置 > 数据备份”可创建并下载 JSON 完整备份，也可上传 JSON 进行恢复。该文件包含业务数据、管理员密码哈希以及加密后的平台密码。

恢复到新服务器时必须同时保留原服务器 `.env.production` 中的 `ENCRYPTION_KEY`，否则旧平台密码无法解密。恢复会覆盖当前数据并退出当前登录，请先下载当前备份。

### 服务器数据库灾备

```bash
cd /opt/parking-space-manager
sudo ./install.sh backup
sudo ./install.sh restore backups/parking-20260903T120000Z.dump
```

服务器备份会使用 PostgreSQL 自带格式创建并立即校验。建议异机保存 `/opt/parking-space-manager/backups/` 和 `.env.production`。

## 日常管理

```bash
cd /opt/parking-space-manager
sudo ./install.sh status   # 容器状态与健康检查
sudo ./install.sh logs     # 最近 200 行应用日志
sudo ./install.sh backup   # 创建并校验数据库备份
sudo ./install.sh update   # 备份、拉取、构建并升级
```

## 本地开发

需要 Node.js 22.18+ 和 PostgreSQL：

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

访问 `http://localhost:3000`。本地 Seed 账号为 `admin`，密码为 `Parking@2026`，生产环境请勿使用该密码。

提交前执行：

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

更多部署、回滚和故障排查说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 技术栈

Next.js、TypeScript、Tailwind CSS、Prisma、PostgreSQL、Docker Compose。

## 开源协议

[MIT License](./LICENSE)
