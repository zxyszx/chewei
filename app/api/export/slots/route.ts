import { requireUser } from "@/lib/auth";
import { slotStatus } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET() {
  await requireUser();
  const slots = await prisma.parkingSlot.findMany({ include: { platform: true, members: { where: { status: "ACTIVE" }, orderBy: { expireDate: "asc" } } }, orderBy: [{ platform: { name: "asc" } }, { slotNumber: "asc" }] });
  const header = ["车号", "平台", "主账号", "状态", "容量", "续费日", "卡尾号", "最近到期", "备注"];
  const rows = slots.map((slot) => [slot.slotNumber, slot.platform.name, slot.accountEmail, slotStatus(slot.capacity, slot.members.length, slot.status), `${slot.members.length}/${slot.capacity}`, slot.billingDay, slot.cardLast4, slot.members[0]?.expireDate.toISOString().slice(0, 10) || "", slot.note]);
  const body = `\uFEFF${[header, ...rows].map((row) => row.map(csv).join(",")).join("\r\n")}`;
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="parking-slots-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
