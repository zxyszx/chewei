import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!await getCurrentUser()) return Response.json({ items: [] }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80);
  if (!query) return Response.json({ items: [] });

  const [slots, members] = await Promise.all([
    prisma.parkingSlot.findMany({
      where: { OR: [
        { accountEmail: { contains: query, mode: "insensitive" } },
        { note: { contains: query, mode: "insensitive" } },
        { platform: { name: { contains: query, mode: "insensitive" } } },
      ] },
      include: { platform: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.member.findMany({
      where: { OR: [
        { nickname: { contains: query, mode: "insensitive" } },
        { contact: { contains: query, mode: "insensitive" } },
        { note: { contains: query, mode: "insensitive" } },
      ] },
      include: { slot: { include: { platform: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  return Response.json({ items: [
    ...slots.map((slot) => ({ id: slot.id, type: "共享账号" as const, title: slot.accountEmail, subtitle: `${slot.platform.name} · 账号 #${slot.slotNumber}`, href: `/slots?platform=${slot.platform.slug}&open=${slot.id}` })),
    ...members.map((member) => ({ id: member.id, type: "车友" as const, title: member.nickname, subtitle: `${member.contact} · ${member.slot.platform.name} 账号 #${member.slot.slotNumber}`, href: `/slots?platform=${member.slot.platform.slug}&open=${member.slotId}` })),
  ].slice(0, 12) }, { headers: { "cache-control": "private, no-store" } });
}
