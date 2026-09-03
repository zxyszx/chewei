import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { CreditCard, Plus, ReceiptText, Search, TrendingUp, WalletCards, X } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { CsvExport } from "@/components/csv-export";
import { Pagination } from "@/components/pagination";
import { PlatformIcon } from "@/components/platform-icon";
import { Badge, MetricCard, PageHeader } from "@/components/ui";
import { databaseToday } from "@/lib/dates";
import {
  currentPaymentMethods,
  isPaymentMethod,
  paymentMethodLabels,
} from "@/lib/payment-methods";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "续费记录" };
const paymentTone = (method: string): "success" | "blue" | "warning" | "neutral" => method === "WECHAT" ? "success" : method === "ALIPAY" ? "blue" : method === "CRYPTO" ? "warning" : "neutral";
const localDate = (value: string, end = false) =>
  new Date(`${value}T${end ? "23:59:59.999" : "00:00:00"}+08:00`);

export default async function RenewalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    platform?: string;
    slot?: string;
    payment?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const {
    q = "",
    platform = "",
    slot = "",
    payment: method = "",
    from = "",
    to = "",
    page: pageParam = "1",
  } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1); const pageSize = 100;
  const validMethod = isPaymentMethod(method)
    ? method
    : undefined;
  const where: Prisma.RenewalWhereInput = {
    ...(q ? { OR: [{ member: { nickname: { contains: q, mode: "insensitive" } } }, { member: { contact: { contains: q, mode: "insensitive" } } }] } : {}),
    ...(platform ? { slot: { platform: { slug: platform } } } : {}),
    ...(slot ? { slotId: slot } : {}),
    ...(validMethod ? { paymentMethod: validMethod } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: localDate(from) } : {}), ...(to ? { lte: localDate(to, true) } : {}) } } : {}),
  };
  const today = databaseToday();
  const thisMonth = startOfMonth(today);
  const nextMonth = addMonths(thisMonth, 1);
  const previousMonth = subMonths(thisMonth, 1);
  const [platforms, slots, renewals, exportRenewals, total, currentAggregate, currentCount, previousAggregate] = await Promise.all([
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.parkingSlot.findMany({
      include: { platform: true },
      orderBy: [{ platform: { name: "asc" } }, { slotNumber: "asc" }],
    }),
    prisma.renewal.findMany({
      where,
      include: {
        member: true,
        slot: { include: { platform: true } },
        operator: true,
      },
      orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
    }),
    prisma.renewal.findMany({ where, include: { member: true, slot: { include: { platform: true } }, operator: true }, orderBy: { createdAt: "desc" }, take: 5000 }),
    prisma.renewal.count({ where }),
    prisma.renewal.aggregate({ where: { createdAt: { gte: thisMonth, lt: nextMonth } }, _sum: { amount: true } }),
    prisma.renewal.count({ where: { createdAt: { gte: thisMonth, lt: nextMonth } } }),
    prisma.renewal.aggregate({ where: { createdAt: { gte: previousMonth, lt: thisMonth } }, _sum: { amount: true } }),
  ]);
  const filtered = Boolean(q || platform || slot || method || from || to);
  const currentRevenue = Number(currentAggregate._sum.amount || 0);
  const previousRevenue = Number(previousAggregate._sum.amount || 0);
  const average = currentCount ? currentRevenue / currentCount : 0;
  const change = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : null;
  return (
    <div className="mx-auto max-w-[1800px] space-y-4">
      <PageHeader title="续费记录" description="记录每笔续费，收入清晰可追溯" actions={<div className="flex gap-2"><CsvExport filename={`续费记录-${format(today, "yyyyMMdd")}.csv`} rows={exportRenewals.map((record) => ({ date: format(record.createdAt, "yyyy-MM-dd HH:mm"), member: record.member.nickname, contact: record.member.contact, platform: record.slot.platform.name, account: record.slot.accountEmail, oldExpiry: format(record.oldExpireDate, "yyyy-MM-dd"), newExpiry: format(record.newExpireDate, "yyyy-MM-dd"), amount: Number(record.amount).toFixed(2), payment: paymentMethodLabels[record.paymentMethod] || record.paymentMethod, operator: record.operator.username, note: record.note || "" }))} labels={{ date: "日期", member: "车友", contact: "联系方式", platform: "平台", account: "合租账号", oldExpiry: "原到期时间", newExpiry: "新到期时间", amount: "金额", payment: "支付方式", operator: "操作人", note: "备注" }} /><Link className="btn btn-primary" href="/members"><Plus size={16} />新增续费</Link></div>} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard label="本月收入" value={`¥ ${currentRevenue.toFixed(2)}`} icon={<WalletCards size={22} />} tone="blue" detail="本月已到账金额" /><MetricCard label="本月续费" value={`${currentCount} 人次`} icon={<ReceiptText size={22} />} tone="green" detail="本月完成续费次数" /><MetricCard label="平均客单价" value={`¥ ${average.toFixed(2)}`} icon={<CreditCard size={22} />} tone="orange" detail="本月平均每笔金额" /><MetricCard label="较上月" value={change === null ? "--" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`} icon={<TrendingUp size={22} />} tone={change !== null && change < 0 ? "red" : "blue"} detail={change === null ? "上月暂无收入" : "收入环比变化"} /></section>
      <section className="panel overflow-hidden">
        <form className="toolbar border-b border-[var(--border)] px-4 py-3">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] px-3">
            <Search size={15} className="text-[#7b8493]" />
            <input
              aria-label="搜索车友或联系方式"
              name="q"
              defaultValue={q}
              className="h-9 min-w-0 flex-1 outline-none"
              placeholder="搜索车友或联系方式"
            />
          </div>
          <select
            aria-label="平台"
            className="select w-auto"
            name="platform"
            defaultValue={platform}
          >
            <option value="">全部平台</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label="合租车位"
            className="select w-auto max-w-[190px]"
            name="slot"
            defaultValue={slot}
          >
            <option value="">全部合租车位</option>
            {slots.map((item) => (
              <option key={item.id} value={item.id}>
                {item.platform.name} #{item.slotNumber}
              </option>
            ))}
          </select>
          <select
            aria-label="付款方式"
            className="select w-auto"
            name="payment"
            defaultValue={method}
          >
            <option value="">全部付款方式</option>
            {currentPaymentMethods.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-[12px] text-[var(--muted-foreground)]">
            从
            <input
              aria-label="开始日期"
              className="input w-auto"
              type="date"
              name="from"
              defaultValue={from}
            />
          </label>
          <label className="flex items-center gap-2 text-[12px] text-[var(--muted-foreground)]">
            至
            <input
              aria-label="结束日期"
              className="input w-auto"
              type="date"
              name="to"
              defaultValue={to}
            />
          </label>
          <button className="btn">筛选</button>
          {filtered && (
            <Link
              className="btn icon-btn"
              href="/renewals"
              aria-label="清除筛选"
              title="清除筛选"
            >
              <X size={15} />
            </Link>
          )}
        </form>
        <div className="data-wrap responsive-table-desktop">
          <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>车友</th>
                <th>平台</th>
                <th>合租车位</th>
                <th>原到期时间</th>
                <th>新到期时间</th>
                <th>金额</th>
                <th>支付方式</th>
                <th>操作人</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {renewals.map((record) => (
                <tr key={record.id}>
                  <td className="tabular">
                    {format(record.createdAt, "yyyy.MM.dd HH:mm")}
                  </td>
                  <td className="font-semibold">{record.member.nickname}</td>
                  <td>
                    <span className="flex items-center gap-2">
                      <PlatformIcon
                        slug={record.slot.platform.slug}
                        name={record.slot.platform.name}
                        icon={record.slot.platform.icon}
                        size={15}
                      />
                      {record.slot.platform.name}
                    </span>
                  </td>
                  <td>
                    <Link
                      className="text-[var(--accent)]"
                      href={`/slots?open=${record.slotId}`}
                    >
                      #{record.slot.slotNumber}
                    </Link>
                  </td>
                  <td className="tabular">
                    {format(record.oldExpireDate, "yyyy.MM.dd")}
                  </td>
                  <td className="tabular">
                    {format(record.newExpireDate, "yyyy.MM.dd")}
                  </td>
                  <td className="font-semibold tabular">
                    ¥ {record.amount.toFixed(2)}
                  </td>
                  <td>
                    <Badge tone={paymentTone(record.paymentMethod)}>
                      {paymentMethodLabels[record.paymentMethod] || record.paymentMethod}
                    </Badge>
                  </td>
                  <td>{record.operator.username}</td>
                  <td className="max-w-[180px] truncate text-[var(--muted-foreground)]">
                    {record.note || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!renewals.length && <div className="empty">暂无续费记录</div>}
        </div>
        <div className="mobile-record-list">{renewals.map((record) => <article className="mobile-record" key={record.id}><div className="flex items-start justify-between gap-3"><div><strong>{record.member.nickname}</strong><div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--muted-foreground)]"><PlatformIcon slug={record.slot.platform.slug} name={record.slot.platform.name} icon={record.slot.platform.icon} size={15} />{record.slot.platform.name} #{record.slot.slotNumber}</div></div><strong className="whitespace-nowrap text-[15px] text-[var(--primary)] tabular">¥ {record.amount.toFixed(2)}</strong></div><dl className="mt-3 grid grid-cols-[76px_minmax(0,1fr)] gap-y-2 text-[12px]"><dt className="mobile-record-label">续费时间</dt><dd className="tabular">{format(record.createdAt, "yyyy.MM.dd HH:mm")}</dd><dt className="mobile-record-label">有效期</dt><dd className="tabular">{format(record.oldExpireDate, "yyyy.MM.dd")} → {format(record.newExpireDate, "yyyy.MM.dd")}</dd><dt className="mobile-record-label">支付方式</dt><dd><Badge tone={paymentTone(record.paymentMethod)}>{paymentMethodLabels[record.paymentMethod] || record.paymentMethod}</Badge></dd><dt className="mobile-record-label">操作人</dt><dd>{record.operator.username}</dd>{record.note && <><dt className="mobile-record-label">备注</dt><dd>{record.note}</dd></>}</dl><Link className="btn mt-3 min-h-9 w-full text-[12px]" href={`/slots?open=${record.slotId}`}>查看合租车位</Link></article>)}{!renewals.length && <div className="empty">暂无续费记录</div>}</div>
        <Pagination page={page} total={total} pageSize={pageSize} pathname="/renewals" params={{ q, platform, slot, payment: method, from, to }} />
      </section>
    </div>
  );
}
