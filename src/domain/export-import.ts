import { getActiveOptions } from "./filters";
import { FREE_TIER_LIMITS } from "./limits";
import { sanitizePriorityWeights } from "./seed";
import { getMergeStats, mergeRentalOptions, type ImportBackupMode } from "./collaboration";
import { BathroomType, RentalOption, RentalSearch, RentalStatus, RentalType } from "./types";
import {
  ChecklistStatus,
  VisitChecklist,
  emptyVisitChecklist,
  visitChecklistOrder,
} from "./visit-checklist";

export type { ImportBackupMode } from "./collaboration";
export {
  mergeRentalOptions,
  getMergeStats,
  buildCollaborationInviteShortMessage,
  buildCollaborationInviteMessage,
} from "./collaboration";
export { resolveImportedChosenOptionId, countOptionsWithPhotos } from "./backup-import-logic";

export const BACKUP_VERSION = 1;

export type EligrBackupAppMeta = {
  chosenOptionId?: string | null;
};

export type EligrBackup = {
  version: number;
  exportedAt: string;
  search: RentalSearch;
  rentalOptions: RentalOption[];
  appMeta?: EligrBackupAppMeta;
};

export type ImportBackupResult = "imported" | "invalid" | "limit_exceeded";

export type BackupImportPreview = {
  valid: boolean;
  searchTitle: string;
  totalOptions: number;
  activeOptions: number;
  limitExceeded: boolean;
  exportedAt?: string;
  photoCount: number;
  hasChosenOption: boolean;
  mode: ImportBackupMode;
  newOptions: number;
  updatedOptions: number;
  resultingActive: number;
};

const rentalTypes: RentalType[] = ["room", "studio", "flat", "coliving", "other"];
const bathroomTypes: BathroomType[] = ["private", "shared", "unknown"];
const rentalStatuses: RentalStatus[] = ["new", "contacted", "visit_planned", "visited", "favorite", "discarded"];
const checklistStatuses: ChecklistStatus[] = ["pending", "ok", "issue"];

function sanitizeVisitChecklist(raw: unknown): VisitChecklist {
  const checklist = emptyVisitChecklist();
  if (!raw || typeof raw !== "object") return checklist;
  const record = raw as Record<string, unknown>;
  for (const key of visitChecklistOrder) {
    const value = record[key];
    if (typeof value === "string" && checklistStatuses.includes(value as ChecklistStatus)) {
      checklist[key] = value as ChecklistStatus;
    }
  }
  return checklist;
}

function finiteNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampRating(value: unknown) {
  return Math.min(10, Math.max(1, Math.round(finiteNumber(value, 3))));
}

function pickEnum<T extends string>(value: unknown, allowed: T[], fallback: T) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function sanitizeRentalTypes(raw: unknown): RentalType[] {
  if (!Array.isArray(raw)) return ["room"];
  const valid = raw.filter((value): value is RentalType => rentalTypes.includes(value as RentalType));
  return valid.length > 0 ? valid : ["room"];
}

function sanitizeSearch(raw: Partial<RentalSearch> | undefined): RentalSearch | null {
  if (!raw || typeof raw.id !== "string" || typeof raw.title !== "string") return null;
  const nowIso = new Date().toISOString();
  return {
    id: raw.id,
    title: raw.title.trim() || "Búsqueda importada",
    city: typeof raw.city === "string" ? raw.city : "",
    area: typeof raw.area === "string" ? raw.area : "",
    rentalTypes: sanitizeRentalTypes(raw.rentalTypes),
    maxBudget: Math.max(0, finiteNumber(raw.maxBudget, 0)),
    moveInDate: typeof raw.moveInDate === "string" ? raw.moveInDate : "",
    destinationLabel: typeof raw.destinationLabel === "string" ? raw.destinationLabel : "",
    priorities: sanitizePriorityWeights(raw.priorities),
    isPremium: Boolean(raw.isPremium),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso,
  };
}

