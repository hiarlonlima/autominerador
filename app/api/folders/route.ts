import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const createFolderSchema = z.object({
  name: z.string().min(1, "Informe um nome").max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET() {
  const folders = await prisma.folder.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { targets: true } } },
  });
  return NextResponse.json(folders);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }
  const folder = await prisma.folder.create({
    data: { name: parsed.data.name, color: parsed.data.color ?? null },
  });
  return NextResponse.json(folder, { status: 201 });
}
