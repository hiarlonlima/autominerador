import { z } from "zod";

export type TargetInput =
  | { type: "library_url"; url: string; country: string }
  | { type: "page_url"; url: string; pageId?: string; country: string };

const LIBRARY_HOSTS = ["facebook.com", "www.facebook.com", "m.facebook.com"];

// Aceita:
//   https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&q=marca&search_type=keyword_unordered
//   https://www.facebook.com/ads/library/?id=123456789
//   https://www.facebook.com/minhapagina
//   https://www.facebook.com/profile.php?id=100012345
//   123456789 (page ID puro)
export function parseTargetInput(raw: string): TargetInput {
  const trimmed = raw.trim();

  // ID numérico puro → page
  if (/^\d{6,}$/.test(trimmed)) {
    return {
      type: "page_url",
      url: `https://www.facebook.com/${trimmed}`,
      pageId: trimmed,
      country: "BR",
    };
  }

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error("URL inválida. Cole uma URL da biblioteca ou da página.");
  }

  if (!LIBRARY_HOSTS.includes(url.hostname)) {
    throw new Error("URL precisa ser do facebook.com");
  }

  const country = url.searchParams.get("country") ?? "BR";

  // Biblioteca de anúncios (qualquer rota sob /ads/library/)
  if (url.pathname.startsWith("/ads/library")) {
    return { type: "library_url", url: url.toString(), country };
  }

  // Página do Facebook (ex: /nome-da-pagina ou /profile.php?id=...)
  const pageIdParam = url.searchParams.get("id");
  if (pageIdParam && /^\d+$/.test(pageIdParam)) {
    return {
      type: "page_url",
      url: url.toString(),
      pageId: pageIdParam,
      country,
    };
  }

  return { type: "page_url", url: url.toString(), country };
}

export const createTargetSchema = z.object({
  name: z.string().min(1, "Informe um apelido").max(80),
  input: z.string().min(1, "Cole a URL ou ID"),
  folderId: z.string().nullable().optional(),
});

// O actor do Apify retorna 0 resultados quando a URL tem country=ALL.
// Força um país específico (default BR) e limpa parâmetros que só atrapalham.
export function normalizeLibraryUrl(raw: string, fallbackCountry = "BR"): string {
  // o fallback também pode vir como "ALL" (targets antigos) — aí reseta pra BR
  const safeFallback =
    !fallbackCountry || fallbackCountry.toUpperCase() === "ALL"
      ? "BR"
      : fallbackCountry;
  try {
    const url = new URL(raw);
    if (!LIBRARY_HOSTS.includes(url.hostname)) return raw;

    const country = url.searchParams.get("country");
    if (!country || country.toUpperCase() === "ALL") {
      url.searchParams.set("country", safeFallback);
    }

    // flag interna que desliga a vinculação ao país; sem isso o actor
    // se confunde em URLs com view_all_page_id.
    url.searchParams.delete("is_targeted_country");

    return url.toString();
  } catch {
    return raw;
  }
}
