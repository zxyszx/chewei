import { format } from "date-fns";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "操作日志" };
const actionNames: Record<string, string> = { SEED_DATABASE: "初始化数据", CREATE_SLOT: "创建合租车位", UPDATE_SLOT: "编辑合租车位", DELETE_SLOT: "删除合租车位", ADD_MEMBER: "添加车友", UPDATE_MEMBER: "编辑车友", DELETE_MEMBER: "删除车友", EXIT_MEMBER: "车友退出", MOVE_MEMBER: "更换车位", RENEW_MEMBER: "续费", VIEW_PASSWORD: "查看密码", UPDATE_SETTINGS: "修改设置", UPDATE_PLATFORM: "修改平台", CREATE_PLATFORM: "新增平台", DELETE_PLATFORM: "删除平台" };
const detailNames: Record<string, string> = { email: "登录账号", nickname: "车友", slotNumber: "账号编号", slotId: "账号 ID", from: "原账号", to: "目标账号", seatNumber: "席位", oldDate: "原到期", newDate: "新到期", amount: "金额", status: "状态", defaultCapacity: "默认席位数", values: "提醒天数", name: "名称", slug: "标识", icon: "图标" };

function actionTone(action: string) {
  if (action.includes("DELETE")) return "danger" as const;
  if (action.includes("VIEW")) return "warning" as const;
  if (action.includes("ADD") || action.includes("CREATE") || action.includes("RENEW")) return "success" as const;
  return "blue" as const;
}

function Detail({ value }: { value: unknown }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return <span>-</span>;
  return <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px]">{Object.entries(value).map(([key, item]) => <div key={key} className="contents"><dt className="text-[#8a94a3]">{detailNames[key] || key}：</dt><dd className="truncate" title={String(item)}>{Array.isArray(item) ? item.join(", ") : item instanceof Date ? format(item, "yyyy.MM.dd HH:mm") : String(item ?? "-")}</dd></div>)}</dl>;
}

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string; from?: string; to?: string }> }) {
  const { q = "", action = "", from = "", to = "" } = await searchParams;
  const records = await prisma.operationLog.findMany({ where: { ...(action ? { action } : {}), ...(from || to ? { createdAt: { ...(from ? { gte: new Date(`${from}T00:00:00+08:00`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999+08:00`) } : {}) } } : {}) }, include: { user: true }, orderBy: { createdAt: "desc" }, take: 500 });
  const logs = q ? records.filter((log) => `${log.user.username} ${actionNames[log.action] || log.action} ${log.resourceType} ${JSON.stringify(log.detail)}`.toLowerCase().includes(q.toLowerCase())) : records;
  const actions = [...new Set(Object.keys(actionNames))].sort((a, b) => actionNames[a].localeCompare(actionNames[b], "zh-CN"));
  const filtered = Boolean(q || action || from || to);
  return <div className="mx-auto max-w-[1700px] space-y-4">
    <PageHeader title="操作日志" description="保留关键账号与业务操作，最近 500 条" />
    <section className="panel overflow-hidden">
      <form className="toolbar border-b border-[var(--border)] px-4 py-3"><div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] px-3"><Search size={15} className="text-[#7b8493]" /><input aria-label="搜索管理员、动作、对象或详情" name="q" defaultValue={q} className="h-9 min-w-0 flex-1 outline-none" placeholder="搜索管理员、动作、对象或详情" /></div><select aria-label="动作" className="select w-auto min-w-[140px]" name="action" defaultValue={action}><option value="">全部动作</option>{actions.map((value) => <option key={value} value={value}>{actionNames[value]}</option>)}</select><input aria-label="开始日期" className="input w-auto" type="date" name="from" defaultValue={from} /><input aria-label="结束日期" className="input w-auto" type="date" name="to" defaultValue={to} /><button className="btn">筛选</button>{filtered && <Link className="btn icon-btn" href="/logs" aria-label="重置筛选" title="重置筛选"><X size={15} /></Link>}</form>
      <div className="data-wrap"><table className="data-table"><thead><tr><th>时间</th><th>管理员</th><th>动作</th><th>对象</th><th>详情</th><th>IP</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td className="whitespace-nowrap tabular">{format(log.createdAt, "yyyy.MM.dd HH:mm:ss")}</td><td className="font-semibold">{log.user.username}</td><td><Badge tone={actionTone(log.action)}>{actionNames[log.action] || log.action}</Badge></td><td>{log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}</td><td className="min-w-[260px] max-w-[480px]"><Detail value={log.detail} /></td><td className="font-mono text-[11px]">{log.ip || "-"}</td></tr>)}</tbody></table>{!logs.length && <div className="empty">暂无操作日志</div>}</div>
    </section>
  </div>;
}
