import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Select, MenuItem } from "@mui/material";
import api from "../../services/api";
import type { Transaction } from "../../types";
import AlertChip from "../AlertChip";

const COLORS = {
  panel: "#1a1c22",
  border: "#242530",
  text: "#fff",
  muted: "#9ca3af",
  revenue: "#1ed760",
  expense: "#f5a623",
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthPoint {
  month: string;
  sortKey: string;
  income: number;
  expenses: number;
}

type ChartMode = "monthly" | "weekly" | "yearly";

function getWeekKey(d: Date): { key: string; label: string } {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - oneJan.getTime()) / 86400000) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return { key: `${d.getFullYear()}-W${String(week).padStart(2, "0")}`, label: `Wk ${week}` };
}

function aggregate(transactions: Transaction[], mode: ChartMode): MonthPoint[] {
  const map = new Map<string, MonthPoint>();

  for (const t of transactions) {
    if (t.status !== "Paid") continue;
    const d = new Date(t.date);
    let key: string;
    let label: string;

    if (mode === "weekly") {
      const w = getWeekKey(d);
      key = w.key;
      label = w.label;
    } else if (mode === "yearly") {
      key = `${d.getFullYear()}`;
      label = `${d.getFullYear()}`;
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      label = MONTH_LABELS[d.getMonth()];
    }

    if (!map.has(key)) {
      map.set(key, { month: label, sortKey: key, income: 0, expenses: 0 });
    }
    const point = map.get(key)!;
    if (t.category === "Revenue") point.income += t.amount;
    else point.expenses += t.amount;
  }

  return Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

function CustomTooltip({ active, payload, hoveredKey }: any) {
  if (!active || !payload?.length) return null;
  const shown = hoveredKey ? payload.filter((p: any) => p.dataKey === hoveredKey) : [payload[0]];
  if (!shown.length) return null;
  const p = shown[0];
  return (
    <div
      style={{
        background: p.color,
        borderRadius: 8,
        padding: "8px 14px",
        color: "#ffffff",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9, color: "#ffffff" }}>{p.name}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>${p.value.toLocaleString()}</div>
    </div>
  );
}

export default function OverviewChart() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>("income");
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [mode, setMode] = useState<ChartMode>("monthly");
  const [tickAngle, setTickAngle] = useState(0);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w <= 640) setTickAngle(-90);
      else if (w <= 1024) setTickAngle(-45);
      else setTickAngle(0);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const res = await api.get("/transactions", { params: { limit: 1000, page: 1 } });
        const data = res.data?.transactions ?? res.data?.data ?? res.data;
        if (!cancelled) setTransactions(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load chart data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => aggregate(transactions, mode), [transactions, mode]);
  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 24,
        height: "100%",
      }}
    >
      <style>{`
        .overview-header {
          display: grid;
          grid-template-columns: auto 1fr auto;
          grid-template-areas: "title legend select";
          align-items: center;
          column-gap: 16px;
          margin-bottom: 20px;
        }
        .overview-title { grid-area: title; }
        .overview-legend { grid-area: legend; display: flex; align-items: center; gap: 16px; justify-self: end; }
        .overview-select { grid-area: select; }
        @media (max-width: 640px) {
          .overview-header {
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "title select"
              "legend legend";
            row-gap: 12px;
          }
          .overview-legend { justify-self: center; }
        }
      `}</style>
      <div className="overview-header">
        <h3 className="overview-title" style={{ color: COLORS.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Overview</h3>
        <div className="overview-legend">
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.muted, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.revenue, display: "inline-block" }} />
            Income
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.muted, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.expense, display: "inline-block" }} />
            Expenses
          </div>
        </div>
        <Select
          className="overview-select"
          value={mode}
          onChange={(e) => setMode(e.target.value as ChartMode)}
          sx={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
            color: COLORS.muted,
            fontSize: 13,
            fontFamily: "inherit",
            height: 34,
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "& .MuiSelect-select": { padding: "6px 10px" },
            "& .MuiSvgIcon-root": { color: COLORS.muted },
          }}
          MenuProps={{
            slotProps: {
              paper: {
                sx: {
                  background: COLORS.panel,
                  color: COLORS.text,
                  "& .MuiMenuItem-root:hover": { background: COLORS.border },
                },
              },
            },
          }}
        >
          <MenuItem value="monthly">Monthly</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="yearly">Yearly</MenuItem>
        </Select>
      </div>

      {loading ? (
        <div style={{ color: COLORS.muted, textAlign: "center", padding: "60px 0" }}>Loading chart…</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            onMouseMove={(s: any) => setActiveLabel(s?.activeLabel ?? null)}
            onMouseLeave={() => setActiveLabel(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
            <XAxis
              dataKey="month"
              stroke={COLORS.muted}
              fontSize={12}
              interval={mode === "weekly" ? 2 : 0}
              tickLine={false}
              angle={tickAngle}
              textAnchor={tickAngle === 0 ? "middle" : "end"}
              height={tickAngle === 0 ? 30 : 60}
            />
            <YAxis stroke={COLORS.muted} fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip content={<CustomTooltip hoveredKey={hoveredKey} />} />
            {activeLabel && (
              <ReferenceLine x={activeLabel} stroke={COLORS.muted} strokeDasharray="3 3" />
            )}
            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke={COLORS.revenue}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                onMouseOver: () => setHoveredKey("income"),
              }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke={COLORS.expense}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                onMouseOver: () => setHoveredKey("expenses"),
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <AlertChip open={!!error} message={error || ""} severity="error" onClose={() => setError(null)} />
    </div>
  );
}