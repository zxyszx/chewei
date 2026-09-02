import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../generated/prisma/client";
import { hash } from "bcryptjs";

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 未设置`);
  return value;
}

const databaseUrl = requireEnvironment("DATABASE_URL");
const adminUsername = requireEnvironment("ADMIN_USERNAME");
const adminPassword = requireEnvironment("ADMIN_PASSWORD");
if (adminPassword.length < 10) throw new Error("ADMIN_PASSWORD 至少需要 10 位");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const defaultPlatforms = [
  ["Netflix", "netflix", 5],
  ["Spotify", "spotify", 6],
  ["HBO", "hbo", 5],
  ["Disney+", "disney-plus", 7],
  ["Tidal", "tidal", 6],
  ["Prime Video", "prime-video", 6],
  ["iQIYI", "iqiyi", 5],
  ["ViKi", "viki", 4],
  ["ChatGPT", "chatgpt", 5],
] as const;

async function main() {
  await prisma.$transaction(async (tx) => {
    const isFirstRun = (await tx.user.count()) === 0;
    if (isFirstRun) {
      await tx.user.create({
        data: {
          username: adminUsername,
          passwordHash: await hash(adminPassword, 12),
          role: UserRole.ADMIN,
        },
      });
      console.log(`已创建初始管理员：${adminUsername}`);

      for (const [name, slug, defaultCapacity] of defaultPlatforms) {
        await tx.platform.upsert({
          where: { slug },
          update: {},
          create: { name, slug, defaultCapacity },
        });
      }

      await tx.setting.upsert({
        where: { key: "reminderDays" },
        update: {},
        create: { key: "reminderDays", value: [3, 7, 15, 30] },
      });
    } else {
      console.log("已存在系统用户，已跳过首次初始化。");
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
