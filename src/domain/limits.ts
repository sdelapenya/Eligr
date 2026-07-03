export const FREE_TIER_LIMITS = {
  activeSearches: 1,
  rentalOptions: 5,
} as const;

export function canAddRentalOption(count: number, isPremium: boolean) {
  return isPremium || count < FREE_TIER_LIMITS.rentalOptions;
}

export function canReactivateFromDiscarded(activeCount: number, isPremium: boolean) {
  return canAddRentalOption(activeCount, isPremium);
}
