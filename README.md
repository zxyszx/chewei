# 车位管理系统

面向 Netflix、Spotify、HBO 等共享订阅平台的车位管理后台。系统以关系型数据管理车位、车友、续费历史和到期提醒，状态由容量和在位车友自动计算。

## 已实现功能

- 总览统计、近期车位和到期提醒
- 车位表格 / 看板 / 日历三种视图
- 车位详情抽屉、账号密码加密查看和复制
- 车友添加、满员限制、退出、续费及历史留档
- 跨平台车友管理、到期提醒和全局 `Command/Ctrl + K` 搜索
- 账号管理、续费记录、数据统计和操作日志
- 车位 CSV、续费 Excel、全量 JSON 备份
- `admin` / `operator` 后端权限预留
- Docker Compose + PostgreSQL 一键部署

## 技术栈

- Next.js、React、TypeScript、Tailwind CSS
- Prisma ORM、PostgreSQL
- React Hook Form、Zod、date-fns
- Recharts、ExcelJS、Lucide Icons
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

首次使用前应在 `.env` 中更换密码和密钥。Seed 检测到已有车位时会自动跳过；只有明确重置测试数据时才使用 `FORCE_SEED=true npm run db:seed`。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接地址 |
| `AUTH_SECRET` | 登录会话密钥，至少 32 位 |
| `ENCRYPTION_KEY` | 账号密码 AES-256-GCM 密钥，64 位十六进制 |
| `ADMIN_USERNAME` | Seed 创建的管理员账号 |
| `ADMIN_PASSWORD` | Seed 创建的管理员密码 |
| `TZ` | 时区，推荐 `Asia/Shanghai` |

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

生产部署请按 [DEPLOYMENT.md](./DEPLOYMENT.md) 操作。
