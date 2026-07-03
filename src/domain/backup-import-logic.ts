import { ImportBackupMode } from "./collaboration";
import { isDiscarded } from "./filters";
import { RentalOption } from "./types";

export function resolveImportedChosenOptionId(
  mode: ImportBackupMode,
  backupChosenId: string | null | undefined,
  options: RentalOption[],
  currentChosenId: string | null | undefined,
): string | null {
  if (mode === "merge") {
    return currentChosenId ?? null;
  }

  if (!backupChosenId) return null;

  const match = options.find((option) => option.id === backupChosenId);
  if (match && !isDiscarded(match)) return backupChosenId;
  return null;
}

export function countOptionsWithPhotos(options: RentalOption[]) {
  return options.filter((option) => Boolean(option.photoUri?.trim())).length;
}
