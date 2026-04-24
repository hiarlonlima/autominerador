"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  FolderInput,
  Inbox,
  Loader2,
  Minus,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MiniSparkline } from "./mini-sparkline";
import { cn, deltaPercent, formatNumber, formatRelativeDays } from "@/lib/utils";
import type { FolderItem } from "./folder-bar";

type Snapshot = { id: string; activeCount: number; capturedAt: string | Date };

export type TargetCardData = {
  id: string;
  name: string;
  inputType: string;
  pageName: string | null;
  folderId: string | null;
  lastRunAt: string | Date | null;
  lastError: string | null;
  isPaused: boolean;
  snapshots: Snapshot[];
  _count: { ads: number };
  // data do anúncio ativo mais antigo nesse alvo — usado pra "ativo há X"
  oldestActiveAt: string | null;
};

export function TargetCard({
  target,
  folders,
  selected = false,
  onToggleSelect,
  selectionDisabled = false,
}: {
  target: TargetCardData;
  folders: FolderItem[];
  selected?: boolean;
  onToggleSelect?: () => void;
  selectionDisabled?: boolean;
}) {
  const router = useRouter();
  const [scraping, setScraping] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const sorted = [...target.snapshots].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  );
  const latest = sorted.at(-1);
  const previous = sorted.at(-2);
  const current = latest?.activeCount ?? 0;
  const prev = previous?.activeCount ?? current;
  const delta = deltaPercent(current, prev);

  async function handleScrape() {
    setScraping(true);
    try {
      const res = await fetch(`/api/targets/${target.id}/scrape`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Falha ao coletar");
      toast.success(`Coletado: ${data.activeCount} ativo(s)`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setScraping(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover "${target.name}"?`)) return;
    try {
      await fetch(`/api/targets/${target.id}`, { method: "DELETE" });
      toast.success("Removido");
      router.refresh();
    } catch {
      toast.error("Erro ao remover");
    }
  }

  async function handleMove(folderId: string | null) {
    try {
      await fetch(`/api/targets/${target.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      toast.success(folderId ? "Movido pra pasta" : "Movido pra 'Sem pasta'");
      router.refresh();
    } catch {
      toast.error("Erro ao mover");
    }
  }

  const hasRun = Boolean(target.lastRunAt);
  const hasError = Boolean(target.lastError);

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden transition-colors hover:border-border/80",
          selected && "border-primary ring-1 ring-primary/30",
        )}
      >
        {onToggleSelect && (
          <button
            type="button"
            onClick={onToggleSelect}
            disabled={selectionDisabled && !selected}
            className={cn(
              "absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border transition-all",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 bg-card/80 opacity-0 group-hover:opacity-100 hover:border-primary/60",
              selectionDisabled && !selected && "cursor-not-allowed opacity-30",
            )}
            title={
              selectionDisabled && !selected
                ? "Limite de 3 alvos pra comparar"
                : selected
                  ? "Remover da seleção"
                  : "Selecionar pra comparar"
            }
          >
            {selected && <Check className="h-3 w-3" />}
          </button>
        )}
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className={cn("min-w-0 flex-1", onToggleSelect && "pl-7")}>
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{target.name}</h3>
              {target.inputType === "library_url" ? (
                <Badge variant="outline" className="text-[10px]">Busca</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Página</Badge>
              )}
            </div>
            {target.pageName && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {target.pageName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleScrape}
              disabled={scraping}
              title="Rodar scrape agora"
            >
              {scraping ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput className="h-3.5 w-3.5" />
                    Mover pra pasta
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    <DropdownMenuItem
                      onSelect={() => handleMove(null)}
                      disabled={target.folderId === null}
                    >
                      <Inbox className="h-3.5 w-3.5 opacity-60" />
                      Sem pasta
                    </DropdownMenuItem>
                    {folders.length > 0 && <DropdownMenuSeparator />}
                    {folders.map((f) => (
                      <DropdownMenuItem
                        key={f.id}
                        onSelect={() => handleMove(f.id)}
                        disabled={target.folderId === f.id}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: f.color ?? "#64748b" }}
                        />
                        {f.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 px-5">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">
                {formatNumber(current)}
              </span>
              <span className="text-xs text-muted-foreground">anúncios ativos</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {hasRun && (
                <>
                  <DeltaPill delta={delta} />
                  <span className="text-muted-foreground">vs. última coleta</span>
                </>
              )}
              {target.oldestActiveAt && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Ativo há {formatRelativeDays(target.oldestActiveAt)}
                </span>
              )}
            </div>
          </div>
          <div className="w-28">
            <MiniSparkline data={sorted.map((s) => ({ value: s.activeCount }))} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
          <span>
            {hasError ? (
              <span className="text-destructive">⚠ {target.lastError}</span>
            ) : hasRun ? (
              <>Última coleta: {formatRelativeDays(target.lastRunAt)}</>
            ) : (
              <span className="text-warning">Ainda não coletado</span>
            )}
          </span>
          <Link
            href={`/target/${target.id}`}
            className="flex items-center gap-1 font-medium text-foreground/80 hover:text-primary"
          >
            Ver detalhes <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Card>

      <EditTargetDialog
        targetId={target.id}
        currentName={target.name}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
    </>
  );
}

function EditTargetDialog({
  targetId,
  currentName,
  open,
  onOpenChange,
}: {
  targetId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, string> = { name };
      if (newUrl.trim()) payload.input = newUrl.trim();
      const res = await fetch(`/api/targets/${targetId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      if (data.scrape?.ok) {
        toast.success(`Link atualizado — ${data.scrape.activeCount} ativo(s)`);
      } else if (data.scrape?.error) {
        toast.warning("Link atualizado, mas a coleta falhou", {
          description: data.scrape.error,
        });
      } else {
        toast.success("Alvo atualizado");
      }
      onOpenChange(false);
      setNewUrl("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (loading) return;
        onOpenChange(v);
      }}
    >
      <DialogContent>
        {loading && newUrl ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <h3 className="text-base font-semibold">
                Recoletando com o novo link…
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pode levar 1–2 minutos. Não feche a janela.
              </p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Editar alvo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Apelido</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-url">Novo link (opcional)</Label>
                <Input
                  id="edit-url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="Cola uma nova URL pra substituir"
                />
                <p className="text-xs text-muted-foreground">
                  Se trocar o link, a coleta roda automaticamente.
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeltaPill({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5",
        up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
      )}
    >
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {delta}%
    </span>
  );
}
