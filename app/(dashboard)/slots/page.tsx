import { PageHeader } from "@/components/ui";
import { SlotManager, type SlotItem } from "@/components/slot-manager";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "车位管理" };

export default async function SlotsPage({ searchParams }: { searchParams: Promise<{ platform?: string; open?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const [platforms, rows] = await Promise.all([
    prisma.platform.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" } }),
    prisma.parkingSlot.findMany({
      where: params.platform ? { platform: { slug: params.platform } } : undefined,
      include: { platform: true, members: { orderBy: { expireDate: "asc" } }, renewals: { include: { member: { select: { nickname: true } } }, orderBy: { createdAt: "desc" } } },
      orderBy: [{ platform: { name: "asc" } }, { slotNumber: "asc" }],
    }),
  ]);
  const slots: SlotItem[] = rows.map((slot) => ({
    ...slot,
    createdAt: undefined,
    updatedAt: undefined,
    encryptedPassword: undefined,
    members: slot.members.map((m) => ({ ...m, startDate: m.startDate.toISOString(), expireDate: m.expireDate.toISOString(), createdAt: undefined, updatedAt: undefined, slotId: undefined })),
    renewals: slot.renewals.map((r) => ({ ...r, amount: r.amount.toString(), oldExpireDate: r.oldExpireDate.toISOString(), newExpireDate: r.newExpireDate.toISOString(), createdAt: r.createdAt.toISOString(), memberId: undefined, slotId: undefined, operatorId: undefined, months: undefined, note: undefined })),
    platform: { id: slot.platform.id, name: slot.platform.name, slug: slot.platform.slug, defaultCapacity: slot.platform.defaultCapacity },
  })) as unknown as SlotItem[];
  const closeHref = params.platform ? `/slots?platform=${encodeURIComponent(params.platform)}` : "/slots";
  return <div className="mx-auto max-w-[1800px] space-y-4"><PageHeader title={params.platform ? `${rows[0]?.platform.name || "平台"} · 车位管理` : "车位管理"} description="统一管理账号容量、车友与到期信息" /><SlotManager key={`${params.platform || "all"}:${params.open || "closed"}`} slots={slots} platforms={platforms.map((p) => ({ id: p.id, name: p.name, slug: p.slug, defaultCapacity: p.defaultCapacity }))} initialOpen={params.open} closeHref={closeHref} canDelete={user.role === "ADMIN"} /></div>;
}
