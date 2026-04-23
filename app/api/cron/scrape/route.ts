import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeTarget } from "@/lib/scrape-target";

export const dynamic = "force-dynamic";
// Plano Hobby do Vercel tem limite de 60s por função serverless.
export const maxDuration = 60;

// Chamado pelo GitHub Actions (uma chamada por alvo, pra caber em 60s).
// Aceita ?id=<targetId> pra scrapear um alvo específico.
// Sem id, scrapeia todos em sequência (usar só pra dev local).
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const singleId = searchParams.get("id");

  if (singleId) {
    const target = await prisma.target.findUnique({ where: { id: singleId } });
    if (!target) return NextResponse.json({ error: "Alvo não encontrado" }, { status: 404 });
    if (target.isPaused) return NextResponse.json({ ok: true, skipped: "paused" });
    const res = await scrapeTarget(target);
    return NextResponse.json({ id: target.id, ...res });
  }

  const targets = await prisma.target.findMany({
    where: { isPaused: false },
    orderBy: { lastRunAt: { sort: "asc", nulls: "first" } },
  });
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const target of targets) {
    const res = await scrapeTarget(target);
    results.push({ id: target.id, ok: res.ok, error: res.ok ? undefined : res.error });
  }
  return NextResponse.json({ scraped: results.length, results });
}
