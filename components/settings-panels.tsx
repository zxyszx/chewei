"use client";

import { ImagePlus, Plus, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createPlatformAction, updatePlatformAction, updateRemindersAction } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { FormDialog } from "@/components/form-dialog";
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

  return <>
    <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5"><div><h2 className="font-semibold">平台工作表</h2><p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">控制共享账号页顶部的平台标签、图标和默认席位数</p></div>{editable && <button className="btn btn-primary min-h-9 px-3 text-[12px]" onClick={() => setNewPlatform(true)}><Plus size={15} />新增平台</button>}</div>
    <div className="data-wrap"><table className="data-table"><thead><tr><th>图标</th><th>平台名称</th><th>标识</th><th>默认席位数</th><th>状态</th><th>账号数</th><th>图标文件</th><th>操作</th></tr></thead><tbody>{platforms.map((platform) => <tr key={platform.id}><td><PlatformIcon slug={platform.slug} name={platform.name} icon={platform.icon} size={20} className="border border-[var(--border)]" /></td><td colSpan={7} className="!p-0"><ActionForm action={updatePlatformAction} className="grid min-w-[900px] grid-cols-[minmax(150px,1fr)_minmax(140px,1fr)_100px_120px_80px_minmax(190px,1fr)_110px] items-center gap-3 px-3 py-2"><input type="hidden" name="platformId" value={platform.id} /><input className="input min-h-9" name="name" defaultValue={platform.name} disabled={!editable} aria-label={`${platform.name} 名称`} /><span className="truncate font-mono text-[12px] text-[var(--muted-foreground)]">{platform.slug}</span><input className="input min-h-9" name="defaultCapacity" type="number" min="1" max="99" defaultValue={platform.defaultCapacity} disabled={!editable} aria-label={`${platform.name} 默认席位数`} /><select className="select min-h-9" name="status" defaultValue={platform.status === "ACTIVE" ? "ACTIVE" : "PAUSED"} disabled={!editable} aria-label={`${platform.name} 状态`}><option value="ACTIVE">启用</option><option value="PAUSED">停用</option></select><span className="tabular text-[12px]">{platform.slotCount}</span><label className="btn min-h-9 cursor-pointer px-2 text-[12px]"><ImagePlus size={14} />选择图片<input className="sr-only" name="iconFile" type="file" accept="image/png,image/jpeg,image/webp" disabled={!editable} /></label><div className="flex gap-1">{editable && <SubmitButton className="min-h-9 px-2.5 text-[12px]">更新</SubmitButton>}{editable && platform.icon && <button className="btn icon-btn size-9" type="submit" name="intent" value="reset-icon" aria-label={`恢复 ${platform.name} 默认图标`} title="恢复默认图标"><RotateCcw size={14} /></button>}</div></ActionForm></td></tr>)}</tbody></table></div>
    <FormDialog open={newPlatform} title="新增平台" description="添加后会在共享账号页生成新的工作表标签" onClose={() => setNewPlatform(false)}><NewPlatformForm close={() => setNewPlatform(false)} /></FormDialog>
  </>;
}
