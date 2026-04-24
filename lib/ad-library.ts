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

// O actor do Apify retorna 0 resultados silenciosamente quando a URL tem
// combinações problemáticas (country=ALL, id de anúncio específico junto
// com view_all_page_id, sort_data, search_type...). Reduz a URL pra forma
// mínima que o actor digere bem.
export function normalizeLibraryUrl(raw: string, fallbackCountry = "BR"): string {
  const safeFallback =
    !fallbackCountry || fallbackCountry.toUpperCase() === "ALL"
      ? "BR"
      : fallbackCountry;
  try {
    const url = new URL(raw);
    if (!LIBRARY_HOSTS.includes(url.hostname)) return raw;

    const sp = url.searchParams;
    const viewAllPageId = sp.get("view_all_page_id");
    const q = sp.get("q");
    const adType = sp.get("ad_type") ?? "all";
    const mediaType = sp.get("media_type") ?? "all";
    const activeStatus = sp.get("active_status") ?? "active";
    let country = sp.get("country") ?? safeFallback;
    if (country.toUpperCase() === "ALL") country = safeFallback;

    // reconstrói a querystring só com o essencial.
    const clean = new URLSearchParams();
    clean.set("active_status", activeStatus);
    clean.set("ad_type", adType);
    clean.set("country", country);
    clean.set("media_type", mediaType);

    if (viewAllPageId) {
      // scraping de página específica: remove id de ad individual, search_type e sort_data
      clean.set("view_all_page_id", viewAllPageId);
    } else if (q) {
      // busca por palavra-chave
      clean.set("q", q);
      clean.set("search_type", "keyword_unordered");
    } else {
      // URL sem view_all_page_id nem q — preserva o resto
      sp.forEach((v, k) => {
        if (!clean.has(k)) clean.set(k, v);
      });
      // mas remove flags problemáticas
      clean.delete("is_targeted_country");
      clean.delete("id");
    }

    url.search = clean.toString();
    return url.toString();
  } catch {
    return raw;
  }
}
