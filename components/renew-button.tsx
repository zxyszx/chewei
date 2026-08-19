"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { FormDialog } from "@/components/form-dialog";
import { RenewalForm, type MemberItem } from "@/components/slot-manager";

export function RenewButton({ member, compact = false }: { member: MemberItem; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return <><button className={compact ? "btn min-h-8 px-2 text-[12px]" : "btn"} onClick={() => setOpen(true)}><RefreshCw size={compact ? 13 : 15} />续费</button><FormDialog open={open} title="续费" description="确认后会生成一条不可覆盖的续费记录" onClose={() => setOpen(false)}><RenewalForm member={member} close={() => setOpen(false)} /></FormDialog></>;
}
