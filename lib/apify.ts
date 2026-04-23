import { ApifyClient } from "apify-client";

// Tipagem do item retornado pelo actor curious_coder/facebook-ads-library-scraper.
// O scraper expõe vários campos; mantemos apenas os que usamos.
// Fonte: https://apify.com/curious_coder/facebook-ads-library-scraper/input-schema
export interface ScrapedAd {
  ad_archive_id?: string;
  adid?: string;
  archive_id?: string;
  page_id?: string;
  page_name?: string;
  collation_id?: string;
  collation_count?: number;
  snapshot?: {
    body?: { text?: string };
    cta_text?: string;
    link_url?: string;
    images?: Array<{ original_image_url?: string; resized_image_url?: string }>;
    videos?: Array<{ video_preview_image_url?: string }>;
    display_format?: string;
  };
  start_date?: number; // epoch seconds
  end_date?: number | null;
  is_active?: boolean;
  // fallbacks comuns em variações de schema
  startDate?: string | number;
  endDate?: string | number | null;
  isActive?: boolean;
  adArchiveID?: string;
  pageID?: string;
  pageName?: string;
}

function getClient() {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN não configurado");
  return new ApifyClient({ token });
}

export interface RunInput {
  urls: Array<{ url: string }>;
  scrapeAdDetails?: boolean;
  count?: number; // limite de anúncios por alvo
}

export async function runScraper(input: RunInput): Promise<ScrapedAd[]> {
  const client = getClient();
  const actorId =
    process.env.APIFY_ACTOR_ID ?? "curious_coder~facebook-ads-library-scraper";

  const run = await client.actor(actorId).call(input, {
    // timeout de 10min (coleta pode ser pesada)
    timeout: 600,
    // 512MB por URL é o mínimo exigido pelo actor
    memory: 512 * Math.max(1, input.urls.length),
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items as unknown as ScrapedAd[];
}

// Normaliza o retorno do scraper, lidando com variações de nome de campo.
export function normalizeAd(raw: ScrapedAd) {
  const archiveId =
    raw.ad_archive_id ??
    raw.archive_id ??
    raw.adArchiveID ??
    raw.adid ??
    null;

  if (!archiveId) return null;

  const toDate = (v: unknown): Date | null => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") {
      // epoch em segundos se for pequeno o suficiente
      const ms = v < 10_000_000_000 ? v * 1000 : v;
      return new Date(ms);
    }
    const d = new Date(String(v));
    return isNaN(d.getTime()) ? null : d;
  };

  const image =
    raw.snapshot?.images?.[0]?.resized_image_url ??
    raw.snapshot?.images?.[0]?.original_image_url ??
    raw.snapshot?.videos?.[0]?.video_preview_image_url ??
    null;

  const mediaType =
    raw.snapshot?.display_format?.toLowerCase().includes("video")
      ? "video"
      : raw.snapshot?.display_format?.toLowerCase().includes("carousel")
        ? "carousel"
        : raw.snapshot?.images?.length
          ? "image"
          : null;

  return {
    archiveId: String(archiveId),
    adId: raw.adid ?? null,
    pageId: raw.page_id ?? raw.pageID ?? null,
    pageName: raw.page_name ?? raw.pageName ?? null,
    snapshotUrl: image,
    bodyText: raw.snapshot?.body?.text ?? null,
    mediaType,
    ctaText: raw.snapshot?.cta_text ?? null,
    linkUrl: raw.snapshot?.link_url ?? null,
    startDate: toDate(raw.start_date ?? raw.startDate),
    endDate: toDate(raw.end_date ?? raw.endDate),
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
    collationId: raw.collation_id ?? null,
    collationCount: Math.max(1, Number(raw.collation_count ?? 1)),
  };
}
