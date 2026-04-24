"use client";

import { Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDays } from "@/lib/utils";
import { adDownloadUrl, type AdListItem } from "./ad-list";

type Group = {
  ads: AdListItem[];
  count: number;
  activeCount: number;
};

export function DuplicatesList({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum criativo escalado (todos os anúncios são únicos até agora).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((g, i) => (
        <GroupCard key={`${g.ads[0]?.archiveId}-${i}`} group={g} />
      ))}
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  const sample = group.ads[0];
  const oldest = group.ads
    .map((a) => new Date(a.startDate ?? a.firstSeenAt).getTime())
    .sort((a, b) => a - b)[0];

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card/50 p-3 transition-colors hover:border-border/90">
      <a
        href={`https://www.facebook.com/ads/library/?id=${sample.archiveId}`}
        target="_blank"
        rel="noreferrer"
        className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        {sample.snapshotUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={sample.snapshotUrl}
            alt={sample.bodyText ?? "Anúncio"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
            Sem preview
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            ×{group.count}
          </Badge>
          {sample.mediaType && (
            <Badge variant="outline" className="h-5 border-white/20 bg-black/40 px-1.5 text-[10px] text-white/90">
              {sample.mediaType}
            </Badge>
          )}
        </div>
      </a>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant={group.activeCount > 0 ? "success" : "destructive"} className="gap-1">
              {group.activeCount > 0 ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
              ) : null}
              {group.activeCount}/{group.count} ativos
            </Badge>
            {sample.ctaText && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {sample.ctaText}
              </span>
            )}
          </div>
          <p className="line-clamp-3 text-xs text-foreground/90">
            {sample.bodyText || sample.linkUrl || "Sem texto"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>
            Escalado há {formatRelativeDays(oldest ? new Date(oldest) : null)}
          </span>
          <div className="flex items-center gap-3">
            {adDownloadUrl(sample) && (
              <a
                href={adDownloadUrl(sample)!}
                className="inline-flex items-center gap-1 hover:text-primary"
                title={sample.videoHdUrl || sample.originalImageUrl ? "Baixar HD" : "Baixar preview"}
              >
                <Download className="h-3 w-3" />
                Baixar
              </a>
            )}
            <a
              href={`https://www.facebook.com/ads/library/?id=${sample.archiveId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              Biblioteca <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
