import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeTarget } from "@/lib/scrape-target";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const target = await prisma.target.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Alvo não encontrado" }, { status: 404 });
  }
  const result = await scrapeTarget(target);
  return NextResponse.json(result);
}
