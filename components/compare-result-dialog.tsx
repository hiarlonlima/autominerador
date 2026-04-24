"use client";

import { Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export type CompareResult = {
  analysis: string;
  targets: Array<{
    name: string;
    activeNow: number;
    avgLast7: number;
    oldestActiveLabel: string;
  }>;
};

export function CompareResultDialog({
  open,
  onOpenChange,
  result,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  result: CompareResult | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-md" />
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
            Análise comparativa
          </DialogTitle>
          <DialogDescription>
            Análise gerada por IA com base nos anúncios e históricos coletados.
          </DialogDescription>
        </DialogHeader>

        {result && (
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="mb-4 flex flex-wrap gap-2">
              {result.targets.map((t) => (
                <div
                  key={t.name}
                  className="rounded-lg border border-border bg-card/50 px-3 py-2 text-xs"
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="mt-0.5 flex gap-3 text-muted-foreground">
                    <span>{t.activeNow} ativos</span>
                    <span>média 7d: {t.avgLast7}</span>
                    <span>há {t.oldestActiveLabel}</span>
                  </div>
                </div>
              ))}
            </div>
            <MarkdownBlock text={result.analysis} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Render simples de markdown — suporta ##, ###, bullets e **bold**.
// Evitamos adicionar lib de markdown pra manter o bundle leve.
function MarkdownBlock({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");
  let listBuf: string[] = [];

  function flushList() {
    if (listBuf.length) {
      nodes.push(
        <ul key={`l-${nodes.length}`} className="mb-3 space-y-1.5 pl-4">
          {listBuf.map((it, j) => (
            <li key={j} className="list-disc text-sm text-foreground/90 marker:text-primary/70">
              {renderInline(it)}
            </li>
          ))}
        </ul>,
      );
      listBuf = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      nodes.push(
        <h3 key={`h-${nodes.length}`} className="mb-2 mt-5 text-sm font-semibold">
          {renderInline(line.slice(3))}
        </h3>,
      );
    } else if (line.startsWith("### ")) {
      flushList();
      nodes.push(
        <h4 key={`h-${nodes.length}`} className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {renderInline(line.slice(4))}
        </h4>,
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuf.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      listBuf.push(line.replace(/^\d+\.\s/, ""));
    } else {
      flushList();
      nodes.push(
        <p key={`p-${nodes.length}`} className="mb-2 text-sm text-foreground/90">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushList();

  return <div className="prose-sm">{nodes}</div>;
}

function renderInline(s: string): React.ReactNode {
  // bold **text** + código `text`
  const parts: React.ReactNode[] = [];
  let rest = s;
  let key = 0;
  while (rest.length > 0) {
    const bold = rest.match(/\*\*(.+?)\*\*/);
    const code = rest.match(/`([^`]+)`/);
    const firstMatch = [bold, code].filter(Boolean).sort((a, b) => a!.index! - b!.index!)[0];
    if (!firstMatch) {
      parts.push(rest);
      break;
    }
    const idx = firstMatch.index!;
    if (idx > 0) parts.push(rest.slice(0, idx));
    if (firstMatch === bold) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {bold![1]}
        </strong>,
      );
    } else {
      parts.push(
        <code key={key++} className="rounded bg-muted px-1 py-0.5 text-xs">
          {code![1]}
        </code>,
      );
    }
    rest = rest.slice(idx + firstMatch[0].length);
  }
  return parts;
}

// silence unused import
void X;
