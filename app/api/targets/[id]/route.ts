import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  const target = await prisma.target.update({
    where: { id },
    data: {
      name: body.name,
      isPaused: body.isPaused,
    },
  });
  return NextResponse.json(target);
}
