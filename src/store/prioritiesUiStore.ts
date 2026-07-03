import { create } from "zustand";

import { PriorityWeights } from "@/domain/types";

type PrioritiesUiState = {
  draft: PriorityWeights | null;
  isDirty: boolean;
  setPrioritiesUi: (draft: PriorityWeights, isDirty: boolean) => void;
  clearPrioritiesUi: () => void;
};

export const usePrioritiesUiStore = create<PrioritiesUiState>((set) => ({
  draft: null,
  isDirty: false,
  setPrioritiesUi: (draft, isDirty) => set({ draft, isDirty }),
  clearPrioritiesUi: () => set({ draft: null, isDirty: false }),
}));
