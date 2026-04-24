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
    const analysis = await compareTargetsWithAI(snapshots);
    return NextResponse.json({
      ok: true,
      targets: snapshots.map((s) => ({
        name: s.name,
        activeNow: s.activeNow,
        avgLast7: s.avgLast7,
        oldestActiveLabel: s.oldestActiveLabel,
      })),
      analysis,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
