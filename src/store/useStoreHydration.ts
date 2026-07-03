import { useEffect, useState } from "react";

import { isE2eMode } from "@/utils/e2e";

import { useEligrStore } from "./useEligrStore";

export function useStoreHydration() {
  const hasHydrated = useEligrStore((state) => state._hasHydrated);
  const [ready, setReady] = useState(hasHydrated);

  useEffect(() => {
    const unsub = useEligrStore.persist.onFinishHydration(() => setReady(true));
    setReady(useEligrStore.persist.hasHydrated());

    const fallback = setTimeout(() => {
      if (!useEligrStore.persist.hasHydrated()) {
        useEligrStore.getState().setHasHydrated(true);
        setReady(true);
      }
    }, 4000);

    return () => {
      clearTimeout(fallback);
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!ready || !isE2eMode) return;
    const { completeOnboarding, dismissSampleBanner } = useEligrStore.getState();
    completeOnboarding();
    dismissSampleBanner();
  }, [ready]);

  return ready;
}
