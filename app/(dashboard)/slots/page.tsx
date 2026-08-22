import { Plus } from "lucide-react";
import Link from "next/link";
import { SlotManager, type SlotItem } from "@/components/slot-manager";
import { PlatformIcon } from "@/components/platform-icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "合租车位" };

export default async function SlotsPage({ searchParams }: { searchParams: Promise<{ platform?: string; open?: string; create?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const [platforms, rows] = await Promise.all([
    prisma.platform.findMany({ where: { status: "ACTIVE" }, include: { _count: { select: { parkingSlots: true } } }, orderBy: { createdAt: "asc" } }),
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
    platform: { id: slot.platform.id, name: slot.platform.name, slug: slot.platform.slug, icon: slot.platform.icon, defaultCapacity: slot.platform.defaultCapacity },
  })) as unknown as SlotItem[];
  const closeHref = params.platform ? `/slots?platform=${encodeURIComponent(params.platform)}` : "/slots";
  return <div className="mx-auto max-w-[1800px] space-y-4">
    <nav className="platform-tabs" aria-label="合租车位工作表">
      <Link href="/settings#platforms" className="platform-tab-add" aria-label="管理平台" title="管理平台"><Plus size={16} /></Link>
      <Link href="/slots" scroll={false} aria-current={!params.platform ? "page" : undefined} className={!params.platform ? "platform-tab platform-tab-active" : "platform-tab"}>全部车位<span>{platforms.reduce((sum, item) => sum + item._count.parkingSlots, 0)}</span></Link>
      {platforms.map((platform) => <Link key={platform.id} href={`/slots?platform=${encodeURIComponent(platform.slug)}`} scroll={false} aria-current={params.platform === platform.slug ? "page" : undefined} className={params.platform === platform.slug ? "platform-tab platform-tab-active" : "platform-tab"}><PlatformIcon slug={platform.slug} name={platform.name} icon={platform.icon} size={16} />{platform.name}<span>{platform._count.parkingSlots}</span></Link>)}
    </nav>
    <SlotManager key={`${params.platform || "all"}:${params.open || "closed"}:${params.create || "idle"}`} slots={slots} platforms={platforms.map((p) => ({ id: p.id, name: p.name, slug: p.slug, icon: p.icon, defaultCapacity: p.defaultCapacity }))} initialOpen={params.open} initialCreate={params.create === "1"} closeHref={closeHref} singlePlatform={Boolean(params.platform)} platformSlug={params.platform} canDelete={user.role === "ADMIN"} />
  </div>;
}
