"use client";

import { Download, ExternalLink, Sparkles, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type WinnerCreative = {
  archiveId: string;
  mediaType: string | null;
  cta: string | null;
  copy: string;
  duplicates: number;
  snapshotUrl: string | null;
  libraryUrl: string;
  downloadUrl: string | null;
  hasHd: boolean;
};

export type CompareResult = {
  analysis: string;
  targets: Array<{
    name: string;
    activeNow: number;
    avgLast7: number;
    oldestActiveLabel: string;
  }>;
  winner?: {
    name: string;
    reason: string;
    topCreatives: WinnerCreative[];
  };
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

      {result.winner && (
        <div className="border-b border-border/60 bg-card/30 p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Vencedor
              </div>
              <div className="text-base font-semibold">{result.winner.name}</div>
            </div>
          </div>
          <p className="mb-4 text-sm text-foreground/90">{result.winner.reason}</p>

          {result.winner.topCreatives.length > 0 && (
            <>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top criativos pra modelar
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.winner.topCreatives.map((c) => (
                  <WinnerCreativeCard key={c.archiveId} creative={c} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="p-6">
        <MarkdownBlock text={result.analysis} />
      </div>
    </Card>
  );
}

function WinnerCreativeCard({ creative }: { creative: WinnerCreative }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card/60">
      <div className="relative aspect-[4/5] bg-muted">
        {creative.snapshotUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={creative.snapshotUrl}
            alt={creative.copy.slice(0, 60)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sem preview
          </div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-1">
          <Badge variant="success" className="h-5 px-1.5 text-[10px]">
            ×{creative.duplicates}
          </Badge>
          {creative.mediaType && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {creative.mediaType}
            </Badge>
          )}
        </div>
      </div>
      <div className="space-y-2 p-3">
        <p className="line-clamp-3 text-xs text-foreground/90">{creative.copy}</p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
            ID: {creative.archiveId}
          </span>
        </div>
        <div className="flex gap-1.5">
          {creative.downloadUrl && (
            <a
              href={creative.downloadUrl}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              title={creative.hasHd ? "Baixar HD" : "Baixar preview"}
            >
              <Download className="h-3 w-3" />
              {creative.hasHd ? "Baixar HD" : "Baixar"}
            </a>
          )}
          <a
            href={creative.libraryUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-background/60 px-2 py-1.5 text-[11px] font-medium transition-colors hover:border-primary/40 hover:text-primary"
            title="Ver na biblioteca"
          >
            <ExternalLink className="h-3 w-3" />
            Biblioteca
          </a>
        </div>
      </div>
    </div>
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
