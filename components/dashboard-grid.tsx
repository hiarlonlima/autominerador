"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { TargetCard, type TargetCardData } from "./target-card";
import { Button } from "./ui/button";
import { CompareResultDialog, type CompareResult } from "./compare-result-dialog";
import type { FolderItem } from "./folder-bar";
import { cn } from "@/lib/utils";

const MAX_COMPARE = 3;
const MIN_COMPARE = 2;

export function DashboardGrid({
  targets,
  folders,
}: {
  targets: TargetCardData[];
  folders: FolderItem[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_COMPARE
          ? prev
          : [...prev, id],
    );
  }

  async function handleCompare() {
    if (selected.length < MIN_COMPARE) return;
    setComparing(true);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro na análise");
      setResult(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setComparing(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {targets.map((t) => (
          <TargetCard
            key={t.id}
            target={t}
            folders={folders}
            selected={selected.includes(t.id)}
            onToggleSelect={() => toggle(t.id)}
            selectionDisabled={selected.length >= MAX_COMPARE}
          />
        ))}
      </div>

      {selected.length > 0 && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-6 z-30 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full border border-border bg-card/90 px-4 py-2.5 shadow-2xl shadow-black/50 backdrop-blur",
            "animate-in slide-in-from-bottom-4",
          )}
        >
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
              {selected.length}
            </div>
            <span className="text-muted-foreground">
              {selected.length < MIN_COMPARE
                ? `Selecione mais ${MIN_COMPARE - selected.length} pra comparar`
                : `pronto${selected.length > 1 ? "s" : ""} pra comparar (máx ${MAX_COMPARE})`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected([])}
              disabled={comparing}
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={handleCompare}
              disabled={comparing || selected.length < MIN_COMPARE}
            >
              {comparing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {comparing ? "Analisando…" : "Comparar com IA"}
            </Button>
          </div>
        </div>
      )}

      <CompareResultDialog
        open={result !== null}
        onOpenChange={(v) => {
          if (!v) setResult(null);
        }}
        result={result}
      />
    </>
  );
}
