import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { buildBackup, ImportBackupResult, parseBackup, serializeBackup, validateBackupImport } from "@/domain/export-import";
import type { ImportBackupMode } from "@/domain/collaboration";
import { mergeRentalOptions } from "@/domain/collaboration";
import { resolveImportedChosenOptionId } from "@/domain/backup-import-logic";
import { getActiveOptions, isDiscarded } from "@/domain/filters";
import { FREE_TIER_LIMITS, canAddRentalOption, canReactivateFromDiscarded } from "@/domain/limits";
import { withVisitDefaults } from "@/domain/rental-defaults";
import { isUsingSampleData } from "@/domain/sample-data";
import { createEmptySearch, sampleRentalOptions, sampleSearch, sanitizePriorityWeights } from "@/domain/seed";
import { cancelVisitDebriefReminders, scheduleVisitDebriefReminders, syncAllVisitReminders } from "@/domain/visit-reminders";
import { deletePersistedPhoto } from "@/utils/rental-photo";
import { RentalOption, RentalSearch, PriorityWeights, RentalStatus, RentalType } from "@/domain/types";
import { ThemeMode } from "@/ui/theme";
import { VisitDebriefPayload } from "@/domain/visit-debrief";
import { isE2eExpressJourneyMode, isE2eMode } from "@/utils/e2e";
import {
  ChecklistStatus,
  VisitChecklistKey,
  emptyVisitChecklist,
} from "@/domain/visit-checklist";

function isSampleDataIds(options: RentalOption[]) {
  return isUsingSampleData(options);
}

export type SearchSetupValues = {
  title: string;
  city: string;
  area: string;
  rentalTypes: RentalType[];
  maxBudget: number;
  moveInDate: string;
  destinationLabel: string;
};

type VisitNotesPatch = {
  visitImpression?: string;
  visitNextAction?: string;
};

export type AppMeta = {
  hasCompletedOnboarding: boolean;
  dismissedSampleBanner: boolean;
  visitRemindersEnabled: boolean;
  chosenOptionId?: string | null;
  themeMode?: ThemeMode;
};

type PersistedSlice = Pick<EligrState, "search" | "rentalOptions" | "appMeta">;

