import { Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDays } from "@/lib/utils";

export type AdListItem = {
  id: string;
  archiveId: string;
  pageName: string | null;
  snapshotUrl: string | null;
  bodyText: string | null;
  mediaType: string | null;
  ctaText: string | null;
  linkUrl: string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  isActive: boolean;
  collationId: string | null;
  collationCount: number;
  videoHdUrl?: string | null;
  videoSdUrl?: string | null;
  originalImageUrl?: string | null;
  firstSeenAt: string | Date;
  lastSeenAt: string | Date;
};

export function AdList({ ads }: { ads: AdListItem[] }) {
  if (ads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum anúncio coletado ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}

// Só retorna URL quando temos mídia em alta resolução (vídeo HD/SD ou imagem
// original). O `snapshotUrl` é só um thumbnail — se cairmos nele, o botão some
// e o usuário sabe que precisa rodar um scrape pra pegar o HD.
export function adDownloadUrl(ad: {
  archiveId: string;
  videoHdUrl?: string | null;
  videoSdUrl?: string | null;
  originalImageUrl?: string | null;
}): string | null {
  const src = ad.videoHdUrl ?? ad.videoSdUrl ?? ad.originalImageUrl ?? null;
  if (!src) return null;
  return `/api/download?url=${encodeURIComponent(src)}&filename=ad_${ad.archiveId}`;
}

function AdCard({ ad }: { ad: AdListItem }) {
  const adUrl = `https://www.facebook.com/ads/library/?id=${ad.archiveId}`;
  const startedAt = ad.startDate ?? ad.firstSeenAt;
  const downloadHref = adDownloadUrl(ad);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card/50 transition-colors hover:border-border/90">
      <a
        href={adUrl}
        target="_blank"
        rel="noreferrer"
        className="relative block aspect-[4/5] bg-muted"
        title="Ver na biblioteca"
      >
        {ad.snapshotUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={ad.snapshotUrl}
            alt={ad.bodyText ?? "Anúncio"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sem preview
          </div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-1">
          {ad.isActive ? (
            <Badge variant="success" className="gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              Ativo
            </Badge>
          ) : (
            <Badge variant="destructive">Inativo</Badge>
          )}
          {ad.mediaType && (
            <Badge variant="secondary" className="text-[10px]">
              {ad.mediaType}
            </Badge>
          )}
        </div>
        <div className="absolute right-2 top-2 rounded-md bg-background/80 p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <ExternalLink className="h-3 w-3" />
        </div>
      </a>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {ad.bodyText && (
          <p className="line-clamp-2 text-xs text-foreground/90">
            {ad.bodyText}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span title={startedAt ? new Date(startedAt).toLocaleString("pt-BR") : ""}>
            {ad.isActive ? "Ativo há" : "Ativo por"} {formatRelativeDays(startedAt)}
          </span>
          {ad.ctaText && (
            <span className="rounded bg-muted px-1.5 py-0.5 uppercase tracking-wider">
              {ad.ctaText}
            </span>
          )}
        </div>
        {downloadHref ? (
          <a
            href={downloadHref}
            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background/60 px-2 py-1.5 text-[11px] font-medium text-foreground/90 transition-colors hover:border-primary/40 hover:text-primary"
            title="Baixar em HD"
          >
            <Download className="h-3 w-3" />
            Baixar HD
          </a>
        ) : (
          <div
            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 px-2 py-1.5 text-[10px] text-muted-foreground"
            title="Roda um scrape no alvo pra pegar a URL em HD"
          >
            HD não disponível — rode um scrape
          </div>
        )}
      </div>
    </div>
  );
}
