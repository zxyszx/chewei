import { requireUser } from "@/lib/auth";
import { slotStatus } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  await requireUser();
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") || "").trim().toLowerCase();
  const platform = params.get("platform") || "";
  const status = params.get("status") || "";
  const records = await prisma.parkingSlot.findMany({ where: platform ? { platform: { slug: platform } } : undefined, include: { platform: true, members: { where: { status: "ACTIVE" }, orderBy: { expireDate: "asc" } } }, orderBy: [{ platform: { name: "asc" } }, { slotNumber: "asc" }] });
  const slots = records.filter((slot) => {
    const derivedStatus = slotStatus(slot.capacity, slot.members.length, slot.status);
    const searchable = `${slot.slotNumber} ${slot.platform.name} ${slot.accountEmail} ${slot.note || ""} ${slot.members.map((member) => `${member.nickname} ${member.contact}`).join(" ")}`.toLowerCase();
    return (!query || searchable.includes(query)) && (!status || derivedStatus === status);
  });
  const header = ["账号编号", "平台", "登录账号", "状态", "成员席位", "平台续费日", "卡尾号", "成员最近到期", "备注"];
  const rows = slots.map((slot) => [slot.slotNumber, slot.platform.name, slot.accountEmail, slotStatus(slot.capacity, slot.members.length, slot.status), `${slot.members.length}/${slot.capacity}`, slot.billingDay, slot.cardLast4, slot.members[0]?.expireDate.toISOString().slice(0, 10) || "", slot.note]);
  const body = `\uFEFF${[header, ...rows].map((row) => row.map(csv).join(",")).join("\r\n")}`;
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="parking-slots-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
