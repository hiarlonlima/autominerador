import Link from "next/link";
import { Radar } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <Radar className="h-4 w-4" />
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Minerador</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Ad intelligence
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            className="rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground"
            href="/"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
