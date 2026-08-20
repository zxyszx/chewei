import { requireUser } from "@/lib/auth";
import { databaseToday, dayDiff, expiryLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  await requireUser();
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") || "").toLowerCase();
  const platform = params.get("platform") || "";
  const status = params.get("status") || "";
  const expiry = params.get("expiry") || "";
  const today = databaseToday();
  const records = await prisma.member.findMany({ include: { slot: { include: { platform: true } }, renewals: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" } });
  const members = records.filter((member) => {
    const text = `${member.nickname} ${member.contact} ${member.slot.accountEmail}`.toLowerCase();
    const days = dayDiff(member.expireDate, today);
    const expiryMatch = !expiry || (expiry === "expired" ? days < 0 : days >= 0 && days <= Number(expiry));
    return (!query || text.includes(query)) && (!platform || member.slot.platform.slug === platform) && (!status || member.status === status) && expiryMatch;
  });
  const header = ["车友", "联系方式", "平台", "车位号", "主账号", "开始日期", "到期日期", "状态", "最近续费", "备注"];
  const rows = members.map((member) => [member.nickname, member.contact, member.slot.platform.name, member.slot.slotNumber, member.slot.accountEmail, member.startDate.toISOString().slice(0, 10), member.expireDate.toISOString().slice(0, 10), member.status === "EXITED" ? "已退出" : expiryLabel(member.expireDate, today).text, member.renewals[0]?.createdAt.toISOString().slice(0, 10) || "", member.note]);
  const body = `\uFEFF${[header, ...rows].map((row) => row.map(csv).join(",")).join("\r\n")}`;
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="members-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
