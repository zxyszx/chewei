import { PageHeader } from "@/components/ui";
import { SlotManager, type SlotItem } from "@/components/slot-manager";
import { PlatformIcon } from "@/components/platform-icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "车位管理" };

export default async function SlotsPage({ searchParams }: { searchParams: Promise<{ platform?: string; open?: string; create?: string }> }) {
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
  const currentPlatform = params.platform ? platforms.find((platform) => platform.slug === params.platform) : undefined;
  const slots: SlotItem[] = rows.map((slot) => ({
    ...slot,
    createdAt: undefined,
    updatedAt: undefined,
    encryptedPassword: undefined,
    members: slot.members.map((m) => ({ ...m, startDate: m.startDate.toISOString(), expireDate: m.expireDate.toISOString(), createdAt: undefined, updatedAt: undefined, slotId: undefined })),
    renewals: slot.renewals.map((r) => ({ ...r, amount: r.amount.toString(), oldExpireDate: r.oldExpireDate.toISOString(), newExpireDate: r.newExpireDate.toISOString(), createdAt: r.createdAt.toISOString(), memberId: undefined, slotId: undefined, operatorId: undefined, months: undefined, note: undefined })),
    platform: { id: slot.platform.id, name: slot.platform.name, slug: slot.platform.slug, icon: slot.platform.icon, defaultCapacity: slot.platform.defaultCapacity },
  })) as unknown as SlotItem[];
  const closeHref = params.platform ? `/slots?platform=${encodeURIComponent(params.platform)}` : "/slots";
  return <div className="mx-auto max-w-[1800px] space-y-4"><PageHeader title={currentPlatform ? `${currentPlatform.name} · 车位管理` : "车位管理"} description={currentPlatform ? `管理 ${currentPlatform.name} 车位资源、成员与续费信息` : "管理所有平台的账号容量、车友与到期信息"} leading={currentPlatform ? <PlatformIcon slug={currentPlatform.slug} name={currentPlatform.name} icon={currentPlatform.icon} size={24} className="border border-[var(--border)]" /> : undefined} /><SlotManager key={`${params.platform || "all"}:${params.open || "closed"}:${params.create || "idle"}`} slots={slots} platforms={platforms.map((p) => ({ id: p.id, name: p.name, slug: p.slug, icon: p.icon, defaultCapacity: p.defaultCapacity }))} initialOpen={params.open} initialCreate={params.create === "1"} closeHref={closeHref} singlePlatform={Boolean(params.platform)} platformSlug={params.platform} canDelete={user.role === "ADMIN"} /></div>;
}
