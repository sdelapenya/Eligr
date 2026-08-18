import { useEffect, useState } from "react";

import { isE2eMode } from "@/utils/e2e";

import { getHydrationPhase } from "./hydration-state";
import { useEligrStore } from "./useEligrStore";

export function useStoreHydration() {
  const hasHydrated = useEligrStore((state) => state._hasHydrated);
  const error = useEligrStore((state) => state._hydrationError);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const unsubHydrate = useEligrStore.persist.onHydrate(() => {
      useEligrStore.getState().setHasHydrated(false);
      useEligrStore.getState().setHydrationError(null);
      setIsSlow(false);
    });
    const unsubFinish = useEligrStore.persist.onFinishHydration(() => setIsSlow(false));

    return () => {
      unsubHydrate();
      unsubFinish();
    };
  }, []);

  useEffect(() => {
    if (hasHydrated || error) {
      setIsSlow(false);
      return;
    }
    const slowTimer = setTimeout(() => setIsSlow(true), 4000);
    return () => clearTimeout(slowTimer);
  }, [error, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || !isE2eMode) return;
    const { completeOnboarding, dismissSampleBanner } = useEligrStore.getState();
    completeOnboarding();
    dismissSampleBanner();
  }, [hasHydrated]);

  const retry = () => {
    setIsSlow(false);
    useEligrStore.getState().setHydrationError(null);
    void useEligrStore.persist.rehydrate();
  };

  return { phase: getHydrationPhase(hasHydrated, error, isSlow), error, retry };
}
