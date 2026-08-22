import { addDays, format, startOfMonth } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  CircleParking,
  CircleCheck,
  Clock3,
  ReceiptText,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { RenewButton } from "@/components/renew-button";
import type { MemberItem } from "@/components/slot-manager";
import { Badge, PageHeader } from "@/components/ui";
import {
  configuredReminderDays,
  databaseToday,
  expiryLabel,
  slotStatus,
} from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "总览" };

const operationNames: Record<string, string> = {
  CREATE_SLOT: "创建合租车位",
  UPDATE_SLOT: "编辑合租车位",
  DELETE_SLOT: "删除合租车位",
  ADD_MEMBER: "添加车友",
  UPDATE_MEMBER: "编辑车友",
  DELETE_MEMBER: "删除车友",
  EXIT_MEMBER: "车友退出",
  MOVE_MEMBER: "更换账号席位",
  RENEW_MEMBER: "续费",
  VIEW_PASSWORD: "查看密码",
  UPDATE_SETTINGS: "修改设置",
  UPDATE_PLATFORM: "修改平台",
  CREATE_PLATFORM: "新增平台",
  DELETE_PLATFORM: "删除平台",
};

function Stat({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof CircleParking;
  tone: string;
}) {
  return (
    <div className="panel flex min-h-[104px] items-center gap-4 p-4">
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-[8px] ${tone}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[12px] text-[var(--muted-foreground)]">{label}</p>
        <strong className="mt-0.5 block text-[25px] font-semibold leading-8 tabular">
          {value}
        </strong>
        <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
          {detail}
        </p>
      </div>
    </div>
  );
}

