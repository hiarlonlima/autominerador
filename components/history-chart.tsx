"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { bucketize, type Range, type RawSnapshot } from "@/lib/chart-buckets";
import { cn } from "@/lib/utils";

const TABS: Array<{ key: Range; label: string }> = [
  { key: "24h", label: "24 h" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "all", label: "Tudo" },
];

export function HistoryChart({ data }: { data: RawSnapshot[] }) {
  const [range, setRange] = useState<Range>("7d");
  const points = useMemo(() => bucketize(data, range), [data, range]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                range === key
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {points.length < 2 ? (
        <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          {points.length === 0
            ? "Sem dados neste período."
            : "Colete mais uma vez pra ver a evolução."}
        </div>
      ) : (
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="avg-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) =>
                  range === "24h"
                    ? format(new Date(v), "HH'h'", { locale: ptBR })
                    : format(new Date(v), "dd/MM", { locale: ptBR })
                }
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={30}
              />
              <Tooltip content={<ChartTooltip range={range} />} />
              {/* banda min-max só aparece quando o bucket tem >1 coleta (7d/30d/all) */}
              {range !== "24h" && (
                <Area
                  type="monotone"
                  dataKey="range"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.12}
                  isAnimationActive={false}
                />
              )}
              <Area
                type="monotone"
                dataKey="avg"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#avg-area)"
                dot={range === "24h" ? { r: 3, fill: "hsl(var(--primary))" } : false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

interface TooltipPayloadItem {
  payload?: {
    avg?: number;
    min?: number;
    max?: number;
    count?: number;
  };
}

function ChartTooltip({
  active,
  payload,
  label,
  range,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number;
  range: Range;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  if (!p) return null;
  const d = label ? new Date(label) : null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 text-muted-foreground">
        {d
          ? range === "24h"
            ? format(d, "dd 'de' MMM, HH:mm", { locale: ptBR })
            : format(d, "dd 'de' MMM", { locale: ptBR })
          : ""}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-foreground">{p.avg}</span>
        <span className="text-muted-foreground">
          {range === "24h" ? "ativos" : "média de ativos"}
        </span>
      </div>
      {range !== "24h" && p.min !== p.max && (
        <div className="mt-1 text-muted-foreground">
          mín {p.min} · máx {p.max} · {p.count} coleta(s)
        </div>
      )}
    </div>
  );
}
