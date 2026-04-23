import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lista os IDs dos alvos ativos pro GitHub Actions iterar.
// Protegido pelo CRON_SECRET.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targets = await prisma.target.findMany({
    where: { isPaused: false },
    orderBy: { lastRunAt: { sort: "asc", nulls: "first" } },
    select: { id: true, name: true },
  });

  return NextResponse.json({ ids: targets.map((t) => t.id), targets });
}
