import { RentalOption, RentalSearch } from "./types";

export type ImportBackupMode = "replace" | "merge";

export function mergeRentalOptions(existing: RentalOption[], imported: RentalOption[], searchId: string): RentalOption[] {
  const byId = new Map(existing.map((option) => [option.id, option]));
  const merged = existing.map((option) => ({ ...option, searchId }));

  for (const option of imported) {
    const current = byId.get(option.id);
    const normalized = { ...option, searchId };
    if (current) {
      const useIncoming = normalized.updatedAt >= current.updatedAt;
      const next = useIncoming ? normalized : { ...current, searchId };
      const index = merged.findIndex((item) => item.id === option.id);
      if (index >= 0) merged[index] = next;
    } else {
      merged.push(normalized);
    }
  }

  return merged;
}

export function getMergeStats(existing: RentalOption[], imported: RentalOption[]) {
  const existingIds = new Set(existing.map((option) => option.id));
  let newOptions = 0;
  let updatedOptions = 0;

  for (const option of imported) {
    if (!existingIds.has(option.id)) {
      newOptions += 1;
      continue;
    }
    const current = existing.find((item) => item.id === option.id);
    if (current && option.updatedAt >= current.updatedAt) {
      updatedOptions += 1;
    }
  }

  return { newOptions, updatedOptions };
}

export function buildCollaborationInviteShortMessage(search: RentalSearch) {
  return [
    "👋 Eligr — ¿Comparamos pisos juntos?",
    "",
    `📍 ${search.title} · ${search.city}`,
    `💶 Hasta ${search.maxBudget} €/mes`,
    "",
    "En un momento te envío el backup por separado.",
    "",
    "📲 Cuando lo recibas, en Eligr:",
    "Más → Backup → «Combinar» → importar archivo o pegar JSON",
    "",
    "Compara alquileres. Decide mejor.",
  ].join("\n");
}

/** @deprecated Usar invitación corta + backup aparte. */
export function buildCollaborationInviteMessage(search: RentalSearch, _backupJson: string) {
  return buildCollaborationInviteShortMessage(search);
}
