"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

export function FormDialog({ open, title, description, onClose, children, width = 520 }: { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; width?: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return (
    <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); onClose(); }} onClose={onClose} className="m-auto max-h-[90dvh] w-[calc(100%-24px)] overflow-hidden rounded-[8px] border border-[var(--border)] bg-white p-0 shadow-2xl backdrop:bg-black/35" style={{ maxWidth: width }}>
      <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
        <div><h2 className="text-[16px] font-semibold">{title}</h2>{description && <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">{description}</p>}</div>
        <button type="button" className="btn icon-btn -mr-1 -mt-1" aria-label="关闭" title="关闭" onClick={onClose}><X size={17} /></button>
      </div>
      <div className="max-h-[calc(90dvh-74px)] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
