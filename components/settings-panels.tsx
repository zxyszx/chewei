"use client";

import { Check, CheckCircle2, CircleAlert, Download, ImagePlus, LoaderCircle, Pencil, Plus, RefreshCw, RotateCcw, Search, Trash2, Upload, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createPlatformAction, createUserAction, deletePlatformAction, updatePlatformAction, updateRemindersAction, updateUserAction } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { ConfirmDialog, FormDialog } from "@/components/form-dialog";
import { PlatformIcon } from "@/components/platform-icon";
import { SubmitButton } from "@/components/ui";
import { platformCatalog, searchPlatformCatalog, type PlatformCatalogItem } from "@/lib/platform-catalog";

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

function NewPlatformForm({ close, existingSlugs }: { close: () => void; existingSlugs: string[] }) {
  const availableCatalog = platformCatalog.filter((item) => !existingSlugs.includes(item.slug));
  const firstAvailable = availableCatalog[0];
  const [selected, setSelected] = useState<PlatformCatalogItem | null>(firstAvailable || null);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState(!firstAvailable);
  const [name, setName] = useState(firstAvailable?.name || "");
  const [slug, setSlug] = useState(firstAvailable?.slug || "");
  const [capacity, setCapacity] = useState(firstAvailable?.defaultCapacity || 5);
  const results = searchPlatformCatalog(query).slice(0, 12);
  const existingOnly = !custom && query.trim().length > 0 && results.length > 0 && results.every((item) => existingSlugs.includes(item.slug));
  const choose = (item: PlatformCatalogItem) => { setSelected(item); setCustom(false); setName(item.name); setSlug(item.slug); setCapacity(item.defaultCapacity); };
  const createCustom = () => { setCustom(true); setSelected(null); setName(""); setSlug(""); setCapacity(5); };
  return <ActionForm action={createPlatformAction} onSuccess={close} className="grid gap-4 sm:grid-cols-2">
    <div className="sm:col-span-2"><span className="label">常用平台</span><div className="platform-catalog-picker"><div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" /><input className="input pl-9" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 Netflix、ChatGPT、爱奇艺..." aria-label="搜索常用平台" /></div><div className="platform-catalog-grid">{results.map((item) => { const exists = existingSlugs.includes(item.slug); return <button key={item.slug} type="button" disabled={exists} className={`platform-catalog-item ${exists ? "platform-catalog-item-existing" : ""} ${!custom && selected?.slug === item.slug ? "platform-catalog-item-active" : ""}`} onClick={() => choose(item)}><PlatformIcon slug={item.slug} name={item.name} size={20} /><span className="min-w-0 flex-1 text-left"><strong className="block truncate text-[12px]">{item.name}</strong><small>{exists ? "已添加" : `${item.category} · ${item.defaultCapacity} 席`}</small></span>{exists ? <CheckCircle2 size={15} /> : !custom && selected?.slug === item.slug ? <Check size={15} /> : null}</button>; })}{results.length === 0 && <p className="col-span-full py-5 text-center text-[12px] text-[var(--muted-foreground)]">没有匹配项，可切换到自定义平台</p>}</div><button type="button" className="mt-2 text-[12px] font-semibold text-[var(--accent)]" onClick={createCustom}>找不到？创建自定义平台</button></div></div>
    {existingOnly ? <div className="rounded-[7px] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-[12px] text-[var(--muted-foreground)] sm:col-span-2"><strong className="mb-1 block text-[var(--foreground)]">该平台已经添加</strong>无需重复创建，可关闭窗口后直接修改平台设置。</div> : <><div><label className="label" htmlFor="newPlatformName">平台名称</label><input className="input" id="newPlatformName" name="name" required maxLength={60} value={name} readOnly={!custom} onChange={(event) => setName(event.target.value)} placeholder="例如 Netflix" /></div><div><label className="label" htmlFor="newPlatformSlug">平台标识</label><input className="input" id="newPlatformSlug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} readOnly={!custom} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="例如 youtube-premium" /></div><div><label className="label" htmlFor="newPlatformCapacity">默认席位数</label><input className="input" id="newPlatformCapacity" name="defaultCapacity" type="number" min="1" max="99" value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} required /></div></>}
    <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 sm:col-span-2"><button type="button" className="btn" onClick={close}>取消</button>{!existingOnly && <SubmitButton>添加平台</SubmitButton>}</div>
  </ActionForm>;
}

export function PlatformSettings({ platforms, editable }: { platforms: PlatformRecord[]; editable: boolean }) {
  const [newPlatform, setNewPlatform] = useState(false);
  const [deletePlatform, setDeletePlatform] = useState<PlatformRecord | null>(null);
  const [deleting, startDelete] = useTransition();

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4"><div><h2 className="section-heading">平台管理</h2><p className="mt-1 text-[12px] text-[var(--muted-foreground)]">管理平台名称、图标与新账号默认席位数</p></div>{editable && <button className="btn btn-primary" onClick={() => setNewPlatform(true)}><Plus size={15} />新增平台</button>}</div>
    <div className="grid gap-4 p-4 md:grid-cols-2">{platforms.map((platform) => <ActionForm action={updatePlatformAction} key={platform.id} className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"><input type="hidden" name="platformId" value={platform.id} /><div className="mb-4 flex items-center gap-3"><PlatformIcon slug={platform.slug} name={platform.name} icon={platform.icon} size={42} className="border border-[var(--border)]" /><div className="min-w-0 flex-1"><strong className="block truncate text-[15px]">{platform.name}</strong><span className="font-mono text-[11px] text-[var(--muted-foreground)]">{platform.slug}</span></div><span className={`badge ${platform.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}>{platform.status === "ACTIVE" ? "已启用" : "已停用"}</span></div><div className="grid gap-3 sm:grid-cols-2"><div><label className="label">平台名称</label><input className="input" name="name" defaultValue={platform.name} disabled={!editable} /></div><div><span className="label">标识 slug</span><div className="input flex items-center bg-[var(--surface-subtle)] font-mono text-[12px] text-[var(--muted-foreground)]">{platform.slug}</div></div><div><label className="label">默认席位数</label><input className="input" name="defaultCapacity" type="number" min="1" max="99" defaultValue={platform.defaultCapacity} disabled={!editable} /></div><div><label className="label">平台状态</label><select className="select" name="status" defaultValue={platform.status === "ACTIVE" ? "ACTIVE" : "PAUSED"} disabled={!editable}><option value="ACTIVE">启用</option><option value="PAUSED">停用</option></select></div></div><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4"><span className="mr-auto text-[12px] text-[var(--muted-foreground)]">账号数量 <strong className="ml-1 text-[var(--foreground)] tabular">{platform.slotCount}</strong></span>{editable && <label className="btn cursor-pointer"><ImagePlus size={14} />更换图标<input className="sr-only" name="iconFile" type="file" accept="image/png,image/jpeg,image/webp" /></label>}{editable && platform.icon && <button className="btn icon-btn" type="submit" name="intent" value="reset-icon" aria-label={`恢复 ${platform.name} 默认图标`} title="恢复默认图标"><RotateCcw size={14} /></button>}{editable && platform.slotCount === 0 && <button type="button" className="btn icon-btn text-[var(--danger)]" onClick={() => setDeletePlatform(platform)} aria-label={`删除 ${platform.name}`} title="删除空平台"><Trash2 size={14} /></button>}{editable && <SubmitButton>保存</SubmitButton>}</div></ActionForm>)}</div>
    <FormDialog open={newPlatform} title="新增平台" description="从平台库选择会自动填写图标、名称和默认席位" width={760} onClose={() => setNewPlatform(false)}><NewPlatformForm close={() => setNewPlatform(false)} existingSlugs={platforms.map((platform) => platform.slug)} /></FormDialog>
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

export function SystemMaintenance({ editable, view = "all" }: { editable: boolean; view?: "all" | "backup" | "update" }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(editable && view !== "backup");
  const [updating, setUpdating] = useState(false);
  const clearRestore = () => { setRestoreFile(null); if (fileInput.current) fileInput.current.value = ""; };

  useEffect(() => {
    if (!editable || view === "backup") return;
    let active = true;
    fetch("/api/system/update", { cache: "no-store" }).then((response) => response.json()).then((data: UpdateInfo) => { if (active) setUpdateInfo(data); }).catch(() => { if (active) toast.error("检查更新失败"); }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [editable, view]);

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
  return <div className={view === "all" ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
    {view !== "backup" && <section className="panel p-5">
      <div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-center gap-2"><RefreshCw size={18} className="text-[#2563eb]" /><h2 className="font-semibold">系统更新</h2></div><span className={`badge ${statusTone}`}>{checking || updateRunning ? <LoaderCircle size={13} className="animate-spin" /> : upToDate ? <CheckCircle2 size={13} /> : <CircleAlert size={13} />}{statusLabel}</span></div>
      <div className="mb-4 overflow-hidden rounded-[6px] border border-[var(--border)] bg-[var(--surface-subtle)]">
        <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center border-b border-[var(--border)] px-3 py-2.5 text-[12px]"><span className="text-[var(--muted-foreground)]">当前版本</span><span className="font-mono font-semibold">{short(updateInfo?.current)}</span></div>
        <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start px-3 py-2.5 text-[12px]"><span className="text-[var(--muted-foreground)]">最新版本</span><span className="min-w-0 break-words"><span className="font-mono font-semibold">{short(updateInfo?.latest?.sha)}</span>{updateInfo?.latest?.message && <span className="ml-2 text-[var(--muted-foreground)]">{updateInfo.latest.message}</span>}</span></div>
      </div>
      {updateInfo?.status?.message && <p className="mb-3 text-[12px] text-[var(--muted-foreground)]">{updateInfo.status.message}</p>}
      {updateInfo && !updateInfo.enabled && <p className="mb-3 text-[12px] text-[#a16207]">网页更新服务未启用，请在服务器重新执行一键安装。</p>}
      <div className="flex flex-wrap gap-2"><button className="btn" type="button" disabled={!editable || checking || updateRunning} onClick={checkUpdate}>{checking ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}检查更新</button><button className="btn btn-primary" type="button" title={upToDate ? "当前已是最新版本" : undefined} disabled={!editable || updating || updateRunning || !updateInfo?.enabled || !updateInfo?.updateAvailable} onClick={requestUpdate}>{(updating || updateRunning) && <LoaderCircle size={15} className="animate-spin" />}{updateRunning ? "更新中" : "立即更新"}</button></div>
    </section>}
    {view !== "update" && <><div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]"><section className="panel p-5"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-5"><div><div className="mb-2 flex items-center gap-2"><Download size={19} className="text-[var(--primary)]" /><h2 className="section-heading">完整数据备份</h2></div><p className="max-w-[680px] text-[12px] leading-6 text-[var(--muted-foreground)]">包含平台、合租账号、车友、续费、管理员、操作日志与系统设置。账号密码字段保持加密或哈希状态；备份仍属于敏感文件，请妥善保存。</p></div>{editable && <a className="btn btn-primary" href="/api/backup"><Download size={16} />创建并下载备份</a>}</div><div className="mt-5 rounded-[8px] border border-[var(--border)] bg-[var(--surface-subtle)] p-4"><strong className="text-[13px]">恢复要求</strong><p className="mt-2 text-[12px] leading-6 text-[var(--muted-foreground)]">新服务器必须配置与原服务器相同的 <code className="rounded bg-[var(--surface)] px-1.5 py-0.5">ENCRYPTION_KEY</code>。恢复会覆盖当前全部业务数据，并使当前登录会话失效。</p></div></section><aside className="panel p-5"><h2 className="section-heading">新服务器恢复</h2><ol className="mt-4 space-y-3 text-[12px] leading-5 text-[var(--muted-foreground)]"><li><strong className="mr-2 text-[var(--foreground)]">1.</strong>先完成新服务器的一键安装</li><li><strong className="mr-2 text-[var(--foreground)]">2.</strong>确认加密密钥与原服务器一致</li><li><strong className="mr-2 text-[var(--foreground)]">3.</strong>上传原始 JSON 备份文件</li><li><strong className="mr-2 text-[var(--foreground)]">4.</strong>核对文件名后确认覆盖恢复</li></ol>{editable ? <button className="btn mt-5 w-full" type="button" onClick={() => fileInput.current?.click()}><Upload size={15} />选择备份文件</button> : <p className="mt-4 text-[12px] text-[var(--muted-foreground)]">仅管理员可以恢复备份。</p>}<input ref={fileInput} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => setRestoreFile(event.target.files?.[0] || null)} /></aside></div><section className="panel flex items-start gap-3 p-4"><CircleAlert size={20} className="mt-0.5 shrink-0 text-[var(--warning)]" /><div><strong className="block text-[13px]">恢复前请先下载当前数据备份</strong><p className="mt-1 text-[12px] leading-5 text-[var(--muted-foreground)]">恢复过程采用事务写入，校验失败不会执行覆盖。成功后请使用备份中的管理员账号重新登录。</p></div></section>
      <ConfirmDialog open={Boolean(restoreFile)} title="恢复整个系统？" description={`将用 ${restoreFile?.name || "备份文件"} 覆盖当前所有数据。该操作无法在页面内撤销。`} confirmLabel="确认恢复" pending={restoring} onClose={() => { if (!restoring) clearRestore(); }} onConfirm={restore} />
    </>}
  </div>;
}
