import { addDays } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [platformRows, reminderCount, slots, members] = await Promise.all([
    prisma.platform.findMany({ where: { status: "ACTIVE" }, include: { _count: { select: { parkingSlots: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.member.count({ where: { status: "ACTIVE", expireDate: { lte: addDays(new Date(), 30) } } }),
    prisma.parkingSlot.findMany({ include: { platform: true }, orderBy: [{ platform: { name: "asc" } }, { slotNumber: "asc" }] }),
    prisma.member.findMany({ include: { slot: { include: { platform: true } } }, orderBy: { updatedAt: "desc" } }),
  ]);
  const searchItems = [
    ...slots.flatMap((slot) => [
      { id: slot.id, type: "车位" as const, title: `${slot.platform.name} #${slot.slotNumber}`, subtitle: slot.accountEmail, href: `/slots?open=${slot.id}` },
      { id: `${slot.id}-account`, type: "账号" as const, title: slot.accountEmail, subtitle: `${slot.platform.name} · 车位 #${slot.slotNumber}`, href: `/accounts?open=${slot.id}` },
    ]),
    ...members.map((member) => ({ id: member.id, type: "车友" as const, title: member.nickname, subtitle: `${member.contact} · ${member.slot.platform.name} #${member.slot.slotNumber}`, href: `/members?q=${encodeURIComponent(member.contact)}` })),
  ];
  return <AppShell platforms={platformRows.map((p) => ({ id: p.id, name: p.name, slug: p.slug, count: p._count.parkingSlots }))} reminderCount={reminderCount} username={user.username} role={user.role} searchItems={searchItems}>{children}</AppShell>;
}
