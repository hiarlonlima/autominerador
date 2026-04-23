import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { HistoryChart } from "@/components/history-chart";
import { AdsSection } from "@/components/ads-section";
import { StatTile } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import { TargetActions } from "@/components/target-actions";
import { deltaPercent, formatRelativeDays } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TargetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [target, snapshots, ads] = await Promise.all([
    prisma.target.findUnique({ where: { id } }),
    prisma.snapshot.findMany({
      where: { targetId: id },
      orderBy: { capturedAt: "asc" },
      select: { id: true, activeCount: true, totalCount: true, capturedAt: true },
    }),
    prisma.ad.findMany({
      where: { targetId: id },
      orderBy: [{ isActive: "desc" }, { lastSeenAt: "desc" }],
      take: 500,
    }),
  ]);

  if (!target) notFound();

  const activeAds = ads.filter((a) => a.isActive);
  const inactiveAds = ads.filter((a) => !a.isActive);

  const latest = snapshots.at(-1);
  const previous = snapshots.at(-2);
  const current = latest?.activeCount ?? activeAds.length;
  const delta = deltaPercent(current, previous?.activeCount ?? current);

  const oldestActive = activeAds
    .map((a) => a.startDate ?? a.firstSeenAt)
    .filter(Boolean)
    .map((d) => new Date(d as string | Date))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <>
      <SiteHeader />
      <main className="container py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{target.name}</h1>
              {target.isPaused ? (
                <Badge variant="warning">Pausado</Badge>
              ) : (
                <Badge variant="success">Monitorando</Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {target.inputType === "library_url" ? "Busca" : "Página"}
              </Badge>
            </div>
            {target.pageName && (
              <p className="text-sm text-muted-foreground">{target.pageName}</p>
            )}
            <a
              href={target.inputValue}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              Abrir na Biblioteca de Anúncios <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <TargetActions id={target.id} isPaused={target.isPaused} />
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <StatTile
            label="Ativos agora"
            value={current}
            tone="success"
            hint={delta !== 0 ? `${delta > 0 ? "+" : ""}${delta}% vs anterior` : "sem mudança"}
          />
          <StatTile
            label="Mais antigo ativo há"
            value={formatRelativeDays(oldestActive ?? null)}
          />
          <StatTile
            label="Já viram inativos"
            value={inactiveAds.length}
            tone={inactiveAds.length > 0 ? "destructive" : "default"}
          />
          <StatTile
            label="Última coleta"
            value={formatRelativeDays(target.lastRunAt)}
            hint={target.lastError ? <span className="text-destructive">⚠ {target.lastError}</span> : undefined}
          />
        </div>

        <section className="mb-8 rounded-xl border border-border bg-card/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Histórico de anúncios ativos</h2>
              <p className="text-xs text-muted-foreground">
                Coletas a cada 6 h. Na visão semanal/mensal, a faixa clara mostra a oscilação entre mín e máx do dia.
              </p>
            </div>
          </div>
          <HistoryChart
            data={snapshots.map((s) => ({
              capturedAt: s.capturedAt.toISOString(),
              activeCount: s.activeCount,
            }))}
          />
        </section>

        <AdsSection
          ads={ads.map((a) => ({
            ...a,
            startDate: a.startDate ? a.startDate.toISOString() : null,
            endDate: a.endDate ? a.endDate.toISOString() : null,
            firstSeenAt: a.firstSeenAt.toISOString(),
            lastSeenAt: a.lastSeenAt.toISOString(),
          }))}
        />
      </main>
    </>
  );
}
