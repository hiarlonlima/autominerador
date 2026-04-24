"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompareResultBlock } from "./compare-result-block";
import { cn } from "@/lib/utils";

const MAX = 3;
const MIN = 2;

type Row = {
  id: string;
  name: string;
  pageName: string | null;
  inputType: string;
  folderName: string | null;
  folderColor: string | null;
  activeNow: number;
  adCount: number;
};

type Result = {
  analysis: string;
  targets: Array<{
    name: string;
    activeNow: number;
    avgLast7: number;
    oldestActiveLabel: string;
  }>;
};

export function CompareView({ targets }: { targets: Row[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX
          ? prev
          : [...prev, id],
    );
  }

  async function analyze() {
    if (selected.length < MIN) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro na análise");
      setResult(data);
      // scroll suave pro resultado
      setTimeout(() => {
        document.getElementById("compare-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  if (targets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">Nenhum alvo cadastrado</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Volta pro dashboard e adiciona pelo menos 2 alvos antes de comparar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {targets.map((t) => {
          const isSelected = selected.includes(t.id);
          const disabled = !isSelected && selected.length >= MAX;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              disabled={disabled}
              className={cn(
                "group relative text-left",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <Card
                className={cn(
                  "p-4 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "hover:border-border/90",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{t.name}</h3>
                      {t.inputType === "library_url" ? (
                        <Badge variant="outline" className="text-[10px]">Busca</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Página</Badge>
                      )}
                    </div>
                    {t.pageName && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {t.pageName}
                      </p>
                    )}
                    {t.folderName && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: t.folderColor ?? "#64748b" }}
                        />
                        {t.folderName}
                      </div>
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/70 bg-card/60",
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-semibold">{t.activeNow}</span>
                  <span className="text-xs text-muted-foreground">ativos agora</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {t.adCount} histórico
                  </span>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-6 z-20 mx-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-full border border-border bg-card/90 px-4 py-2.5 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
            {selected.length}
          </div>
          <span className="text-muted-foreground">
            {selected.length === 0
              ? `Selecione ${MIN} ou ${MAX} alvos`
              : selected.length < MIN
                ? `Selecione mais ${MIN - selected.length}`
                : `${selected.length} selecionado${selected.length > 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected([])}
              disabled={loading}
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
          <Button
            size="sm"
            onClick={analyze}
            disabled={loading || selected.length < MIN}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {loading ? "Analisando…" : "Analisar com IA"}
          </Button>
        </div>
      </div>

      {loading && (
        <Card className="flex items-center gap-3 p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">IA está analisando…</p>
            <p className="text-xs text-muted-foreground">
              Coletando snapshots, criativos e enviando pra OpenAI. ~15–30 s.
            </p>
          </div>
        </Card>
      )}

      {result && (
        <div id="compare-result">
          <CompareResultBlock result={result} />
        </div>
      )}
    </div>
  );
}
