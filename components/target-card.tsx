"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2, RefreshCw, Trash2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MiniSparkline } from "./mini-sparkline";
import { cn, deltaPercent, formatNumber, formatRelativeDays } from "@/lib/utils";

type Snapshot = { id: string; activeCount: number; capturedAt: string | Date };

export type TargetCardData = {
  id: string;
  name: string;
  inputType: string;
  pageName: string | null;
  lastRunAt: string | Date | null;
  lastError: string | null;
  isPaused: boolean;
  snapshots: Snapshot[];
  _count: { ads: number };
};

export function TargetCard({ target }: { target: TargetCardData }) {
  const router = useRouter();
  const [scraping, setScraping] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sorted = [...target.snapshots].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  );
  const latest = sorted.at(-1);
  const previous = sorted.at(-2);
  const current = latest?.activeCount ?? 0;
  const prev = previous?.activeCount ?? current;
  const delta = deltaPercent(current, prev);

  async function handleScrape() {
    setScraping(true);
    try {
      const res = await fetch(`/api/targets/${target.id}/scrape`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Falha ao coletar");
      toast.success(`Coletado: ${data.activeCount} ativo(s)`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setScraping(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover "${target.name}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/targets/${target.id}`, { method: "DELETE" });
      toast.success("Removido");
      router.refresh();
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setDeleting(false);
    }
  }

  const hasRun = Boolean(target.lastRunAt);
  const hasError = Boolean(target.lastError);

  return (
    <Card className="group relative overflow-hidden transition-colors hover:border-border/80">
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{target.name}</h3>
            {target.inputType === "library_url" ? (
              <Badge variant="outline" className="text-[10px]">Busca</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">Página</Badge>
            )}
          </div>
          {target.pageName && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {target.pageName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleScrape}
            disabled={scraping}
            title="Rodar scrape agora"
          >
            {scraping ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
            title="Remover"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 px-5">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight">
              {formatNumber(current)}
            </span>
            <span className="text-xs text-muted-foreground">anúncios ativos</span>
          </div>
          {hasRun && (
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <DeltaPill delta={delta} />
              <span className="text-muted-foreground">
                vs. última coleta
              </span>
            </div>
          )}
        </div>
        <div className="w-28">
          <MiniSparkline data={sorted.map((s) => ({ value: s.activeCount }))} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
        <span>
          {hasError ? (
            <span className="text-destructive">⚠ {target.lastError}</span>
          ) : hasRun ? (
            <>Última coleta: {formatRelativeDays(target.lastRunAt)}</>
          ) : (
            <span className="text-warning">Ainda não coletado</span>
          )}
        </span>
        <Link
          href={`/target/${target.id}`}
          className="flex items-center gap-1 font-medium text-foreground/80 hover:text-primary"
        >
          Ver detalhes <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}

function DeltaPill({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5",
        up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
      )}
    >
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {delta}%
    </span>
  );
}
