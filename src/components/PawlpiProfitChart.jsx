import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatTotal, parseAmount } from "../utils/pawlpiHelpers";

const PIE_CHART_COLORS = [
  "#22c55e",
  "#16a34a",
  "#4ade80",
  "#15803d",
  "#86efac",
  "#f59e0b",
  "#10b981",
  "#65a30d",
];
const PIE_LOW_PERCENT_COLOR = "#ef4444";

function profitSliceColor(entry, index) {
  if (entry.percent < 10) return PIE_LOW_PERCENT_COLOR;
  return PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];
}

export default function PawlpiProfitChart({ publishedEntries = [] }) {
  const profitPieData = useMemo(() => {
    const byYear = {};
    for (const e of publishedEntries) {
      const amt = parseAmount(e.amount);
      if (amt <= 0) continue;
      const y = Number(e.year);
      byYear[y] = (byYear[y] || 0) + amt;
    }
    const rows = Object.entries(byYear)
      .map(([year, value]) => ({ year: Number(year), value }))
      .sort((a, b) => b.year - a.year);
    const total = rows.reduce((sum, r) => sum + r.value, 0);
    return rows.map((r, i) => {
      const entry = {
        name: String(r.year),
        value: r.value,
        year: r.year,
        percent: total > 0 ? Math.round((r.value / total) * 1000) / 10 : 0,
      };
      return { ...entry, color: profitSliceColor(entry, i) };
    });
  }, [publishedEntries]);

  if (profitPieData.length === 0) return null;

  return (
    <div className="mt-6 sm:mt-8 rounded-xl border border-zinc-200 bg-paper p-4 sm:p-5 shadow-sm">
      <div className="mb-4 sm:mb-5">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted">
          Published Profit
        </p>
        <p className="mt-1 text-[10px] sm:text-xs text-zinc-400 leading-relaxed">
          Share of total profit by year
        </p>
      </div>
      <div className="h-44 sm:h-48 w-full mx-auto max-w-[16rem] sm:max-w-none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={profitPieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="42%"
              outerRadius="78%"
              paddingAngle={2}
              stroke="none"
            >
              {profitPieData.map((entry) => (
                <Cell key={entry.year} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => [
                `${formatTotal(value)} (${item.payload.percent}%)`,
                `${item.payload.name} profit`,
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e4e4e7",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-5 pt-4 border-t border-zinc-100 space-y-3">
        {profitPieData.map((entry) => (
          <li
            key={entry.year}
            className="flex items-center gap-3 text-xs sm:text-sm"
          >
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="font-bold text-ink tabular-nums w-11 shrink-0">
              {entry.year}
            </span>
            <span className="flex-1 tabular-nums font-semibold text-ink text-right min-w-0">
              {formatTotal(entry.value)}
            </span>
            <span className="tabular-nums text-muted w-12 text-right shrink-0">
              {entry.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
