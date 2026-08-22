"use client";

import { type ReactNode, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/app/actions";

type ServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>;
const initial: ActionState = { ok: false, message: "" };

export function ActionForm({ action, children, className, onSuccess }: { action: ServerAction; children: ReactNode; className?: string; onSuccess?: () => void }) {
  const [state, formAction] = useActionState(action, initial);
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => {
    if (!state.message) return;
    if (state.ok) { toast.success(state.message); onSuccessRef.current?.(); }
    else toast.error(state.message);
  }, [state]);
  return <form action={formAction} className={className}>{children}</form>;
}
