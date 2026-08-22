"use client";

import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";

export function FormDialog({ open, title, description, onClose, children, width = 520 }: { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; width?: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return (
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={(event) => { event.preventDefault(); onClose(); }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%-24px)] overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-black/35" style={{ maxWidth: width }}>
      <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
        <div><h2 id={titleId} className="text-[16px] font-semibold">{title}</h2>{description && <p id={descriptionId} className="mt-1 text-[12px] text-[var(--muted-foreground)]">{description}</p>}</div>
        <button type="button" className="btn icon-btn -mr-1 -mt-1" aria-label="关闭" title="关闭" onClick={onClose}><X size={17} /></button>
      </div>
      <div className="max-h-[calc(90dvh-74px)] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel, pending = false, tone = "danger", onClose, onConfirm }: { open: boolean; title: string; description: string; confirmLabel: string; pending?: boolean; tone?: "danger" | "warning"; onClose: () => void; onConfirm: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  return (
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={(event) => { event.preventDefault(); if (!pending) onClose(); }} onMouseDown={(event) => { if (!pending && event.target === event.currentTarget) onClose(); }} className="m-auto w-[calc(100%-24px)] max-w-[420px] overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-black/45">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className={tone === "danger" ? "confirm-icon confirm-icon-danger" : "confirm-icon confirm-icon-warning"}><AlertTriangle size={20} /></span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[16px] font-semibold">{title}</h2>
            <p id={descriptionId} className="mt-2 text-[13px] leading-6 text-[var(--muted-foreground)]">{description}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-3">
        <button type="button" className="btn" disabled={pending} onClick={onClose}>取消</button>
        <button type="button" autoFocus className={tone === "danger" ? "btn btn-danger-solid" : "btn btn-warning-solid"} disabled={pending} onClick={onConfirm}>{pending && <LoaderCircle size={15} className="animate-spin" />}{pending ? "正在处理" : confirmLabel}</button>
      </div>
    </dialog>
  );
}
