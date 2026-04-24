import { Activity, Eye, Radar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { AddTargetDialog } from "@/components/add-target-dialog";
import { TargetCard } from "@/components/target-card";
import { StatTile } from "@/components/stat-tile";
import { FolderBar, type FolderItem } from "@/components/folder-bar";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ folder?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { folder } = await searchParams;
  const folderFilter = folder ?? null; // "none" | "<folderId>" | null (todas)

  const targetWhere =
    folderFilter === "none"
      ? { folderId: null }
      : folderFilter
        ? { folderId: folderFilter }
        : {};

  const [targetsRaw, totalActive, totalAds, foldersRaw, unfiledCount, totalTargets] =
    await Promise.all([
      prisma.target.findMany({
        where: targetWhere,
        orderBy: { createdAt: "desc" },
        include: {
          snapshots: {
            orderBy: { capturedAt: "desc" },
            take: 30,
            select: { id: true, activeCount: true, capturedAt: true },
          },
          _count: { select: { ads: true } },
          // anúncio ativo mais antigo: base pra "ativo há X" no card
          ads: {
            where: { isActive: true },
            orderBy: [{ startDate: "asc" }, { firstSeenAt: "asc" }],
            take: 1,
            select: { startDate: true, firstSeenAt: true },
          },
        },
      }),
      prisma.ad.count({ where: { isActive: true } }),
      prisma.ad.count(),
      prisma.folder.findMany({
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { targets: true } } },
      }),
      prisma.target.count({ where: { folderId: null } }),
      prisma.target.count(),
    ]);

  const folders: FolderItem[] = foldersRaw.map((f) => ({
    id: f.id,
    name: f.name,
    color: f.color,
    _count: f._count,
  }));

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
              Acompanhe anúncios de concorrentes com coleta automática a cada 6 h.
            </p>
          </div>
          <AddTargetDialog folders={folders} />
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Alvos monitorados"
            value={totalTargets}
            hint={
              <span className="flex items-center gap-1">
                <Radar className="h-3 w-3" /> ativos no radar
              </span>
            }
          />
          <StatTile
            label="Anúncios ativos"
            value={totalActive}
            tone="success"
            hint={
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" /> em todos os alvos
              </span>
            }
          />
          <StatTile
            label="Base histórica"
            value={totalAds}
            hint={
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> anúncios já vistos
              </span>
            }
          />
        </div>

        <FolderBar
          folders={folders}
          selected={folderFilter}
          totalTargets={totalTargets}
          unfiledCount={unfiledCount}
        />

        {targetsRaw.length === 0 ? (
          <EmptyState hasFilter={Boolean(folderFilter)} folders={folders} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {targetsRaw.map((t) => {
              const oldest = t.ads[0];
              const oldestAt = oldest
                ? (oldest.startDate ?? oldest.firstSeenAt)
                : null;
              return (
                <TargetCard
                  key={t.id}
                  folders={folders}
                  target={{
                    id: t.id,
                    name: t.name,
                    inputType: t.inputType,
                    pageName: t.pageName,
                    folderId: t.folderId,
                    isPaused: t.isPaused,
                    lastError: t.lastError,
                    lastRunAt: t.lastRunAt ? t.lastRunAt.toISOString() : null,
                    _count: t._count,
                    snapshots: t.snapshots.map((s) => ({
                      ...s,
                      capturedAt: s.capturedAt.toISOString(),
                    })),
                    oldestActiveAt: oldestAt ? new Date(oldestAt).toISOString() : null,
                  }}
                />
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

function EmptyState({
  hasFilter,
  folders,
}: {
  hasFilter: boolean;
  folders: FolderItem[];
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/30 px-6 py-20 text-center">
      <div className="relative mb-2">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <Radar className="h-5 w-5" />
        </div>
      </div>
      <h2 className="text-lg font-semibold">
        {hasFilter ? "Nenhum alvo nessa pasta" : "Nenhum alvo ainda"}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {hasFilter
          ? "Mova um alvo existente pra esta pasta ou adicione um novo."
          : "Adicione uma URL da Biblioteca de Anúncios do Meta ou de uma página do Facebook pra começar a monitorar."}
      </p>
      <div className="mt-2">
        <AddTargetDialog folders={folders} />
      </div>
    </div>
  );
}