function sanitizeRentalOption(raw: Partial<RentalOption>): RentalOption | null {
  if (!raw || typeof raw.id !== "string" || typeof raw.title !== "string") return null;
  const commute = raw.commuteMinutes === undefined ? undefined : finiteNumber(raw.commuteMinutes, NaN);
  return {
    id: raw.id,
    searchId: typeof raw.searchId === "string" ? raw.searchId : "search-import",
    title: raw.title.trim() || "Opción importada",
    sourceUrl: typeof raw.sourceUrl === "string" ? raw.sourceUrl : undefined,
    rentalType: pickEnum(raw.rentalType, rentalTypes, "room"),
    monthlyPrice: Math.max(0, finiteNumber(raw.monthlyPrice, 0)),
    billsIncluded: Boolean(raw.billsIncluded),
    estimatedBills: Math.max(0, finiteNumber(raw.estimatedBills, 0)),
    deposit: Math.max(0, finiteNumber(raw.deposit, 0)),
    agencyFee: Math.max(0, finiteNumber(raw.agencyFee, 0)),
    locationLabel: typeof raw.locationLabel === "string" ? raw.locationLabel : "",
    commuteMinutes: Number.isFinite(commute) ? commute : undefined,
    size: raw.size === undefined ? undefined : finiteNumber(raw.size, 0),
    furnished: Boolean(raw.furnished),
    bathroomType: pickEnum(raw.bathroomType, bathroomTypes, "unknown"),
    contractAvailable: Boolean(raw.contractAvailable),
    availableDate: typeof raw.availableDate === "string" ? raw.availableDate : undefined,
    status: pickEnum(raw.status, rentalStatuses, "new"),
    notes: typeof raw.notes === "string" ? raw.notes : "",
    photoUri: typeof raw.photoUri === "string" && raw.photoUri.trim() ? raw.photoUri.trim() : undefined,
    visitChecklist: sanitizeVisitChecklist(raw.visitChecklist),
    visitImpression: typeof raw.visitImpression === "string" ? raw.visitImpression : "",
    visitNextAction: typeof raw.visitNextAction === "string" ? raw.visitNextAction : "",
    locationRating: clampRating(raw.locationRating),
    roomQualityRating: clampRating(raw.roomQualityRating),
    personalFeelingRating: clampRating(raw.personalFeelingRating),
    ...(raw.partnerFeelingRating !== undefined && raw.partnerFeelingRating !== null
      ? { partnerFeelingRating: clampRating(raw.partnerFeelingRating) }
      : {}),
    ...(typeof raw.partnerNote === "string" && raw.partnerNote.trim()
      ? { partnerNote: raw.partnerNote.trim() }
      : {}),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

export function buildBackup(
  search: RentalSearch,
  rentalOptions: RentalOption[],
  appMeta?: EligrBackupAppMeta,
): EligrBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    search: {
      ...search,
      priorities: sanitizePriorityWeights(search.priorities),
    },
    rentalOptions,
    ...(appMeta ? { appMeta } : {}),
  };
}

function countBackupPhotos(options: RentalOption[]) {
  return options.filter((option) => Boolean(option.photoUri?.trim())).length;
}

export function serializeBackup(backup: EligrBackup): string {
  return JSON.stringify(backup, null, 2);
}

export function validateBackupImport(backup: EligrBackup, isPremium: boolean): ImportBackupResult | "ok" {
  if (!isPremium && getActiveOptions(backup.rentalOptions).length > FREE_TIER_LIMITS.rentalOptions) {
    return "limit_exceeded";
  }
  return "ok";
}

export function getBackupImportPreview(
  raw: string,
  isPremium: boolean,
  existingOptions: RentalOption[] = [],
  mode: ImportBackupMode = "replace",
): BackupImportPreview {
  const backup = parseBackup(raw);
  if (!backup) {
    return {
      valid: false,
      searchTitle: "",
      totalOptions: 0,
      activeOptions: 0,
      limitExceeded: false,
      photoCount: 0,
      hasChosenOption: false,
      mode,
      newOptions: 0,
      updatedOptions: 0,
      resultingActive: 0,
    };
  }

  const activeOptions = getActiveOptions(backup.rentalOptions).length;
  const mergedOptions =
    mode === "merge" ? mergeRentalOptions(existingOptions, backup.rentalOptions, "preview") : backup.rentalOptions;
  const resultingActive = getActiveOptions(mergedOptions).length;
  const mergeStats = mode === "merge" ? getMergeStats(existingOptions, backup.rentalOptions) : { newOptions: 0, updatedOptions: 0 };
  const limitExceeded = !isPremium && resultingActive > FREE_TIER_LIMITS.rentalOptions;

  return {
    valid: true,
    searchTitle: backup.search.title?.trim() || "Búsqueda sin título",
    totalOptions: backup.rentalOptions.length,
    activeOptions,
    limitExceeded,
    exportedAt: backup.exportedAt,
    photoCount: countBackupPhotos(backup.rentalOptions),
    hasChosenOption: Boolean(backup.appMeta?.chosenOptionId),
    mode,
    newOptions: mergeStats.newOptions,
    updatedOptions: mergeStats.updatedOptions,
    resultingActive,
  };
}

export function parseBackup(raw: string): EligrBackup | null {
  try {
    const data = JSON.parse(raw) as Partial<EligrBackup>;
    if (!data || data.version !== BACKUP_VERSION) return null;
    if (!data.search || !Array.isArray(data.rentalOptions)) return null;

    const search = sanitizeSearch(data.search);
    if (!search) return null;

    const rentalOptions = data.rentalOptions
      .map((option) => sanitizeRentalOption(option as Partial<RentalOption>))
      .filter((option): option is RentalOption => option !== null);

    if (rentalOptions.length === 0) return null;

    const rawAppMeta = data.appMeta;
    const appMeta: EligrBackupAppMeta | undefined =
      rawAppMeta && typeof rawAppMeta === "object"
        ? {
            chosenOptionId:
              typeof rawAppMeta.chosenOptionId === "string"
                ? rawAppMeta.chosenOptionId
                : rawAppMeta.chosenOptionId === null
                  ? null
                  : undefined,
          }
        : undefined;

    return {
      version: BACKUP_VERSION,
      exportedAt: data.exportedAt ?? new Date().toISOString(),
      search,
      rentalOptions,
      ...(appMeta ? { appMeta } : {}),
    };
  } catch {
    return null;
  }
}
