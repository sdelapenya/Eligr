export type HydrationPhase = "loading" | "slow" | "error" | "ready";

export function getHydrationPhase(
  hasHydrated: boolean,
  error: string | null,
  isSlow: boolean,
): HydrationPhase {
  if (hasHydrated) return "ready";
  if (error) return "error";
  if (isSlow) return "slow";
  return "loading";
}
