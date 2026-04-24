import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeLibraryUrl, parseTargetInput } from "@/lib/ad-library";
import { scrapeTarget } from "@/lib/scrape-target";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const target = await prisma.target.findUnique({
    where: { id },
    include: {
      snapshots: { orderBy: { capturedAt: "asc" } },
      ads: {
        orderBy: [{ isActive: "desc" }, { lastSeenAt: "desc" }],
      },
    },
  });
  if (!target) {
    return NextResponse.json({ error: "Alvo não encontrado" }, { status: 404 });
  }
  return NextResponse.json(target);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.target.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // se veio um novo link, parse + normaliza antes de salvar
  let urlFields: {
    inputType?: string;
    inputValue?: string;
    pageId?: string | null;
    country?: string;
  } = {};
  let urlChanged = false;
  if (body.input) {
    try {
      const current = await prisma.target.findUnique({
        where: { id },
        select: { inputValue: true },
      });
      const parsed = parseTargetInput(String(body.input));
      const country = parsed.country === "ALL" ? "BR" : parsed.country;
      const newUrl =
        parsed.type === "library_url"
          ? normalizeLibraryUrl(parsed.url, country)
          : parsed.url;
      urlChanged = current?.inputValue !== newUrl;
      urlFields = {
        inputType: parsed.type,
        inputValue: newUrl,
        pageId: "pageId" in parsed ? parsed.pageId ?? null : null,
        country,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "URL inválida";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const target = await prisma.target.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.isPaused !== undefined ? { isPaused: body.isPaused } : {}),
      ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
      ...urlFields,
      // se trocou URL, zera ads antigos não são mais relevantes — mas melhor
      // deixar no histórico e confiar na lógica de snapshot
      ...(urlChanged ? { lastError: null, lastRunAt: null } : {}),
    },
  });

  // se trocou URL, dispara scrape já — responde só quando terminar
  if (urlChanged) {
    const scrape = await scrapeTarget(target);
    return NextResponse.json({
      ...target,
      scrape: scrape.ok
        ? { ok: true, activeCount: scrape.activeCount, totalCount: scrape.totalCount }
        : { ok: false, error: scrape.error },
    });
  }

  return NextResponse.json(target);
}