export default async function OverviewPage() {
  const reminderSetting = await prisma.setting.findUnique({
    where: { key: "reminderDays" },
  });
  const reminderCutoff = Math.max(
    ...configuredReminderDays(reminderSetting?.value),
  );
  const today = databaseToday();
  const [
    slots,
    members,
    reminders,
    upcoming,
    expired,
    monthlyRevenue,
    recentOperations,
  ] = await Promise.all([
    prisma.parkingSlot.findMany({
      include: {
        platform: true,
        members: {
          where: { status: "ACTIVE" },
          orderBy: { expireDate: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.findMany({
      where: {
        status: "ACTIVE",
        expireDate: { lte: addDays(today, reminderCutoff) },
      },
      include: { slot: { include: { platform: true } } },
      orderBy: { expireDate: "asc" },
      take: 8,
    }),
    prisma.member.count({
      where: {
        status: "ACTIVE",
        expireDate: { gte: today, lte: addDays(today, reminderCutoff) },
      },
    }),
    prisma.member.count({
      where: { status: "ACTIVE", expireDate: { lt: today } },
    }),
    prisma.renewal.aggregate({
      where: { createdAt: { gte: startOfMonth(today) } },
      _sum: { amount: true },
    }),
    prisma.operationLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);
  const full = slots.filter(
    (slot) =>
      slotStatus(slot.capacity, slot.members.length, slot.status) === "满",
  ).length;
  const open = slots.filter(
    (slot) => slot.members.length < slot.capacity && slot.status === "ACTIVE",
  ).length;
  const dueToday = reminders.filter(
    (member) =>
      format(member.expireDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
  ).length;
  const abnormal = slots.filter(
    (slot) => slot.status === "ABNORMAL" || slot.status === "PAUSED",
  ).length;
  return (
    <div className="mx-auto max-w-[1700px] space-y-4">
      <PageHeader
        title="总览"
        description={`当前共有 ${members} 位在位车友，数据更新于刚刚`}
      />
      <section
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
        aria-label="关键数据"
      >
        <Stat
          label="合租车位"
          value={slots.length}
          detail="所有平台"
          icon={CircleParking}
          tone="bg-[#eef4ff] text-[#2563eb]"
        />
        <Stat
          label="已满账号"
          value={full}
          detail={`${slots.length ? Math.round((full / slots.length) * 100) : 0}%`}
          icon={CircleCheck}
          tone="bg-[#eaf8f1] text-[#087a55]"
        />
        <Stat
          label="有空席位"
          value={open}
          detail="可继续添加车友"
          icon={UsersRound}
          tone="bg-[#fff5e8] text-[#b45309]"
        />
        <Stat
          label="即将到期"
          value={upcoming}
          detail={`未来 ${reminderCutoff} 天`}
          icon={Clock3}
          tone="bg-[#fff4e5] text-[#c05b0a]"
        />
        <Stat
          label="已过期"
          value={expired}
          detail="需要处理"
          icon={AlertTriangle}
          tone="bg-[#fff0f0] text-[#c93636]"
        />
      </section>
      <section
        className="grid items-start gap-3 lg:grid-cols-[repeat(3,minmax(0,0.75fr))_minmax(320px,1.75fr)]"
        aria-label="运营概况"
      >
        <Link
          href="/renewals"
          className="panel group flex min-h-[132px] flex-col justify-between p-4 transition-colors hover:border-[var(--border-strong)]"
        >
          <span className="flex items-center justify-between text-[var(--muted-foreground)]">
            <ReceiptText size={18} />
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <span>
            <strong className="block text-[22px] tabular">
              ¥ {Number(monthlyRevenue._sum.amount || 0).toFixed(2)}
            </strong>
            <span className="mt-1 block text-[12px] text-[var(--muted-foreground)]">
              本月续费收入
            </span>
          </span>
        </Link>
        <Link
          href="/reminders"
          className="panel group flex min-h-[132px] flex-col justify-between p-4 transition-colors hover:border-[var(--border-strong)]"
        >
          <span className="flex items-center justify-between text-[var(--warning)]">
            <BellRing size={18} />
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <span>
            <strong className="block text-[22px] tabular">{dueToday}</strong>
            <span className="mt-1 block text-[12px] text-[var(--muted-foreground)]">
              今日到期提醒
            </span>
          </span>
        </Link>
        <Link
          href="/slots"
          className="panel group flex min-h-[132px] flex-col justify-between p-4 transition-colors hover:border-[var(--border-strong)]"
        >
          <span className="flex items-center justify-between text-[var(--danger)]">
            <ShieldAlert size={18} />
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <span>
            <strong className="block text-[22px] tabular">{abnormal}</strong>
            <span className="mt-1 block text-[12px] text-[var(--muted-foreground)]">
              异常或停用账号
            </span>
          </span>
        </Link>
        <div className="panel h-[132px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <span className="flex items-center gap-2 font-semibold">
              <Activity size={16} />
              最近操作
            </span>
            <Link href="/logs" className="text-[11px] text-[var(--accent)]">
              查看日志
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recentOperations.length ? (
              recentOperations.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-4 py-2 text-[11px]"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span className="min-w-0 flex-1 truncate">
                    <strong>{log.user.username}</strong> ·{" "}
                    {operationNames[log.action] || log.action}
                  </span>
                  <time className="shrink-0 tabular text-[var(--muted-foreground)]">
                    {format(log.createdAt, "MM.dd HH:mm")}
                  </time>
                </div>
              ))
            ) : (
              <p className="px-4 py-5 text-[12px] text-[var(--muted-foreground)]">
                暂无操作记录
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5">
          <div>
            <h2 className="font-semibold">最近合租车位</h2>
            <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
              最近更新的登录账号与成员席位
            </p>
          </div>
          <Link className="btn min-h-8 text-[12px]" href="/slots">
            查看全部 <ArrowRight size={14} />
          </Link>
        </div>
        <div className="data-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>账号编号</th>
                <th>平台</th>
                <th>登录账号</th>
                <th>状态</th>
                <th>成员席位</th>
                <th>平台续费日</th>
                <th>成员最近到期</th>
              </tr>
            </thead>
            <tbody>
              {slots.slice(0, 10).map((slot) => {
                const status = slotStatus(
                  slot.capacity,
                  slot.members.length,
                  slot.status,
                );
                const next = slot.members[0];
                return (
                  <tr key={slot.id}>
                    <td>
                      <Link
                        href={`/slots?open=${slot.id}`}
                        className="font-semibold"
                      >
                        #{slot.slotNumber}
                      </Link>
                    </td>
                    <td>
                      <span className="flex items-center gap-2">
                        <PlatformIcon
                          slug={slot.platform.slug}
                          name={slot.platform.name}
                          icon={slot.platform.icon}
                          size={15}
                        />
                        {slot.platform.name}
                      </span>
                    </td>
                    <td className="text-[#2457bd]">{slot.accountEmail}</td>
                    <td>
                      <Badge
                        tone={
                          status === "满"
                            ? "success"
                            : status === "空闲"
                              ? "neutral"
                              : "urgent"
                        }
                      >
                        {status}
                      </Badge>
                    </td>
                    <td>
                      {slot.members.length}/{slot.capacity}
                    </td>
                    <td>每月 {slot.billingDay} 日</td>
                    <td>
                      {next ? (
                        <Badge tone={expiryLabel(next.expireDate).tone}>
                          {expiryLabel(next.expireDate).text}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">近期到期提醒</h2>
            <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
              按紧急程度排列
            </p>
          </div>
          <Link className="btn min-h-8 text-[12px]" href="/reminders">
            <BellRing size={14} />
            查看全部提醒
          </Link>
        </div>
        {reminders.length ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {reminders.map((member) => {
              const expiry = expiryLabel(member.expireDate);
              const item: MemberItem = {
                id: member.id,
                nickname: member.nickname,
                contact: member.contact,
                startDate: member.startDate.toISOString(),
                expireDate: member.expireDate.toISOString(),
                status: member.status,
                note: member.note,
              };
              return (
                <article
                  key={member.id}
                  className="rounded-[6px] border border-[var(--border)] bg-white p-3.5 transition-colors hover:border-[#bac5d6]"
                >
                  <Link href={`/slots?open=${member.slotId}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <strong className="truncate">{member.nickname}</strong>
                      <Badge tone={expiry.tone}>{expiry.text}</Badge>
                    </div>
                    <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
                      {member.slot.platform.name} · 账号 #
                      {member.slot.slotNumber}
                    </p>
                  </Link>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[11px] text-[#687386]">
                      {member.contact}
                    </p>
                    <RenewButton member={item} compact />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty">未来 {reminderCutoff} 天没有到期提醒</div>
        )}
      </section>
    </div>
  );
}
