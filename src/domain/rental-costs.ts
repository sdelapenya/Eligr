import { RentalOption } from "./types";

export const DEFAULT_COMMUTE_MINUTES = 75;

export function getMonthlyTotal(option: RentalOption) {
  return option.monthlyPrice + (option.billsIncluded ? 0 : option.estimatedBills);
}

export function getMoveInCost(option: RentalOption) {
  return option.monthlyPrice + option.deposit + option.agencyFee;
}

export function effectiveCommuteMinutes(option: RentalOption) {
  return Number.isFinite(option.commuteMinutes) ? option.commuteMinutes! : DEFAULT_COMMUTE_MINUTES;
}

export function usesEstimatedCommute(option: RentalOption) {
  return !Number.isFinite(option.commuteMinutes);
}
