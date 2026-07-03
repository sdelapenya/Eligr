import { create } from "zustand";

type ToastState = {
  message: string | null;
  showToast: (message: string) => void;
  hideToast: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  showToast: (message) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message });
    hideTimer = setTimeout(() => set({ message: null }), 2200);
  },
  hideToast: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: null });
  },
}));

export function showToast(message: string) {
  useToastStore.getState().showToast(message);
}
