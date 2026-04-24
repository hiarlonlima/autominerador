import { prisma } from "./prisma";
import { normalizeAd, runScraper } from "./apify";
import { normalizeLibraryUrl } from "./ad-library";
import type { Target } from "@prisma/client";

export async function scrapeTarget(target: Target) {
  const now = new Date();
  try {
    // normaliza country=ALL e outros parâmetros problemáticos antes de scrapear
    const url = normalizeLibraryUrl(target.inputValue, target.country || "BR");

    const items = await runScraper({
      urls: [{ url }],
      scrapeAdDetails: true,
      // 200 costuma caber em <60s do Hobby e cobre a maior parte dos alvos reais
      count: 200,
    });

    // actor às vezes retorna um único item com { error: "..." } em vez de
    // falhar o run. Trata isso como erro real.
    if (items.length === 1 && "error" in (items[0] as object) && (items[0] as { error?: string }).error) {
      const raw = (items[0] as { error: string; errorCode?: string });
      const code = raw.errorCode ?? "";
      const friendly =
        code === "ADS_NOT_FOUND"
          ? "Página sem anúncios públicos neste país. Confira a URL ou tente outro país."
          : raw.error;
      throw new Error(friendly);
    }

    const normalized = items
      .map(normalizeAd)
      .filter((x): x is NonNullable<ReturnType<typeof normalizeAd>> => x !== null);

    const activeCount = normalized.filter((a) => a.isActive).length;
    const totalCount = normalized.length;

    const pageIdFromItems = normalized.find((a) => a.pageId)?.pageId ?? null;
    const pageNameFromItems = normalized.find((a) => a.pageName)?.pageName ?? null;

    // Upserts em paralelo FORA de transação — cada linha é atômica per-row,
    // e assim a operação inteira cabe no maxDuration de 60 s do Hobby.
    await Promise.all(
      normalized.map((ad) =>
        prisma.ad.upsert({
          where: {
            targetId_archiveId: {
              targetId: target.id,
              archiveId: ad.archiveId,
            },
          },
          create: {
            targetId: target.id,
            archiveId: ad.archiveId,
            adId: ad.adId,
            pageName: ad.pageName,
            snapshotUrl: ad.snapshotUrl,
            bodyText: ad.bodyText,
            mediaType: ad.mediaType,
            ctaText: ad.ctaText,
            linkUrl: ad.linkUrl,
            startDate: ad.startDate,
            endDate: ad.endDate,
            isActive: ad.isActive,
            collationId: ad.collationId,
            collationCount: ad.collationCount,
            firstSeenAt: now,
            lastSeenAt: now,
            becameInactiveAt: ad.isActive ? null : now,
          },
          update: {
            snapshotUrl: ad.snapshotUrl,
            bodyText: ad.bodyText,
            mediaType: ad.mediaType,
            ctaText: ad.ctaText,
            linkUrl: ad.linkUrl,
            endDate: ad.endDate,
            isActive: ad.isActive,
            collationId: ad.collationId,
            collationCount: ad.collationCount,
            lastSeenAt: now,
            ...(ad.isActive ? { becameInactiveAt: null } : {}),
          },
        }),
      ),
    );

    // Snapshot + marcação de inativos + atualização do target dentro de uma
    // transação curta (são 3 queries rápidas).
    await prisma.$transaction([
      prisma.snapshot.create({
        data: {
          targetId: target.id,
          activeCount,
          totalCount,
          capturedAt: now,
        },
      }),
      prisma.ad.updateMany({
        where: {
          targetId: target.id,
          isActive: true,
          lastSeenAt: { lt: now },
        },
        data: {
          isActive: false,
          becameInactiveAt: now,
        },
      }),
      prisma.target.update({
        where: { id: target.id },
        data: {
          lastRunAt: now,
          lastError: null,
          pageId: target.pageId ?? pageIdFromItems,
          pageName: target.pageName ?? pageNameFromItems,
        },
      }),
    ]);

    return { ok: true, activeCount, totalCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro desconhecido";
    await prisma.target.update({
      where: { id: target.id },
      data: { lastRunAt: now, lastError: message },
    });
    return { ok: false, error: message };
  }
}