type EligrState = {
  search: RentalSearch;
  rentalOptions: RentalOption[];
  appMeta: AppMeta;
  _hasHydrated: boolean;
  _hydrationError: string | null;
  setHasHydrated: (value: boolean) => void;
  setHydrationError: (message: string | null) => void;
  addRentalOption: (
    option: Omit<RentalOption, "id" | "searchId" | "createdAt" | "updatedAt" | "visitChecklist" | "visitImpression" | "visitNextAction"> &
      Partial<Pick<RentalOption, "visitChecklist" | "visitImpression" | "visitNextAction">>,
  ) => boolean;
  updateRentalOption: (id: string, patch: Partial<RentalOption>) => void;
  deleteRentalOption: (id: string) => void;
  updateSearch: (values: SearchSetupValues) => void;
  updatePriorities: (priorities: PriorityWeights) => void;
  setStatus: (id: string, status: RentalStatus) => boolean;
  updateVisitChecklistItem: (id: string, key: VisitChecklistKey, status: ChecklistStatus) => void;
  updateVisitNotes: (id: string, patch: VisitNotesPatch) => void;
  completeVisitDebrief: (id: string, payload: VisitDebriefPayload) => void;
  togglePremiumPreview: () => void;
  resetToSampleData: () => void;
  startFreshSearch: () => void;
  completeOnboarding: () => void;
  dismissSampleBanner: () => void;
  exportBackupJson: () => string;
  importBackupJson: (raw: string, mode?: ImportBackupMode) => ImportBackupResult;
  setVisitRemindersEnabled: (enabled: boolean) => void;
  setChosenOption: (id: string) => boolean;
  clearChosenOption: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const stamp = () => new Date().toISOString();

function createRentalId() {
  return `rental-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeRentalOptions(options: RentalOption[] | undefined): RentalOption[] {
  return (options ?? []).map((option) =>
    withVisitDefaults({
      ...option,
      visitChecklist: option.visitChecklist ?? emptyVisitChecklist(),
      visitImpression: option.visitImpression ?? "",
      visitNextAction: option.visitNextAction ?? "",
    }),
  );
}

function normalizeSearch(search?: RentalSearch): RentalSearch {
  if (!search) return sampleSearch;
  return {
    ...sampleSearch,
    ...search,
    priorities: sanitizePriorityWeights(search.priorities, sampleSearch.priorities),
  };
}

function defaultAppMeta(): AppMeta {
  return {
    hasCompletedOnboarding: isE2eMode,
    dismissedSampleBanner: isE2eMode,
    visitRemindersEnabled: true,
    chosenOptionId: null,
    themeMode: "system",
  };
}

function normalizePersistedSlice(persisted: unknown): PersistedSlice {
  const state = (persisted ?? {}) as Partial<PersistedSlice>;
  const storedOptions = state.rentalOptions;
  const hasStoredOptions = Array.isArray(storedOptions);
  const normalizedStored = hasStoredOptions ? normalizeRentalOptions(storedOptions as RentalOption[]) : [];
  const expressEmptyStart =
    isE2eExpressJourneyMode &&
    (!hasStoredOptions || normalizedStored.length === 0 || isSampleDataIds(normalizedStored));
  const rentalOptions = expressEmptyStart
    ? []
    : hasStoredOptions
      ? normalizedStored
      : sampleRentalOptions;
  const search = expressEmptyStart ? createEmptySearch() : normalizeSearch(state.search);
  const rawChosenId = state.appMeta?.chosenOptionId ?? null;
  const chosenOptionId =
    rawChosenId &&
    rentalOptions.some((option) => option.id === rawChosenId && !isDiscarded(option))
      ? rawChosenId
      : null;
  const appMeta = {
    hasCompletedOnboarding: isE2eMode ? true : (state.appMeta?.hasCompletedOnboarding ?? hasStoredOptions),
    dismissedSampleBanner: isE2eMode
      ? true
      : (state.appMeta?.dismissedSampleBanner ?? (!hasStoredOptions || !isSampleDataIds(rentalOptions))),
    visitRemindersEnabled: state.appMeta?.visitRemindersEnabled ?? true,
    chosenOptionId,
    themeMode: state.appMeta?.themeMode ?? "system",
  };
  return {
    search,
    rentalOptions,
    appMeta,
  };
}

export const useEligrStore = create<EligrState>()(
  persist(
    (set, get) => ({
      search: isE2eExpressJourneyMode ? createEmptySearch() : sampleSearch,
      rentalOptions: isE2eExpressJourneyMode ? [] : sampleRentalOptions,
      appMeta: defaultAppMeta(),
      _hasHydrated: false,
      _hydrationError: null,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      setHydrationError: (message) => set({ _hydrationError: message }),
      addRentalOption: (option) => {
        const { rentalOptions, search } = get();
        if (!canAddRentalOption(getActiveOptions(rentalOptions).length, search.isPremium)) return false;
        const createdAt = stamp();
        set({
          rentalOptions: [
            withVisitDefaults({
              ...option,
              id: createRentalId(),
              searchId: search.id,
              createdAt,
              updatedAt: createdAt,
            }),
            ...rentalOptions,
          ],
        });
        return true;
      },
      updateRentalOption: (id, patch) =>
        set((state) => ({
          rentalOptions: state.rentalOptions.map((option) =>
            option.id === id ? withVisitDefaults({ ...option, ...patch, updatedAt: stamp() }) : option,
          ),
        })),
      deleteRentalOption: (id) => {
        cancelVisitDebriefReminders(id).catch(() => undefined);
        const optionToDelete = get().rentalOptions.find((option) => option.id === id);
        deletePersistedPhoto(optionToDelete?.photoUri);
        set((state) => ({
          rentalOptions: state.rentalOptions.filter((option) => option.id !== id),
          appMeta:
            state.appMeta.chosenOptionId === id
              ? { ...state.appMeta, chosenOptionId: null }
              : state.appMeta,
        }));
      },
      updateSearch: (values) =>
        set((state) => ({
          search: {
            ...state.search,
            ...values,
            updatedAt: stamp(),
          },
        })),
      updatePriorities: (priorities) =>
        set((state) => ({
          search: { ...state.search, priorities, updatedAt: stamp() },
        })),
      setStatus: (id, status) => {
        const { appMeta, rentalOptions, search } = get();
        const option = rentalOptions.find((item) => item.id === id);
        if (!option) return false;

        const reactivating = isDiscarded(option) && status !== "discarded";
        if (reactivating) {
          const activeCount = getActiveOptions(rentalOptions).length;
          if (!canReactivateFromDiscarded(activeCount, search.isPremium)) return false;
        }

        get().updateRentalOption(id, { status });
        if (status === "discarded" && appMeta.chosenOptionId === id) {
          set((state) => ({ appMeta: { ...state.appMeta, chosenOptionId: null } }));
        }
        if (status === "visited" || status === "discarded" || status === "favorite") {
          cancelVisitDebriefReminders(id).catch(() => undefined);
        } else if (appMeta.visitRemindersEnabled && status === "visit_planned") {
          scheduleVisitDebriefReminders(id, option.title).catch(() => undefined);
        }
        return true;
      },
      updateVisitChecklistItem: (id, key, status) => {
        const before = get().rentalOptions.find((option) => option.id === id);
        set((state) => ({
          rentalOptions: state.rentalOptions.map((option) => {
            if (option.id !== id) return option;
            const baseChecklist = option.visitChecklist ?? emptyVisitChecklist();
            const visitChecklist = { ...baseChecklist, [key]: status };
            let nextStatus = option.status;
            if ((option.status === "new" || option.status === "contacted") && status !== "pending") {
              nextStatus = "visit_planned";
            }
            return {
              ...option,
              visitChecklist,
              visitImpression: option.visitImpression ?? "",
              visitNextAction: option.visitNextAction ?? "",
              updatedAt: stamp(),
              status: nextStatus,
            };
          }),
        }));
        const after = get().rentalOptions.find((option) => option.id === id);
        if (!after) return;
        const { appMeta } = get();
        if (after.status === "visited" || after.status === "discarded") {
          cancelVisitDebriefReminders(id).catch(() => undefined);
        } else if (appMeta.visitRemindersEnabled && after.status === "visit_planned" && before?.status !== "visit_planned") {
          scheduleVisitDebriefReminders(id, after.title).catch(() => undefined);
        }
      },
      updateVisitNotes: (id, patch) => get().updateRentalOption(id, patch),
      completeVisitDebrief: (id, payload) => {
        cancelVisitDebriefReminders(id).catch(() => undefined);
        get().updateRentalOption(id, {
          visitChecklist: payload.visitChecklist,
          visitImpression: payload.visitImpression,
          visitNextAction: payload.visitNextAction,
          status: payload.status,
        });
      },
      togglePremiumPreview: () =>
        set((state) => ({
          search: { ...state.search, isPremium: !state.search.isPremium, updatedAt: stamp() },
        })),
      resetToSampleData: () =>
        set((state) => ({
          search: sampleSearch,
          rentalOptions: sampleRentalOptions,
          appMeta: {
            hasCompletedOnboarding: true,
            dismissedSampleBanner: false,
            visitRemindersEnabled: state.appMeta.visitRemindersEnabled,
            chosenOptionId: null,
            themeMode: state.appMeta.themeMode ?? "system",
          },
        })),
      startFreshSearch: () =>
        set((state) => ({
          search: createEmptySearch(),
          rentalOptions: [],
          appMeta: {
            hasCompletedOnboarding: true,
            dismissedSampleBanner: true,
            visitRemindersEnabled: state.appMeta.visitRemindersEnabled,
            chosenOptionId: null,
            themeMode: state.appMeta.themeMode ?? "system",
          },
        })),
      completeOnboarding: () =>
        set((state) => ({
          appMeta: { ...state.appMeta, hasCompletedOnboarding: true },
        })),
      dismissSampleBanner: () =>
        set((state) => ({
          appMeta: { ...state.appMeta, dismissedSampleBanner: true },
        })),
      exportBackupJson: () => {
        const { search, rentalOptions, appMeta } = get();
        return serializeBackup(
          buildBackup(search, rentalOptions, { chosenOptionId: appMeta.chosenOptionId ?? null }),
        );
      },
      importBackupJson: (raw, mode = "replace") => {
        const backup = parseBackup(raw);
        if (!backup) return "invalid";
        const { search, appMeta: currentAppMeta, rentalOptions: existingOptions } = get();

        const importedOptions = normalizeRentalOptions(backup.rentalOptions);
        const nextOptions =
          mode === "merge"
            ? normalizeRentalOptions(mergeRentalOptions(existingOptions, importedOptions, search.id))
            : importedOptions;

        const validation = validateBackupImport({ ...backup, rentalOptions: nextOptions }, search.isPremium);
        if (validation === "limit_exceeded") return "limit_exceeded";

        const importedChosenId = resolveImportedChosenOptionId(
          mode,
          backup.appMeta?.chosenOptionId,
          nextOptions,
          currentAppMeta.chosenOptionId,
        );

        set({
          search: mode === "replace" ? normalizeSearch(backup.search) : search,
          rentalOptions: nextOptions,
          appMeta: {
            hasCompletedOnboarding: true,
            dismissedSampleBanner: true,
            visitRemindersEnabled: currentAppMeta.visitRemindersEnabled,
            chosenOptionId: importedChosenId,
            themeMode: currentAppMeta.themeMode ?? "system",
          },
        });
        syncAllVisitReminders(nextOptions, currentAppMeta.visitRemindersEnabled).catch(() => undefined);
        return "imported";
      },
      setVisitRemindersEnabled: (enabled) => {
        set((state) => ({
          appMeta: { ...state.appMeta, visitRemindersEnabled: enabled },
        }));
        const { rentalOptions } = get();
        for (const option of rentalOptions) {
          if (option.status !== "visit_planned") continue;
          if (enabled) {
            scheduleVisitDebriefReminders(option.id, option.title).catch(() => undefined);
          } else {
            cancelVisitDebriefReminders(option.id).catch(() => undefined);
          }
        }
      },
      setChosenOption: (id) => {
        const option = get().rentalOptions.find((item) => item.id === id);
        if (!option || isDiscarded(option)) return false;
        const statusOk = get().setStatus(id, "favorite");
        if (!statusOk && option.status !== "favorite") return false;
        set((state) => ({
          appMeta: { ...state.appMeta, chosenOptionId: id },
        }));
        return true;
      },
      clearChosenOption: () =>
        set((state) => ({
          appMeta: { ...state.appMeta, chosenOptionId: null },
        })),
      setThemeMode: (mode) =>
        set((state) => ({
          appMeta: { ...state.appMeta, themeMode: mode },
        })),
    }),
    {
      name: "eligr-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        search: state.search,
        rentalOptions: state.rentalOptions,
        appMeta: state.appMeta,
      }),
      version: 3,
      migrate: (persisted) => normalizePersistedSlice(persisted),
      merge: (persisted, current) => ({
        ...current,
        ...normalizePersistedSlice(persisted),
      }),
      onRehydrateStorage: () => (state, error) => {
        const store = useEligrStore.getState();
        if (error) {
          store.setHasHydrated(false);
          store.setHydrationError(error instanceof Error ? error.message : "No se pudieron recuperar los datos guardados.");
          return;
        }

        store.setHydrationError(null);
        store.setHasHydrated(true);
        syncAllVisitReminders(store.rentalOptions, store.appMeta.visitRemindersEnabled).catch(() => undefined);
      },
    },
  ),
);

export { FREE_TIER_LIMITS };
