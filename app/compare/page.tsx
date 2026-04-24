import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { CompareView } from "@/components/compare-view";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const targets = await prisma.target.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      snapshots: {
        orderBy: { capturedAt: "desc" },
        take: 1,
        select: { activeCount: true },
      },
      folder: { select: { name: true, color: true } },
      _count: { select: { ads: true } },
    },
  });

  const rows = targets.map((t) => ({
    id: t.id,
    name: t.name,
    pageName: t.pageName,
    inputType: t.inputType,
    folderName: t.folder?.name ?? null,
    folderColor: t.folder?.color ?? null,
    activeNow: t.snapshots[0]?.activeCount ?? 0,
    adCount: t._count.ads,
  }));

  return (
    <>
      <SiteHeader />
      <main className="container py-8">
        <div className="mb-8 space-y-1">
          <h1 className="text-balance text-3xl font-semibold tracking-tight">
            Comparação com IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Selecione 2 ou 3 alvos e a IA analisa quem é mais forte pra você modelar.
          </p>
        </div>

        <CompareView targets={rows} />
      </main>
    </>
  );
}
