"use client";

import { CheckCircle2, CircleAlert, Download, ImagePlus, LoaderCircle, Pencil, Plus, RefreshCw, RotateCcw, Trash2, Upload, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createPlatformAction, createUserAction, deletePlatformAction, updatePlatformAction, updateRemindersAction, updateUserAction } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { ConfirmDialog, FormDialog } from "@/components/form-dialog";
import { PlatformIcon } from "@/components/platform-icon";
import { SubmitButton } from "@/components/ui";

type PlatformRecord = { id: string; name: string; slug: string; icon: string | null; defaultCapacity: number; status: string; slotCount: number };

export function ReminderSettings({ initialDays, editable }: { initialDays: number[]; editable: boolean }) {
  const [days, setDays] = useState(initialDays);
  const [draft, setDraft] = useState("");
  const addDay = () => {
    const value = Number(draft);
    if (!Number.isInteger(value) || value < 1 || value > 365) return toast.error("提醒天数需为 1 到 365 的整数");
    setDays((current) => [...new Set([...current, value])].sort((a, b) => a - b));
    setDraft("");
  };
  return <ActionForm action={updateRemindersAction} className="flex flex-wrap items-end gap-3">
    <input type="hidden" name="days" value={days.join(",")} />
    <div className="min-w-[280px] flex-1"><span className="label">默认提醒天数</span><div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-[6px] border border-[var(--border-strong)] bg-white px-2 py-1.5">{days.map((day) => <span key={day} className="inline-flex items-center gap-1 rounded-[5px] bg-[#eef4ff] px-2 py-1 text-[12px] font-semibold text-[#2457bd]">{day} 天{editable && <button type="button" onClick={() => setDays((current) => current.filter((item) => item !== day))} aria-label={`删除 ${day} 天提醒`} title={`删除 ${day} 天提醒`}><X size={12} /></button>}</span>)}{editable && <input value={draft} onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addDay(); } }} inputMode="numeric" className="h-7 min-w-[76px] flex-1 bg-transparent px-1 text-[12px] outline-none" placeholder="添加天数" aria-label="添加提醒天数" />}</div></div>
    {editable && <button type="button" className="btn" onClick={addDay} disabled={!draft}><Plus size={15} />添加</button>}
    {editable && <SubmitButton>保存提醒</SubmitButton>}
  </ActionForm>;
}

function NewPlatformForm({ close }: { close: () => void }) {
  return <ActionForm action={createPlatformAction} onSuccess={close} className="grid gap-4 sm:grid-cols-2">
    <div><label className="label" htmlFor="newPlatformName">平台名称</label><input className="input" id="newPlatformName" name="name" required maxLength={60} /></div>
    <div><label className="label" htmlFor="newPlatformSlug">平台标识</label><input className="input" id="newPlatformSlug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="例如 youtube-premium" /></div>
    <div><label className="label" htmlFor="newPlatformCapacity">默认席位数</label><input className="input" id="newPlatformCapacity" name="defaultCapacity" type="number" min="1" max="99" defaultValue="5" required /></div>
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 sm:col-span-2"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>添加平台</SubmitButton></div>
  </ActionForm>;
}

export function PlatformSettings({ platforms, editable }: { platforms: PlatformRecord[]; editable: boolean }) {
  const [newPlatform, setNewPlatform] = useState(false);
  const [deletePlatform, setDeletePlatform] = useState<PlatformRecord | null>(null);
  const [deleting, startDelete] = useTransition();

  return <>
    <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5"><div><h2 className="font-semibold">平台工作表</h2><p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">控制合租车位页顶部的平台标签、图标和默认席位数</p></div>{editable && <button className="btn btn-primary min-h-9 px-3 text-[12px]" onClick={() => setNewPlatform(true)}><Plus size={15} />新增平台</button>}</div>
    <div className="data-wrap"><table className="data-table"><thead><tr><th>图标</th><th>平台名称</th><th>标识</th><th>默认席位数</th><th>状态</th><th>账号数</th><th>图标文件</th><th>操作</th></tr></thead><tbody>{platforms.map((platform) => <tr key={platform.id}><td><PlatformIcon slug={platform.slug} name={platform.name} icon={platform.icon} size={20} className="border border-[var(--border)]" /></td><td colSpan={7} className="!p-0"><ActionForm action={updatePlatformAction} className="grid min-w-[940px] grid-cols-[minmax(150px,1fr)_minmax(140px,1fr)_100px_120px_70px_minmax(170px,1fr)_150px] items-center gap-3 px-3 py-2"><input type="hidden" name="platformId" value={platform.id} /><input className="input min-h-9" name="name" defaultValue={platform.name} disabled={!editable} aria-label={`${platform.name} 名称`} /><span className="truncate font-mono text-[12px] text-[var(--muted-foreground)]">{platform.slug}</span><input className="input min-h-9" name="defaultCapacity" type="number" min="1" max="99" defaultValue={platform.defaultCapacity} disabled={!editable} aria-label={`${platform.name} 默认席位数`} /><select className="select min-h-9" name="status" defaultValue={platform.status === "ACTIVE" ? "ACTIVE" : "PAUSED"} disabled={!editable} aria-label={`${platform.name} 状态`}><option value="ACTIVE">启用</option><option value="PAUSED">停用</option></select><span className="tabular text-[12px]">{platform.slotCount}</span><label className="btn min-h-9 cursor-pointer px-2 text-[12px]"><ImagePlus size={14} />选择图片<input className="sr-only" name="iconFile" type="file" accept="image/png,image/jpeg,image/webp" disabled={!editable} /></label><div className="flex gap-1">{editable && <SubmitButton className="min-h-9 px-2.5 text-[12px]">更新</SubmitButton>}{editable && platform.icon && <button className="btn icon-btn size-9" type="submit" name="intent" value="reset-icon" aria-label={`恢复 ${platform.name} 默认图标`} title="恢复默认图标"><RotateCcw size={14} /></button>}{editable && platform.slotCount === 0 && <button type="button" className="btn icon-btn size-9 text-[var(--danger)]" onClick={() => setDeletePlatform(platform)} aria-label={`删除 ${platform.name}`} title="删除空平台"><Trash2 size={14} /></button>}</div></ActionForm></td></tr>)}</tbody></table></div>
    <FormDialog open={newPlatform} title="新增平台" description="添加后会在合租车位页生成新的工作表标签" onClose={() => setNewPlatform(false)}><NewPlatformForm close={() => setNewPlatform(false)} /></FormDialog>
    <ConfirmDialog open={Boolean(deletePlatform)} title="删除空平台？" description={`${deletePlatform?.name || "该平台"} 没有合租车位，删除后将从工作表中移除。`} confirmLabel="确认删除" pending={deleting} onClose={() => setDeletePlatform(null)} onConfirm={() => deletePlatform && startDelete(async () => { const result = await deletePlatformAction(deletePlatform.id); if (result.ok) { toast.success(result.message); setDeletePlatform(null); } else toast.error(result.message); })} />
  </>;
}

type UserRecord = { id: string; username: string; role: "ADMIN" | "OPERATOR"; status: string };

function NewUserForm({ close }: { close: () => void }) {
  return <ActionForm action={createUserAction} onSuccess={close} className="space-y-4"><div><label className="label" htmlFor="newUsername">登录账号</label><input id="newUsername" name="username" className="input" minLength={3} maxLength={40} autoComplete="off" required /></div><div><label className="label" htmlFor="newUserPassword">初始密码</label><input id="newUserPassword" name="password" className="input" type="password" minLength={10} autoComplete="new-password" required /></div><div><label className="label" htmlFor="newUserRole">权限</label><select id="newUserRole" name="role" className="select" defaultValue="OPERATOR"><option value="OPERATOR">操作员</option><option value="ADMIN">管理员</option></select></div><div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>创建账号</SubmitButton></div></ActionForm>;
}

function EditUserForm({ user, currentUserId, close }: { user: UserRecord; currentUserId: string; close: () => void }) {
  const self = user.id === currentUserId;
  return <ActionForm action={updateUserAction} onSuccess={close} className="space-y-4"><input type="hidden" name="userId" value={user.id} /><div><span className="label">登录账号</span><div className="rounded-[6px] border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2.5 font-medium">{user.username}{self && <span className="ml-2 text-[11px] text-[var(--muted-foreground)]">当前账号</span>}</div></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="editUserRole">权限</label><select id="editUserRole" name="role" className="select" defaultValue={user.role} disabled={self}><option value="OPERATOR">操作员</option><option value="ADMIN">管理员</option></select>{self && <input type="hidden" name="role" value={user.role} />}</div><div><label className="label" htmlFor="editUserStatus">状态</label><select id="editUserStatus" name="status" className="select" defaultValue={user.status === "ACTIVE" ? "ACTIVE" : "PAUSED"} disabled={self}><option value="ACTIVE">启用</option><option value="PAUSED">停用</option></select>{self && <input type="hidden" name="status" value="ACTIVE" />}</div></div><div><label className="label" htmlFor="editUserPassword">设置新密码</label><input id="editUserPassword" name="password" className="input" type="password" minLength={10} autoComplete="new-password" placeholder="留空则不修改" /></div><div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4"><button type="button" className="btn" onClick={close}>取消</button><SubmitButton>保存账号</SubmitButton></div></ActionForm>;
}

export function UserSettings({ users, currentUserId, editable }: { users: UserRecord[]; currentUserId: string; editable: boolean }) {
  const [creating, setCreating] = useState(false); const [editing, setEditing] = useState<UserRecord | null>(null);
  return <section className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5"><div><h2 className="font-semibold">人员与权限</h2><p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">管理可登录后台的管理员与操作员账号</p></div>{editable && <button className="btn btn-primary min-h-9 px-3 text-[12px]" onClick={() => setCreating(true)}><UserPlus size={15} />新增账号</button>}</div><div className="divide-y divide-[var(--border)]">{users.map((user) => <div key={user.id} className="flex items-center gap-3 px-5 py-3"><span className="account-avatar">{user.username.slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><strong className="block truncate text-[13px]">{user.username}</strong><span className="text-[11px] text-[var(--muted-foreground)]">{user.role === "ADMIN" ? "管理员" : "操作员"}{user.id === currentUserId ? " · 当前账号" : ""}</span></div><span className={`badge ${user.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}>{user.status === "ACTIVE" ? "启用" : "停用"}</span>{editable && <button className="btn icon-btn size-9" onClick={() => setEditing(user)} aria-label={`编辑 ${user.username}`} title="编辑账号"><Pencil size={14} /></button>}</div>)}</div><FormDialog open={creating} title="新增后台账号" description="操作员可管理业务数据，管理员还可以管理系统设置与备份" onClose={() => setCreating(false)}><NewUserForm close={() => setCreating(false)} /></FormDialog><FormDialog open={Boolean(editing)} title="编辑后台账号" description="停用后该账号的现有登录会话将在下次校验时失效" onClose={() => setEditing(null)}>{editing && <EditUserForm user={editing} currentUserId={currentUserId} close={() => setEditing(null)} />}</FormDialog></section>;
}

type UpdateInfo = { enabled: boolean; current: string; latest: { sha: string; message: string; date: string | null } | null; updateAvailable: boolean; status: { state?: string; message?: string; updatedAt?: string } | null; error?: string };

export function SystemMaintenance({ editable }: { editable: boolean }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(editable);
  const [updating, setUpdating] = useState(false);
  const clearRestore = () => { setRestoreFile(null); if (fileInput.current) fileInput.current.value = ""; };

  useEffect(() => {
    if (!editable) return;
    let active = true;
    fetch("/api/system/update", { cache: "no-store" }).then((response) => response.json()).then((data: UpdateInfo) => { if (active) setUpdateInfo(data); }).catch(() => { if (active) toast.error("检查更新失败"); }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [editable]);

  useEffect(() => {
    const state = updateInfo?.status?.state;
    if (state !== "queued" && state !== "updating") return;
    const timer = window.setInterval(() => { fetch("/api/system/update", { cache: "no-store" }).then((response) => response.json()).then((data: UpdateInfo) => setUpdateInfo(data)).catch(() => undefined); }, 5000);
    return () => window.clearInterval(timer);
  }, [updateInfo?.status?.state]);

  async function checkUpdate() {
    setChecking(true);
    try {
      const response = await fetch("/api/system/update", { cache: "no-store" });
      const data = await response.json() as UpdateInfo;
      setUpdateInfo(data);
      if (data.error) toast.error(data.error);
    } catch { toast.error("检查更新失败"); } finally { setChecking(false); }
  }

  async function requestUpdate() {
    setUpdating(true);
    try {
      const response = await fetch("/api/system/update", { method: "POST" });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "更新请求失败");
      toast.success("已提交更新，服务会自动备份并重启");
      setUpdateInfo((current) => current ? { ...current, updateAvailable: false, status: { state: "queued", message: "已提交更新请求", updatedAt: new Date().toISOString() } } : current);
    } catch (error) { toast.error(error instanceof Error ? error.message : "更新请求失败"); } finally { setUpdating(false); }
  }

  async function restore() {
    if (!restoreFile) return;
    setRestoring(true);
    try {
      const form = new FormData(); form.set("backup", restoreFile);
      const response = await fetch("/api/backup", { method: "POST", body: form });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "恢复失败");
      toast.success("恢复完成，请重新登录");
      router.replace("/login");
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "恢复失败"); setRestoring(false); }
  }

  const short = (value?: string) => value && value !== "unknown" ? value.slice(0, 7) : "未知";
  const updateState = updateInfo?.status?.state;
  const updateRunning = updateState === "queued" || updateState === "updating";
  const upToDate = Boolean(updateInfo?.enabled && updateInfo.latest && !updateInfo.updateAvailable && !updateRunning);
  const statusLabel = checking ? "正在检查" : updateRunning ? "正在更新" : updateInfo?.updateAvailable ? "发现新版本" : upToDate ? "已是最新版本" : "等待检查";
  const statusTone = updateInfo?.updateAvailable ? "badge-warning" : upToDate ? "badge-success" : "badge-neutral";
  return <div className="grid gap-4 md:grid-cols-2">
    <section className="panel p-5">
      <div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-center gap-2"><RefreshCw size={18} className="text-[#2563eb]" /><h2 className="font-semibold">系统更新</h2></div><span className={`badge ${statusTone}`}>{checking || updateRunning ? <LoaderCircle size={13} className="animate-spin" /> : upToDate ? <CheckCircle2 size={13} /> : <CircleAlert size={13} />}{statusLabel}</span></div>
      <div className="mb-4 overflow-hidden rounded-[6px] border border-[var(--border)] bg-[var(--surface-subtle)]">
        <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center border-b border-[var(--border)] px-3 py-2.5 text-[12px]"><span className="text-[var(--muted-foreground)]">当前版本</span><span className="font-mono font-semibold">{short(updateInfo?.current)}</span></div>
        <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start px-3 py-2.5 text-[12px]"><span className="text-[var(--muted-foreground)]">最新版本</span><span className="min-w-0 break-words"><span className="font-mono font-semibold">{short(updateInfo?.latest?.sha)}</span>{updateInfo?.latest?.message && <span className="ml-2 text-[var(--muted-foreground)]">{updateInfo.latest.message}</span>}</span></div>
      </div>
      {updateInfo?.status?.message && <p className="mb-3 text-[12px] text-[var(--muted-foreground)]">{updateInfo.status.message}</p>}
      {updateInfo && !updateInfo.enabled && <p className="mb-3 text-[12px] text-[#a16207]">网页更新服务未启用，请在服务器重新执行一键安装。</p>}
      <div className="flex flex-wrap gap-2"><button className="btn" type="button" disabled={!editable || checking || updateRunning} onClick={checkUpdate}>{checking ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}检查更新</button><button className="btn btn-primary" type="button" title={upToDate ? "当前已是最新版本" : undefined} disabled={!editable || updating || updateRunning || !updateInfo?.enabled || !updateInfo?.updateAvailable} onClick={requestUpdate}>{(updating || updateRunning) && <LoaderCircle size={15} className="animate-spin" />}{updateRunning ? "更新中" : "立即更新"}</button></div>
    </section>
    <section className="panel p-5">
      <div className="mb-3 flex items-center gap-2"><Download size={18} className="text-[#087a55]" /><h2 className="font-semibold">备份与恢复</h2></div>
      <p className="mb-4 text-[12px] leading-5 text-[var(--muted-foreground)]">完整备份包含登录账号和加密的平台密码。恢复后当前会话会退出，且必须使用相同的 ENCRYPTION_KEY。</p>
      {editable ? <div className="flex flex-wrap gap-2"><a className="btn" href="/api/backup"><Download size={15} />下载完整备份</a><button className="btn" type="button" onClick={() => fileInput.current?.click()}><Upload size={15} />从备份恢复</button><input ref={fileInput} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => setRestoreFile(event.target.files?.[0] || null)} /></div> : <p className="text-[12px] text-[var(--muted-foreground)]">仅管理员可以下载或恢复完整备份。</p>}
      <ConfirmDialog open={Boolean(restoreFile)} title="恢复整个系统？" description={`将用 ${restoreFile?.name || "备份文件"} 覆盖当前所有数据。该操作无法在页面内撤销。`} confirmLabel="确认恢复" pending={restoring} onClose={() => { if (!restoring) clearRestore(); }} onConfirm={restore} />
    </section>
  </div>;
}
