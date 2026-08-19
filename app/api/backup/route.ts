import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAdmin();
  const [platforms, slots, members, renewals, users, settings] = await Promise.all([
    prisma.platform.findMany(), prisma.parkingSlot.findMany({ select: { id: true, platformId: true, slotNumber: true, accountEmail: true, cardLast4: true, billingDay: true, capacity: true, status: true, note: true, createdAt: true, updatedAt: true } }),
    prisma.member.findMany(), prisma.renewal.findMany(), prisma.user.findMany({ select: { id: true, username: true, role: true, status: true, createdAt: true, updatedAt: true } }), prisma.setting.findMany(),
  ]);
  const body = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), platforms, slots, members, renewals: renewals.map((r) => ({ ...r, amount: r.amount.toString() })), users, settings }, null, 2);
  return new Response(body, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="parking-backup-${new Date().toISOString().slice(0, 10)}.json"` } });
}
