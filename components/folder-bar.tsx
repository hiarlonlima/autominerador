"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Folder as FolderIcon, FolderPlus, Inbox, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FolderItem = {
  id: string;
  name: string;
  color: string | null;
  _count: { targets: number };
};

export function FolderBar({
  folders,
  selected,
  totalTargets,
  unfiledCount,
}: {
  folders: FolderItem[];
  selected: string | null;
  totalTargets: number;
  unfiledCount: number;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <FolderChip
          href="/"
          active={selected === null}
          icon={<Inbox className="h-3.5 w-3.5" />}
          label="Todas"
          count={totalTargets}
        />
        <FolderChip
          href="/?folder=none"
          active={selected === "none"}
          icon={<Inbox className="h-3.5 w-3.5 opacity-60" />}
          label="Sem pasta"
          count={unfiledCount}
        />
        <div className="mx-1 h-5 w-px bg-border" />
        {folders.map((f) => (
          <FolderChipWithMenu
            key={f.id}
            folder={f}
            active={selected === f.id}
          />
        ))}
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          Nova pasta
        </button>
      </div>
      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function FolderChip({
  href,
  active,
  icon,
  label,
  count,
  color,
}: {
  href: string;
  active: boolean;
  icon?: React.ReactNode;
  label: string;
  count: number;
  color?: string | null;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
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
      <span>{label}</span>
      <span className={cn("tabular-nums opacity-60", active && "opacity-80")}>
        {count}
      </span>
    </Link>
  );
}

function FolderChipWithMenu({ folder, active }: { folder: FolderItem; active: boolean }) {
  return (
    <div className="group relative inline-flex">
      <FolderChip
        href={`/?folder=${folder.id}`}
        active={active}
        label={folder.name}
        count={folder._count.targets}
        color={folder.color}
      />
      <FolderMenu folder={folder} />
    </div>
  );
}

function FolderMenu({ folder }: { folder: FolderItem }) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remover pasta "${folder.name}"? Os alvos voltam pra "Sem pasta".`)) return;
    try {
      await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
      toast.success("Pasta removida");
      router.refresh();
    } catch {
      toast.error("Erro");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:flex group-hover:opacity-100"
            onClick={(e) => e.preventDefault()}
            aria-label="Ações da pasta"
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover pasta
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameFolderDialog
        folder={folder}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
    </>
  );
}

function CreateFolderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("#22c55e");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      toast.success("Pasta criada");
      onOpenChange(false);
      setName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova pasta</DialogTitle>
          <DialogDescription>
            Agrupe seus alvos por nicho, concorrente ou etapa de validação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nome</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              placeholder="Ex: Concorrentes BR"
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    color === c ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
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
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RenameFolderDialog({
  folder,
  open,
  onOpenChange,
}: {
  folder: FolderItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color ?? "#22c55e");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/folders/${folder.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      toast.success("Pasta atualizada");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear pasta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rename">Nome</Label>
            <Input
              id="rename"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    color === c ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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
      </DialogContent>
    </Dialog>
  );
}

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#94a3b8",
];

// evita lint warnings sobre valores default não usados
void FolderIcon;
