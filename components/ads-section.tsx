"use client";

import { useMemo, useState } from "react";
import { Clock, Copy, Layers } from "lucide-react";
import { AdList, type AdListItem } from "./ad-list";
import { DuplicatesList } from "./duplicates-list";
import { cn } from "@/lib/utils";

type Mode = "recent" | "oldest" | "duplicates";

const MODES: Array<{ key: Mode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "recent", label: "Recentes", icon: Clock },
  { key: "oldest", label: "Há mais tempo", icon: Layers },
  { key: "duplicates", label: "Mais duplicados", icon: Copy },
];

export function AdsSection({ ads }: { ads: AdListItem[] }) {
  const [mode, setMode] = useState<Mode>("recent");

  const activeAds = useMemo(() => ads.filter((a) => a.isActive), [ads]);
  const inactiveAds = useMemo(() => ads.filter((a) => !a.isActive), [ads]);

  const sorted = useMemo(() => {
    if (mode === "oldest") {
      return [...activeAds].sort((a, b) => {
        const ta = new Date(a.startDate ?? a.firstSeenAt).getTime();
        const tb = new Date(b.startDate ?? b.firstSeenAt).getTime();
        return ta - tb;
      });
    }
    // recent: ativos antes, depois lastSeen desc
    return [...ads].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
    });
  }, [ads, activeAds, mode]);

  const groups = useMemo(() => groupDuplicates(ads), [ads]);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Anúncios</h2>
          <p className="text-xs text-muted-foreground">
            {activeAds.length} ativo(s) · {inactiveAds.length} inativo(s)
            {mode === "duplicates" && <> · {groups.length} criativo(s) escalado(s)</>}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1">
          {MODES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === key
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "duplicates" ? (
        <DuplicatesList groups={groups} />
      ) : (
        <AdList ads={sorted} />
      )}
    </section>
  );
}

// Agrupa por collationId (agrupamento nativo do Meta: "N anúncios usam esse criativo"),
// usando archiveId como fallback quando collationId não vem. Mostra só grupos com > 1.
function groupDuplicates(ads: AdListItem[]) {
  const groups = new Map<string, AdListItem[]>();
  for (const ad of ads) {
    const key = ad.collationId ?? `ad:${ad.archiveId}`;
    const list = groups.get(key) ?? [];
    list.push(ad);
    groups.set(key, list);
  }
  return Array.from(groups.values())
    .map((list) => {
      // collationCount já vem do Meta (ex: 15). Se vierem múltiplos representantes
      // do mesmo collation, mantém o maior.
      const count = Math.max(...list.map((a) => a.collationCount), list.length);
      return {
        ads: list,
        count,
        activeCount: list.filter((a) => a.isActive).length,
      };
    })
    .filter((g) => g.count > 1)
    .sort((a, b) => b.count - a.count);
}
