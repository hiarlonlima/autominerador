import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeTarget } from "@/lib/scrape-target";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Chamado pelo Vercel Cron (ver vercel.json).
// Protegemos via Bearer do CRON_SECRET pra evitar trigger externo.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
