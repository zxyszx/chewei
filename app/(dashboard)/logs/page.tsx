import { format } from "date-fns";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "操作日志" };
const actionNames: Record<string, string> = { SEED_DATABASE: "初始化数据", CREATE_SLOT: "创建车位", UPDATE_SLOT: "编辑车位", DELETE_SLOT: "删除车位", ADD_MEMBER: "添加车友", UPDATE_MEMBER: "编辑车友", DELETE_MEMBER: "删除车友", EXIT_MEMBER: "车友退出", MOVE_MEMBER: "车友换位", RENEW_MEMBER: "续费", VIEW_PASSWORD: "查看密码", UPDATE_SETTINGS: "修改设置", UPDATE_PLATFORM: "修改平台" };

export default async function LogsPage() {
  const logs = await prisma.operationLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 500 });
  return <div className="mx-auto max-w-[1700px] space-y-4"><PageHeader title="操作日志" description="保留关键账号和业务操作，最近 500 条" /><section className="panel overflow-hidden"><div className="data-wrap"><table className="data-table"><thead><tr><th>时间</th><th>管理员</th><th>动作</th><th>对象</th><th>详情</th><th>IP</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td className="whitespace-nowrap tabular">{format(log.createdAt, "yyyy.MM.dd HH:mm:ss")}</td><td className="font-semibold">{log.user.username}</td><td>{actionNames[log.action] || log.action}</td><td>{log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}</td><td className="max-w-[480px] truncate font-mono text-[11px] text-[var(--muted-foreground)]">{log.detail ? JSON.stringify(log.detail) : "-"}</td><td className="font-mono text-[11px]">{log.ip || "-"}</td></tr>)}</tbody></table>{!logs.length && <div className="empty">暂无操作日志</div>}</div></section></div>;
}
