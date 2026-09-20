"use client";

import { addMonths, format, getDay, getDaysInMonth, isSameDay, startOfMonth } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

type Revenue = { createdAt: string; amount: number };

export function RevenueCalendar({ renewals }: { renewals: Revenue[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const days = getDaysInMonth(month);
  const leadingBlanks = (getDay(month) + 6) % 7;
  const trailingBlanks = (7 - ((leadingBlanks + days) % 7)) % 7;
  const amounts = useMemo(() => {
    const result = new Map<string, number>();
    for (const renewal of renewals) {
      const date = new Date(renewal.createdAt);
      const key = format(date, "yyyy-MM-dd");
      result.set(key, (result.get(key) || 0) + renewal.amount);
    }
    return result;
  }, [renewals]);

  return <section className="dashboard-calendar panel" aria-labelledby="income-calendar-title">
    <div className="dashboard-card-header calendar-header"><div><h2 id="income-calendar-title">本月收入</h2><p>按日期查看每日续费收入</p></div><div className="calendar-controls"><button onClick={() => setMonth((value) => addMonths(value, -1))} aria-label="上个月" title="上个月"><ChevronLeft size={16} /></button><span><CalendarDays size={15} />{format(month, "yyyy 年 M 月")}</span><button onClick={() => setMonth((value) => addMonths(value, 1))} aria-label="下个月" title="下个月"><ChevronRight size={16} /></button></div></div>
    <div className="calendar-weekdays">{["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((day) => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid">
      {Array.from({ length: leadingBlanks }, (_, index) => <span key={`before-${index}`} className="calendar-blank" />)}
      {Array.from({ length: days }, (_, index) => { const date = new Date(month.getFullYear(), month.getMonth(), index + 1); const amount = amounts.get(format(date, "yyyy-MM-dd")) || 0; return <div key={index} className={isSameDay(date, new Date()) ? "calendar-day calendar-day-today" : "calendar-day"} title={`${format(date, "M月d日")}，收入 ¥${amount.toFixed(2)}`}><span className="calendar-date">{index + 1}</span><span className={amount > 0 ? "calendar-income" : "calendar-zero"}>¥{amount.toFixed(2)}</span></div>; })}
      {Array.from({ length: trailingBlanks }, (_, index) => <span key={`after-${index}`} className="calendar-blank" />)}
    </div>
  </section>;
}
