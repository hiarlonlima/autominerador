import { TargetCard, type TargetCardData } from "./target-card";
import type { FolderItem } from "./folder-bar";

export function DashboardGrid({
  targets,
  folders,
}: {
  targets: TargetCardData[];
  folders: FolderItem[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {targets.map((t) => (
        <TargetCard key={t.id} target={t} folders={folders} />
      ))}
    </div>
  );
}
