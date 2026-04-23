import { Activity, Eye, Radar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { AddTargetDialog } from "@/components/add-target-dialog";
import { TargetCard } from "@/components/target-card";
import { StatTile } from "@/components/stat-tile";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [targets, totalActive, totalAds] = await Promise.all([
    prisma.target.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        snapshots: {
          orderBy: { capturedAt: "desc" },
          take: 30,
          select: { id: true, activeCount: true, capturedAt: true },
        },
        _count: { select: { ads: true } },
      },
    }),
    prisma.ad.count({ where: { isActive: true } }),
    prisma.ad.count(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-balance text-3xl font-semibold tracking-tight">
              Monitor de anúncios
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe anúncios de concorrentes com coleta automática diária.
            </p>
          </div>
          <AddTargetDialog />
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Alvos monitorados"
            value={targets.length}
            hint={<span className="flex items-center gap-1"><Radar className="h-3 w-3" /> ativos no radar</span>}
          />
          <StatTile
            label="Anúncios ativos"
            value={totalActive}
            tone="success"
            hint={<span className="flex items-center gap-1"><Activity className="h-3 w-3" /> em todos os alvos</span>}
          />
          <StatTile
            label="Base histórica"
            value={totalAds}
            hint={<span className="flex items-center gap-1"><Eye className="h-3 w-3" /> anúncios já vistos</span>}
          />
        </div>

        {targets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {targets.map((t) => (
              <TargetCard
                key={t.id}
                target={{
                  ...t,
                  lastRunAt: t.lastRunAt ? t.lastRunAt.toISOString() : null,
                  snapshots: t.snapshots.map((s) => ({
                    ...s,
                    capturedAt: s.capturedAt.toISOString(),
                  })),
                }}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/30 px-6 py-20 text-center">
      <div className="relative mb-2">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <Radar className="h-5 w-5" />
        </div>
      </div>
      <h2 className="text-lg font-semibold">Nenhum alvo ainda</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Adicione uma URL da Biblioteca de Anúncios do Meta ou de uma página do
        Facebook pra começar a monitorar.
      </p>
      <div className="mt-2">
        <AddTargetDialog />
      </div>
    </div>
  );
}
