"use client";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export type CompareResult = {
  analysis: string;
  targets: Array<{
    name: string;
    activeNow: number;
    avgLast7: number;
    oldestActiveLabel: string;
  }>;
};

export function CompareResultBlock({ result }: { result: CompareResult }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-md" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-semibold">Análise comparativa</h2>
            <p className="text-xs text-muted-foreground">
              Gerada por IA com base em históricos e criativos coletados.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {result.targets.map((t) => (
            <div
              key={t.name}
              className="rounded-lg border border-border bg-card/50 px-3 py-2 text-xs"
            >
              <div className="font-medium">{t.name}</div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                <span>{t.activeNow} ativos</span>
                <span>média 7d: {t.avgLast7}</span>
                <span>há {t.oldestActiveLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <MarkdownBlock text={result.analysis} />
      </div>
    </Card>
  );
}

function MarkdownBlock({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");
  let listBuf: string[] = [];

  function flushList() {
    if (listBuf.length) {
      nodes.push(
        <ul key={`l-${nodes.length}`} className="mb-4 space-y-1.5 pl-5">
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
        <h3 key={`h-${nodes.length}`} className="mb-2 mt-6 text-base font-semibold tracking-tight first:mt-0">
          {renderInline(line.slice(3))}
        </h3>,
      );
    } else if (line.startsWith("### ")) {
      flushList();
      nodes.push(
        <h4 key={`h-${nodes.length}`} className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
        <p key={`p-${nodes.length}`} className="mb-3 text-sm leading-relaxed text-foreground/90">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushList();

  return <div>{nodes}</div>;
}

function renderInline(s: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let rest = s;
  let key = 0;
  while (rest.length > 0) {
    const bold = rest.match(/\*\*(.+?)\*\*/);
    const code = rest.match(/`([^`]+)`/);
    const firstMatch = [bold, code].filter(Boolean).sort(
      (a, b) => a!.index! - b!.index!,
    )[0];
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
