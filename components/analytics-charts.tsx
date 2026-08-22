"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AnalyticsCharts({
  platformData,
  renewalData,
}: {
  platformData: { name: string; slots: number; members: number }[];
  renewalData: { month: string; amount: number; count: number }[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="panel p-4">
        <div className="mb-4">
          <h2 className="font-semibold">各平台规模</h2>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            合租车位与在位车友数量
          </p>
        </div>
        <div
          className="h-[300px]"
          role="img"
          aria-label="各平台合租车位和车友数量柱状图"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={platformData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid stroke="#edf0f3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#657080" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#657080" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#f6f8fa" }}
                contentStyle={{
                  border: "1px solid #e3e7ed",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="slots"
                name="合租车位"
                fill="#3b82f6"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="members"
                name="车友"
                fill="#16a377"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="panel p-4">
        <div className="mb-4">
          <h2 className="font-semibold">近 6 个月续费</h2>
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            续费金额趋势
          </p>
        </div>
        <div
          className="h-[300px]"
          role="img"
          aria-label="近六个月续费金额折线图"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={renewalData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid stroke="#edf0f3" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#657080" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#657080" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #e3e7ed",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(value) => [
                  `¥ ${Number(value).toFixed(2)}`,
                  "续费金额",
                ]}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
