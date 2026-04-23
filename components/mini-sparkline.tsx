"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function MiniSparkline({ data }: { data: Array<{ value: number }> }) {
  if (data.length < 2) {
    return (
      <div className="flex h-12 items-center justify-center text-[11px] text-muted-foreground">
        Sem histórico ainda
      </div>
    );
  }
  return (
    <div className="h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={1.75}
            fill="url(#spark)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
