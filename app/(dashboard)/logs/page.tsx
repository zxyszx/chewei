import { format } from "date-fns";
import { Search, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { CsvExport } from "@/components/csv-export";
import { LogDetailButton } from "@/components/log-detail-button";
import { Badge, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "操作日志" };
const actionNames: Record<string, string> = { SEED_DATABASE: "初始化数据", CREATE_SLOT: "创建合租车位", UPDATE_SLOT: "编辑合租车位", DELETE_SLOT: "删除合租车位", ADD_MEMBER: "添加车友", UPDATE_MEMBER: "编辑车友", DELETE_MEMBER: "删除车友", EXIT_MEMBER: "车友退出", MOVE_MEMBER: "更换车位", RENEW_MEMBER: "续费", VIEW_PASSWORD: "查看密码", UPDATE_SETTINGS: "修改设置", UPDATE_PLATFORM: "修改平台", CREATE_PLATFORM: "新增平台", DELETE_PLATFORM: "删除平台", CREATE_USER: "创建后台账号", UPDATE_USER: "修改后台账号" };
const detailNames: Record<string, string> = { email: "登录账号", nickname: "车友", slotNumber: "账号编号", slotId: "账号 ID", from: "原账号", to: "目标账号", seatNumber: "席位", oldDate: "原到期", newDate: "新到期", amount: "金额", status: "状态", defaultCapacity: "默认席位数", values: "提醒天数", name: "名称", slug: "标识", icon: "图标" };

function actionTone(action: string) {
  if (action.includes("DELETE") || action.includes("EXIT")) return "danger" as const;
  if (action.includes("VIEW")) return "warning" as const;
  if (action.includes("ADD") || action.includes("CREATE") || action.includes("RENEW")) return "success" as const;
  return "blue" as const;
}

function summary(value: unknown) { if (!value || typeof value !== "object" || Array.isArray(value)) return "无详细说明"; return Object.entries(value).slice(0, 3).map(([key, item]) => `${detailNames[key] || key}：${Array.isArray(item) ? item.join("、") : String(item ?? "-")}`).join("；"); }

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string; from?: string; to?: string }> }) {
  const { q = "", action = "", from = "", to = "" } = await searchParams;
  const records = await prisma.operationLog.findMany({ where: { ...(action ? { action } : {}), ...(from || to ? { createdAt: { ...(from ? { gte: new Date(`${from}T00:00:00+08:00`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999+08:00`) } : {}) } } : {}) }, include: { user: true }, orderBy: { createdAt: "desc" }, take: 500 });
  const logs = q ? records.filter((log) => `${log.user.username} ${actionNames[log.action] || log.action} ${log.resourceType} ${JSON.stringify(log.detail)}`.toLowerCase().includes(q.toLowerCase())) : records;
  const actions = [...new Set(Object.keys(actionNames))].sort((a, b) => actionNames[a].localeCompare(actionNames[b], "zh-CN"));
  const filtered = Boolean(q || action || from || to);
  return <div className="mx-auto max-w-[1700px] space-y-4">
    <PageHeader title="操作日志" description="关键业务操作全程留痕" actions={<CsvExport filename={`操作日志-${format(new Date(), "yyyyMMdd")}.csv`} rows={logs.map((log) => ({ time: format(log.createdAt, "yyyy-MM-dd HH:mm:ss"), user: log.user.username, action: actionNames[log.action] || log.action, resource: `${log.resourceType}${log.resourceId ? ` ${log.resourceId}` : ""}`, summary: summary(log.detail), ip: log.ip || "", detail: JSON.stringify(log.detail || {}) }))} labels={{ time: "时间", user: "管理员", action: "操作类型", resource: "操作对象", summary: "中文摘要", ip: "IP地址", detail: "原始详情" }} />} />
    <section className="panel flex items-center gap-3 p-4"><span className="metric-icon icon-tone-blue"><ShieldCheck size={21} /></span><div><strong className="block text-[14px]">敏感操作将重点标记并保留审计记录</strong><p className="mt-1 text-[12px] text-[var(--muted-foreground)]">包括查看密码、删除、车友退出和数据维护等关键操作</p></div></section>
    <section className="panel overflow-hidden">
      <form className="toolbar border-b border-[var(--border)] px-4 py-3"><div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] px-3"><Search size={15} className="text-[#7b8493]" /><input aria-label="搜索管理员、动作、对象或详情" name="q" defaultValue={q} className="h-9 min-w-0 flex-1 outline-none" placeholder="搜索管理员、动作、对象或详情" /></div><select aria-label="动作" className="select w-auto min-w-[140px]" name="action" defaultValue={action}><option value="">全部动作</option>{actions.map((value) => <option key={value} value={value}>{actionNames[value]}</option>)}</select><input aria-label="开始日期" className="input w-auto" type="date" name="from" defaultValue={from} /><input aria-label="结束日期" className="input w-auto" type="date" name="to" defaultValue={to} /><button className="btn">筛选</button>{filtered && <Link className="btn icon-btn" href="/logs" aria-label="重置筛选" title="重置筛选"><X size={15} /></Link>}</form>
      <div className="data-wrap responsive-table-desktop"><table className="data-table"><thead><tr><th>时间</th><th>管理员</th><th>操作类型</th><th>操作对象</th><th>中文摘要</th><th>IP 地址</th><th>详情</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td className="whitespace-nowrap tabular">{format(log.createdAt, "yyyy.MM.dd HH:mm:ss")}</td><td className="font-semibold">{log.user.username}</td><td><Badge tone={actionTone(log.action)}>{actionNames[log.action] || log.action}</Badge></td><td>{log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}</td><td className="max-w-[420px] truncate" title={summary(log.detail)}>{summary(log.detail)}</td><td className="font-mono text-[11px]">{log.ip || "-"}</td><td><LogDetailButton title={`${actionNames[log.action] || log.action} · ${format(log.createdAt, "yyyy.MM.dd HH:mm:ss")}`} detail={JSON.stringify(log.detail || {})} /></td></tr>)}</tbody></table>{!logs.length && <div className="empty">暂无操作日志</div>}</div>
      <div className="mobile-record-list">{logs.map((log) => <article className="mobile-record" key={log.id}><div className="flex items-center justify-between gap-3"><div><strong>{log.user.username}</strong><p className="mt-1 text-[11px] tabular text-[var(--muted-foreground)]">{format(log.createdAt, "yyyy.MM.dd HH:mm:ss")}</p></div><Badge tone={actionTone(log.action)}>{actionNames[log.action] || log.action}</Badge></div><p className="mt-3 text-[12px] leading-5">{summary(log.detail)}</p><div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3"><span className="truncate text-[11px] text-[var(--muted-foreground)]">{log.resourceType} · {log.ip || "无 IP"}</span><LogDetailButton title={`${actionNames[log.action] || log.action} · ${format(log.createdAt, "yyyy.MM.dd HH:mm:ss")}`} detail={JSON.stringify(log.detail || {})} /></div></article>)}{!logs.length && <div className="empty">暂无操作日志</div>}</div>
    </section>
  </div>;
}
