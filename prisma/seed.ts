import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PaymentMethod, UserRole } from "../generated/prisma/client";
import { hash } from "bcryptjs";
import { createCipheriv, randomBytes } from "node:crypto";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

function encrypt(value: string) {
  const raw = process.env.ENCRYPTION_KEY!;
  if (!/^[a-f0-9]{64}$/i.test(raw)) throw new Error("ENCRYPTION_KEY 必须是 64 位十六进制字符串");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(raw, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

const d = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function main() {
  const existingSlots = await prisma.parkingSlot.count();
  if (existingSlots > 0 && process.env.FORCE_SEED !== "true") {
    console.log(`检测到 ${existingSlots} 个现有车位，已跳过 Seed。需要重置测试数据时使用 FORCE_SEED=true。`);
    return;
  }
  await prisma.operationLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.renewal.deleteMany();
  await prisma.member.deleteMany();
  await prisma.parkingSlot.deleteMany();
  await prisma.platform.deleteMany();

  const admin = await prisma.user.upsert({
    where: { username: process.env.ADMIN_USERNAME || "admin" },
    update: { passwordHash: await hash(process.env.ADMIN_PASSWORD || "Parking@2026", 12), role: UserRole.ADMIN },
    create: {
      username: process.env.ADMIN_USERNAME || "admin",
      passwordHash: await hash(process.env.ADMIN_PASSWORD || "Parking@2026", 12),
      role: UserRole.ADMIN,
    },
  });

  const platformData = [
    ["Netflix", "netflix", 5], ["Spotify", "spotify", 6], ["HBO", "hbo", 5],
    ["Disney+", "disney-plus", 7], ["Tidal", "tidal", 6], ["Prime Video", "prime-video", 6],
    ["iQIYI", "iqiyi", 5], ["ViKi", "viki", 4],
  ] as const;
  const platforms = new Map<string, string>();
  for (const [name, slug, defaultCapacity] of platformData) {
    const platform = await prisma.platform.create({ data: { name, slug, defaultCapacity } });
    platforms.set(slug, platform.id);
  }

  const netflixId = platforms.get("netflix")!;
  const emails = [
    "naifei01@seek.li", "naifei02@seek.li", "naifei03@seek.li", "naifei04@seek.li", "naifei05@seek.li",
    "naifei06@seek.li", "520szxus@gmail.com", "AmMason001@outlook.com", "mason009@seek.li", "netflix01@newszxcn.com",
  ];
  const billingDays = [22, 18, 10, 13, 12, 19, 11, 14, 1, 4];
  const slots = [];
  for (let i = 0; i < 10; i++) {
    slots.push(await prisma.parkingSlot.create({
      data: {
        platformId: netflixId,
        slotNumber: i + 1,
        accountEmail: emails[i],
        encryptedPassword: encrypt(i === 4 ? "Wsx123456@" : `Demo${i + 1}@2026`),
        cardLast4: i === 0 ? "6253" : i === 4 ? "5317" : String(6100 + i),
        billingDay: billingDays[i],
        capacity: 5,
        note: i === 4 ? "核心测试车位" : null,
      },
    }));
  }

  const slotFiveMembers = [
    ["HYX", "hyxnbwd666", "2026-09-29", "2026-10-29"],
    ["MzS", "MzSeGrEx", "2026-09-16", "2026-10-16"],
    ["w1249098", "w1249098", "2026-08-19", "2026-09-19"],
    ["Jack", "mayunshiwo666", "2026-09-21", "2026-10-21"],
    ["demo_test", "demo_test", "2026-09-29", "2026-10-29"],
  ];
  const memberRecords = [];
  for (const [nickname, contact, startDate, expireDate] of slotFiveMembers) {
    memberRecords.push(await prisma.member.create({ data: { slotId: slots[4].id, nickname, contact, startDate: d(startDate), expireDate: d(expireDate) } }));
  }

  const expiries = ["2026-08-15", "2026-08-22", "2026-08-23", "2026-08-27", "2026-09-05", "2026-10-01"];
  for (let i = 0; i < 6; i++) {
    await prisma.member.create({
      data: { slotId: slots[i === 4 ? 5 : i].id, nickname: `测试车友${i + 1}`, contact: `contact_${i + 1}`, startDate: d("2026-07-01"), expireDate: d(expiries[i]) },
    });
  }
  await prisma.member.create({ data: { slotId: slots[9].id, nickname: "Master", contact: "master_contact", startDate: d("2026-08-15"), expireDate: d("2026-11-15") } });

  for (let i = 0; i < 3; i++) {
    const oldDate = d(["2026-07-29", "2026-08-16", "2026-08-19"][i]);
    const newDate = d(["2026-08-29", "2026-09-16", "2026-09-19"][i]);
    await prisma.renewal.create({
      data: { memberId: memberRecords[i].id, slotId: slots[4].id, oldExpireDate: oldDate, newExpireDate: newDate, months: 1, amount: 90, paymentMethod: PaymentMethod.WECHAT, operatorId: admin.id, note: "Seed 测试续费" },
    });
  }

  for (const [index, slug] of ["spotify", "hbo", "disney-plus", "tidal", "prime-video", "iqiyi", "viki"].entries()) {
    await prisma.parkingSlot.create({
      data: { platformId: platforms.get(slug)!, slotNumber: 1, accountEmail: `${slug}@example.com`, encryptedPassword: encrypt(`Demo-${slug}`), billingDay: index + 5, capacity: platformData.find((item) => item[1] === slug)![2] },
    });
  }

  await prisma.setting.upsert({ where: { key: "reminderDays" }, update: { value: [3, 7, 15, 30] }, create: { key: "reminderDays", value: [3, 7, 15, 30] } });
  await prisma.operationLog.create({ data: { userId: admin.id, action: "SEED_DATABASE", resourceType: "system", detail: { message: "初始化测试数据" }, ip: "127.0.0.1" } });
}

main().finally(() => prisma.$disconnect());
