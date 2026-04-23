"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Play, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function TargetActions({ id, isPaused }: { id: string; isPaused: boolean }) {
  const router = useRouter();
  const [scraping, setScraping] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleScrape() {
    setScraping(true);
    try {
      const res = await fetch(`/api/targets/${id}/scrape`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Falha");
      toast.success(`Coletado: ${data.activeCount} ativo(s)`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setScraping(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      await fetch(`/api/targets/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isPaused: !isPaused }),
      });
      toast.success(isPaused ? "Retomado" : "Pausado");
      router.refresh();
    } catch {
      toast.error("Erro");
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remover este alvo e todo o histórico?")) return;
    try {
      await fetch(`/api/targets/${id}`, { method: "DELETE" });
      toast.success("Removido");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Erro");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={handleScrape} disabled={scraping} size="sm">
        {scraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        Rodar agora
      </Button>
      <Button onClick={handleToggle} disabled={toggling} variant="outline" size="sm">
        {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        {isPaused ? "Retomar" : "Pausar"}
      </Button>
      <Button
        onClick={handleDelete}
        variant="outline"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
