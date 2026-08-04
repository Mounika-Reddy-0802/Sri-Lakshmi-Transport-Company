"use client";
import { useState } from "react";
import { Shell, Panel } from "@/components/dashboard/Shell";
import { studentProfile as p, studentInvoices } from "@/lib/mock-data";
import { Bus, MapPin, Clock, Phone, Download, CheckCircle2, X } from "lucide-react";

const nav = [
  { label: "My Transport", active: true }, { label: "Fee & Payments" },
  { label: "Receipts" }, { label: "Notifications" },
];

const plans = [
  { key: "Monthly", months: 1 },
  { key: "Quarterly", months: 3 },
  { key: "Half-Yearly", months: 6 },
  { key: "Full Year", months: 12 },
];

const tone: Record<string, string> = {
  Paid: "bg-steel/15 text-steel dark:text-mist",
  Pending: "bg-slate/15 text-slate",
};

export default function StudentDashboard() {
  const monthly = p.route.distanceKm * p.ratePerKm;
  const [plan, setPlan] = useState(plans[0]);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const total = monthly * plan.months;

  return (
    <Shell role="Student / Parent" user={p.name} nav={nav}>
      <h1 className="display text-2xl text-midnight dark:text-fog">Hello, {p.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted2">{p.org} · {p.grade} · {p.id}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Your route">
          <div className="space-y-3 text-sm">
            <Row icon={<MapPin size={16} />} label="Route" value={`${p.route.code} · ${p.route.name}`} />
            <Row icon={<MapPin size={16} />} label="Pickup point" value={p.pickup.point} />
            <Row icon={<Clock size={16} />} label="Pickup / Drop" value={`${p.pickup.time} → ${p.pickup.drop}`} />
            <Row icon={<MapPin size={16} />} label="Distance" value={`${p.route.distanceKm} km`} />
          </div>
        </Panel>
        <Panel title="Your bus">
          <div className="space-y-3 text-sm">
            <Row icon={<Bus size={16} />} label="Vehicle" value={`${p.bus.reg}`} />
            <Row icon={<Bus size={16} />} label="Type" value={p.bus.type} />
            <Row icon={<Phone size={16} />} label="Driver" value={p.driver.name} />
            <Row icon={<Phone size={16} />} label="Contact" value={p.driver.phone} />
          </div>
        </Panel>
        <Panel title="Fee calculation">
          <p className="text-sm text-muted2">Monthly fee = distance × rate per km</p>
          <p className="mt-2 text-sm text-midnight dark:text-fog">
            {p.route.distanceKm} km × ₹{p.ratePerKm} = <span className="font-semibold">₹{monthly.toLocaleString("en-IN")}/mo</span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {plans.map((pl) => (
              <button key={pl.key} onClick={() => setPlan(pl)}
                className={`rounded-lg border px-3 py-2 text-xs transition ${plan.key === pl.key ? "border-steel bg-steel/10 font-medium text-steel dark:text-mist" : "hairline text-muted2 hover:bg-slate/10"}`}>
                {pl.key}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-steel/8 p-3">
            <span className="text-sm text-muted2">{plan.key} total</span>
            <span className="display text-lg text-midnight dark:text-fog">₹{total.toLocaleString("en-IN")}</span>
          </div>
          <button onClick={() => setPaying(true)}
            className="mt-3 w-full rounded-full bg-midnight px-5 py-3 text-sm font-medium text-white transition hover:bg-steel">
            Pay ₹{total.toLocaleString("en-IN")}
          </button>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Payment history">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wide text-muted2">
                <th className="pb-2">Invoice</th><th className="pb-2">Period</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Date</th><th className="pb-2"></th>
              </tr></thead>
              <tbody>
                {studentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t hairline">
                    <td className="py-2.5 font-medium text-midnight dark:text-fog">{inv.id}</td>
                    <td className="py-2.5 text-muted2">{inv.period}</td>
                    <td className="py-2.5 text-muted2">₹{inv.amount.toLocaleString("en-IN")}</td>
                    <td className="py-2.5"><span className={`rounded-full px-2.5 py-1 text-xs ${tone[inv.status]}`}>{inv.status}</span></td>
                    <td className="py-2.5 text-muted2">{inv.date}</td>
                    <td className="py-2.5">{inv.status === "Paid" && <button className="inline-flex items-center gap-1 text-xs text-steel dark:text-mist"><Download size={13} /> Receipt</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {paying && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" onClick={() => { setPaying(false); setPaid(false); }}>
          <div className="w-full max-w-sm surface rounded-xl2 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="display text-midnight dark:text-fog">Razorpay (demo)</span>
              <button onClick={() => { setPaying(false); setPaid(false); }} className="text-muted2"><X size={18} /></button>
            </div>
            {paid ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="text-steel dark:text-mist" size={42} />
                <p className="display mt-3 text-lg text-midnight dark:text-fog">Payment successful</p>
                <p className="mt-1 text-sm text-muted2">₹{total.toLocaleString("en-IN")} · {plan.key} · receipt generated.</p>
                <p className="mt-3 text-xs text-muted2">Demo only — no real transaction occurred.</p>
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm text-muted2">Paying for {p.name} · {plan.key}</p>
                <div className="mt-2 display text-2xl text-midnight dark:text-fog">₹{total.toLocaleString("en-IN")}</div>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                  {["UPI", "Debit Card", "Credit Card", "Net Banking"].map((m) => (
                    <span key={m} className="rounded-lg border hairline px-3 py-2 text-center text-muted2">{m}</span>
                  ))}
                </div>
                <button onClick={() => setPaid(true)} className="mt-5 w-full rounded-full bg-midnight px-5 py-3 text-sm font-medium text-white hover:bg-steel">
                  Pay now
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-muted2">{icon}{label}</span>
      <span className="text-right font-medium text-midnight dark:text-fog">{value}</span>
    </div>
  );
}
