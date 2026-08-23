# 车位管理系统

面向 Netflix、Spotify、HBO 等共享订阅平台的账号管理后台。系统统一管理共享账号、成员席位、续费历史和到期提醒，状态由席位数和在位车友自动计算。

## 已实现功能

- 总览统计、近期共享账号和到期提醒
- 共享账号表格 / 看板 / 日历三种视图
- 共享账号详情抽屉、账号密码加密查看和复制
- 车友添加、满员限制、退出、续费及历史留档
- 跨平台车友管理、到期提醒和全局 `Command/Ctrl + K` 搜索
- 共享账号、成员席位、续费记录、数据统计和操作日志
- 全量 JSON 数据备份
- `admin` / `operator` 后端权限预留
- Docker Compose + PostgreSQL 一键部署、备份、更新与回滚

## 技术栈

- Next.js、React、TypeScript、Tailwind CSS
- Prisma ORM、PostgreSQL
- React Hook Form、Zod、date-fns
- Recharts、Lucide Icons
- Vitest、ESLint

## 本地开发

要求 Node.js 20.9+ 和 PostgreSQL 15+。

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
| `ADMIN_USERNAME`        | Seed 创建的管理员账号                                         |
| `ADMIN_PASSWORD`        | Seed 创建的管理员密码                                         |
| `SESSION_COOKIE_SECURE` | 直接使用 HTTP IP 测试时设为 `false`；启用 HTTPS 后设为 `true` |
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
./install.sh install
```

脚本提供三种 Web 模式：自动 Nginx + SSL、1Panel/宝塔/已有 Nginx 反代、仅 HTTP 测试。已安装环境更新时执行：

```bash
./install.sh update
```

生产部署、备份和回滚说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)。
