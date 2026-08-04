"use client";
// Charts take their data as props. Rendering is unchanged from the mock-data
// version — only the source moved to the API.
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import type { OccupancySlice, RouteRevenue, TrendPoint } from "@/lib/api";

const inr = (n: number) => `₹${(n / 100000).toFixed(1)}L`;
const NAVY = "#2A2E3A";
const BLUE = "#1F5F92";
const GREY = "#9AA3AE";

const tip = {
  contentStyle: {
    background: "var(--surface)", border: "1px solid var(--line)",
    borderRadius: 10, fontSize: 12, color: "var(--text)",
  },
};

export function RevenueChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NAVY} stopOpacity={0.18} />
              <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: GREY }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: GREY }} axisLine={false} tickLine={false} />
          <Tooltip {...tip} formatter={(v: number) => inr(v)} />
          <Area type="monotone" dataKey="revenue" stroke={NAVY} strokeWidth={2} fill="url(#rev)" name="Billed" />
          <Area type="monotone" dataKey="collected" stroke={BLUE} strokeWidth={2} strokeDasharray="4 4" fill="none" name="Collected" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RouteBarChart({ data }: { data: RouteRevenue[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
          <XAxis type="number" tickFormatter={inr} tick={{ fontSize: 11, fill: GREY }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="route" width={130} tick={{ fontSize: 11, fill: GREY }} axisLine={false} tickLine={false} />
          <Tooltip {...tip} formatter={(v: number) => inr(v)} cursor={{ fill: "rgba(42,46,58,0.05)" }} />
          <Bar dataKey="revenue" fill={BLUE} radius={[0, 5, 5, 0]} barSize={15} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OccupancyDonut({ data }: { data: OccupancySlice[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2} startAngle={90} endAngle={-270}>
            {data.map((_, i) => <Cell key={i} fill={i === 0 ? NAVY : "#D7DCE2"} />)}
          </Pie>
          <Tooltip {...tip} formatter={(v: number) => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
