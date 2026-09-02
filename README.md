# 车位管理系统

面向 Netflix、Spotify、HBO 等共享订阅平台的账号管理后台。系统统一管理共享账号、成员席位、续费历史和到期提醒，状态由席位数和在位车友自动计算。

## 已实现功能

- 总览统计、近期共享账号和到期提醒
- 共享账号表格 / 看板 / 日历三种视图
- 共享账号详情抽屉、账号密码加密查看和复制
- 车友添加、满员限制、退出、续费及历史留档
- 跨平台车友管理、到期提醒和全局 `Command/Ctrl + K` 搜索
- 共享账号、成员席位、续费记录、数据统计和操作日志
- 完整 JSON 备份与事务恢复（含加密账号数据）
- `admin` / `operator` 后端权限预留
- Docker Compose + PostgreSQL 一键部署、备份恢复与网页更新

## 技术栈

- Next.js、React、TypeScript、Tailwind CSS
- Prisma ORM、PostgreSQL
- React Hook Form、Zod、date-fns
- Recharts、Lucide Icons
- Vitest、ESLint

## 本地开发

要求 Node.js 22.18+ 和 PostgreSQL 15+。服务器一键安装使用内置的 Node.js 24 容器，不需要在宿主机另行安装 Node.js。

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

访问 `http://localhost:3000`。Seed 默认创建本地测试管理员：

- 账号：`admin`
- 密码：`Parking@2026`

首次使用前应在 `.env` 中更换密码和密钥。Seed 检测到已有共享账号时会自动跳过；只有明确重置测试数据时才使用 `FORCE_SEED=true npm run db:seed`。

## 环境变量

| 变量                    | 用途                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL 连接地址                                           |
| `AUTH_SECRET`           | 登录会话密钥，至少 32 位                                      |
| `ENCRYPTION_KEY`        | 账号密码 AES-256-GCM 密钥，64 位十六进制                      |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | 固定 Server Action 加密密钥，32 字节 Base64       |
| `ADMIN_USERNAME`        | 首次容器启动时创建的管理员账号                           |
| `ADMIN_PASSWORD`        | 首次容器启动时创建的管理员密码                           |
| `SESSION_COOKIE_SECURE` | 留空时根据 1Panel 的 `X-Forwarded-Proto` 自动判断       |
| `TZ`                    | 时区，推荐 `Asia/Shanghai`                                    |

生成生产密钥：

```bash
openssl rand -base64 48  # AUTH_SECRET
openssl rand -hex 32     # ENCRYPTION_KEY
```

## 质量检查

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 一键部署

```bash
chmod +x install.sh
sudo ./install.sh install
```

脚本只启动容器和端口，不绑定域名、不修改 Nginx、不申请证书。在 1Panel 中反向代理到 `http://127.0.0.1:3000` 即可。已安装环境可在系统设置页更新，也可执行：

```bash
./install.sh update
```

生产部署、备份和恢复说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)。
