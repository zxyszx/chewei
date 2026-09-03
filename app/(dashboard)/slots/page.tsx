import { Plus } from "lucide-react";
import Link from "next/link";
import { SlotManager, type SlotItem } from "@/components/slot-manager";
import { PlatformIcon } from "@/components/platform-icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "合租车位" };

export default async function SlotsPage({ searchParams }: { searchParams: Promise<{ platform?: string; open?: string; create?: string; status?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const [platforms, rows] = await Promise.all([
    prisma.platform.findMany({ where: { status: "ACTIVE" }, include: { _count: { select: { parkingSlots: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.parkingSlot.findMany({
      where: params.platform ? { platform: { slug: params.platform } } : undefined,
      select: {
        id: true,
        slotNumber: true,
        accountEmail: true,
        cardLast4: true,
        billingDay: true,
        capacity: true,
        status: true,
        note: true,
        platform: { select: { id: true, name: true, slug: true, icon: true, defaultCapacity: true } },
        members: {
          select: { id: true, nickname: true, contact: true, contactType: true, startDate: true, expireDate: true, status: true, seatNumber: true, note: true },
          orderBy: { expireDate: "asc" },
        },
        _count: { select: { renewals: true } },
      },
      orderBy: [{ platform: { name: "asc" } }, { slotNumber: "asc" }],
    }),
  ]);
  const slots: SlotItem[] = rows.map(({ _count, ...slot }) => ({
    ...slot,
    members: slot.members.map((member) => ({ ...member, startDate: member.startDate.toISOString(), expireDate: member.expireDate.toISOString() })),
    renewals: [],
    renewalCount: _count.renewals,
  }));
  const closeQuery = new URLSearchParams(); if (params.platform) closeQuery.set("platform", params.platform); if (params.status) closeQuery.set("status", params.status);
  const closeHref = closeQuery.size ? `/slots?${closeQuery}` : "/slots";
  const createHref = `${closeHref}${closeHref.includes("?") ? "&" : "?"}create=1`;
  const activeSlots = slots.filter((slot) => slot.status === "ACTIVE");
  const activeMembers = activeSlots.reduce((sum, slot) => sum + slot.members.filter((member) => member.status === "ACTIVE").length, 0);
  const totalCapacity = activeSlots.reduce((sum, slot) => sum + slot.capacity, 0);
  const currentPlatform = params.platform ? platforms.find((platform) => platform.slug === params.platform) : undefined;
  return <div className="slot-page mx-auto max-w-[1800px]">
    <header className="slot-page-header">
      <div className="min-w-0">
        <h1 className="page-title">{currentPlatform?.name || "合租车位"}</h1>
        <p className="page-description tabular">{slots.length} 个账号 · {activeMembers}/{totalCapacity} 个席位在用 · {Math.max(0, totalCapacity - activeMembers)} 个空位</p>
      </div>
      <Link href={createHref} scroll={false} className="btn btn-primary"><Plus size={16} />新增车位</Link>
    </header>
    <nav className="platform-tabs" aria-label="合租车位工作表">
      <Link href="/settings?tab=platforms" className="platform-tab-add" aria-label="管理平台" title="管理平台"><Plus size={16} /></Link>
      <Link href="/slots" scroll={false} aria-current={!params.platform ? "page" : undefined} className={!params.platform ? "platform-tab platform-tab-active" : "platform-tab"}>全部车位<span>{platforms.reduce((sum, item) => sum + item._count.parkingSlots, 0)}</span></Link>
      {platforms.map((platform) => <Link key={platform.id} href={`/slots?platform=${encodeURIComponent(platform.slug)}`} scroll={false} aria-current={params.platform === platform.slug ? "page" : undefined} className={params.platform === platform.slug ? "platform-tab platform-tab-active" : "platform-tab"}><PlatformIcon slug={platform.slug} name={platform.name} icon={platform.icon} size={16} />{platform.name}<span>{platform._count.parkingSlots}</span></Link>)}
    </nav>
    <SlotManager key={`${params.platform || "all"}:${params.status || "all"}:${params.open || "closed"}:${params.create || "idle"}`} slots={slots} platforms={platforms.map((p) => ({ id: p.id, name: p.name, slug: p.slug, icon: p.icon, defaultCapacity: p.defaultCapacity }))} initialOpen={params.open} initialCreate={params.create === "1"} initialStatus={params.status} closeHref={closeHref} singlePlatform={Boolean(params.platform)} platformSlug={params.platform} canDelete={user.role === "ADMIN"} />
  </div>;
}
