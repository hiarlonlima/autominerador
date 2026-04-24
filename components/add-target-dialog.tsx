"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Radar, Check, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FolderItem } from "./folder-bar";

type FolderChoice = { type: "none" } | { type: "existing"; id: string } | { type: "new" };

export function AddTargetDialog({ folders }: { folders: FolderItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [input, setInput] = useState("");
  const [folderChoice, setFolderChoice] = useState<FolderChoice>({ type: "none" });
  const [newFolderName, setNewFolderName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. cria a pasta se for nova
      let folderId: string | null = null;
      if (folderChoice.type === "existing") folderId = folderChoice.id;
      if (folderChoice.type === "new") {
        if (!newFolderName.trim()) {
          throw new Error("Informe o nome da nova pasta");
        }
        const fRes = await fetch("/api/folders", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: newFolderName.trim() }),
        });
        const fData = await fRes.json();
        if (!fRes.ok) throw new Error(fData.error ?? "Erro ao criar pasta");
        folderId = fData.id;
      }

      // 2. cria o alvo + primeira coleta
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, input, folderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao adicionar");

      if (data.scrape?.ok) {
        toast.success(`Alvo criado: ${data.scrape.activeCount} anúncio(s) ativo(s)`);
      } else if (data.scrape?.error) {
        toast.warning("Alvo criado, mas a primeira coleta falhou", {
          description: data.scrape.error,
        });
      }

      setOpen(false);
      setName("");
      setInput("");
      setFolderChoice({ type: "none" });
      setNewFolderName("");
      router.push(`/target/${data.id}`);
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
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Adicionar alvo
        </Button>
      </DialogTrigger>
      <DialogContent>
        {loading ? (
          <ScrapingState name={name} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Novo alvo</DialogTitle>
              <DialogDescription>
                Cole a URL da Biblioteca de Anúncios, da página do Facebook, ou o ID numérico da página.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Apelido</Label>
                <Input
                  id="name"
                  placeholder="Ex: Concorrente X"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="input">URL ou ID</Label>
                <Input
                  id="input"
                  placeholder="https://www.facebook.com/ads/library/?..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Exemplos aceitos: URL de busca da biblioteca, URL da página, ID da página.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Pasta</Label>
                <div className="flex flex-wrap gap-1.5">
                  <FolderOption
                    selected={folderChoice.type === "none"}
                    onClick={() => setFolderChoice({ type: "none" })}
                    label="Sem pasta"
                  />
                  {folders.map((f) => (
                    <FolderOption
                      key={f.id}
                      selected={
                        folderChoice.type === "existing" && folderChoice.id === f.id
                      }
                      onClick={() => setFolderChoice({ type: "existing", id: f.id })}
                      label={f.name}
                      color={f.color}
                    />
                  ))}
                  <FolderOption
                    selected={folderChoice.type === "new"}
                    onClick={() => setFolderChoice({ type: "new" })}
                    label="Nova pasta"
                    icon={<FolderPlus className="h-3 w-3" />}
                    dashed
                  />
                </div>
                {folderChoice.type === "new" && (
                  <Input
                    placeholder="Nome da nova pasta"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    maxLength={60}
                    autoFocus
                  />
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FolderOption({
  selected,
  onClick,
  label,
  color,
  icon,
  dashed,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  color?: string | null;
  icon?: React.ReactNode;
  dashed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        dashed && !selected && "border-dashed",
        selected
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card/40 text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {color ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : (
        icon
      )}
      {label}
      {selected && <Check className="h-3 w-3" />}
    </button>
  );
}

function ScrapingState({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <Radar className="h-6 w-6" />
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold">Coletando anúncios de “{name}”</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Primeira coleta pode levar 1–2 minutos. Assim que terminar, você vai direto pra página de detalhes.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Não feche esta janela
      </div>
    </div>
  );
}
