import { NextResponse } from "next/server";
import { z } from "zod";
import { compareTargetsWithAI, gatherTargetSnapshot } from "@/lib/openai-compare";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  targetIds: z.array(z.string().min(1)).min(2).max(3),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Selecione entre 2 e 3 alvos" },
      { status: 400 },
    );
  }

  try {
    const snapshots = await Promise.all(
      parsed.data.targetIds.map((id) => gatherTargetSnapshot(id)),
    );
    const ai = await compareTargetsWithAI(snapshots);

    // cruza os archive_ids que a IA escolheu com os dados reais dos criativos
    // (pra devolver URLs de download/preview/biblioteca)
    const winnerTarget = snapshots.find((s) => s.name === ai.winnerName) ?? snapshots[0];
    const topCreatives = ai.topCreativeArchiveIds
      .map((id) => {
        const creative = winnerTarget.topCreatives.find((c) => c.archiveId === id);
        if (!creative) return null;
        return {
          archiveId: creative.archiveId,
          mediaType: creative.mediaType,
          cta: creative.cta,
          copy: creative.copy,
          duplicates: creative.duplicates,
          snapshotUrl: creative.snapshotUrl,
          libraryUrl: `https://www.facebook.com/ads/library/?id=${creative.archiveId}`,
          downloadUrl: buildDownloadUrl(creative),
          hasHd: Boolean(creative.videoHdUrl ?? creative.originalImageUrl),
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      ok: true,
      targets: snapshots.map((s) => ({
        name: s.name,
        activeNow: s.activeNow,
        avgLast7: s.avgLast7,
        oldestActiveLabel: s.oldestActiveLabel,
      })),
      winner: {
        name: winnerTarget.name,
        reason: ai.winnerReason,
        topCreatives,
      },
      analysis: ai.analysisMarkdown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildDownloadUrl(c: {
  archiveId: string;
  videoHdUrl: string | null;
  videoSdUrl: string | null;
  originalImageUrl: string | null;
  snapshotUrl: string | null;
}): string | null {
  const src = c.videoHdUrl ?? c.videoSdUrl ?? c.originalImageUrl ?? c.snapshotUrl;
  if (!src) return null;
  return `/api/download?url=${encodeURIComponent(src)}&filename=ad_${c.archiveId}`;
}
