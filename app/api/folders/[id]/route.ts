import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const folder = await prisma.folder.update({
    where: { id },
    data: {
      name: body.name,
      color: body.color,
    },
  });
  return NextResponse.json(folder);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // os targets dentro da pasta viram "sem pasta" (onDelete: SetNull no schema)
  await prisma.folder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
