"use client";

import { type ReactNode, useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/app/actions";

type ServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>;
const initial: ActionState = { ok: false, message: "" };

export function ActionForm({ action, children, className, onSuccess }: { action: ServerAction; children: ReactNode; className?: string; onSuccess?: () => void }) {
  const [state, formAction] = useActionState(action, initial);
  useEffect(() => {
    if (!state.message) return;
    if (state.ok) { toast.success(state.message); onSuccess?.(); }
    else toast.error(state.message);
  }, [state, onSuccess]);
  return <form action={formAction} className={className}>{children}</form>;
}
