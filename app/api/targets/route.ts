import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTargetSchema, parseTargetInput } from "@/lib/ad-library";
import { scrapeTarget } from "@/lib/scrape-target";

export const dynamic = "force-dynamic";
// Plano Hobby do Vercel tem limite de 60s.
export const maxDuration = 60;

export async function GET() {
  const targets = await prisma.target.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      snapshots: {
        orderBy: { capturedAt: "desc" },
        take: 30,
      },
      _count: { select: { ads: true } },
    },
  });
  return NextResponse.json(targets);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createTargetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    const input = parseTargetInput(parsed.data.input);
    const target = await prisma.target.create({
      data: {
        name: parsed.data.name,
        inputType: input.type,
        inputValue: input.url,
        pageId: "pageId" in input ? input.pageId ?? null : null,
        country: input.country,
      },
    });

    // primeira coleta inline: usuário aguarda e já vê a página detalhada populada
    const scrape = await scrapeTarget(target);

    return NextResponse.json(
      {
        ...target,
        scrape: scrape.ok
          ? { ok: true, activeCount: scrape.activeCount, totalCount: scrape.totalCount }
          : { ok: false, error: scrape.error },
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar alvo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
