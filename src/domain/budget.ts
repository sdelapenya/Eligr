import { getMonthlyTotal } from "./rental-costs";
import { RentalOption } from "./types";

export type BudgetFit = "under" | "near" | "over";

export function getBudgetFit(option: RentalOption, maxBudget: number): BudgetFit {
  const monthly = getMonthlyTotal(option);
  if (monthly > maxBudget) return "over";
  if (monthly >= maxBudget * 0.9) return "near";
  return "under";
}

export function getBudgetFitLabel(fit: BudgetFit) {
  if (fit === "over") return "Por encima del presupuesto";
  if (fit === "near") return "Cerca del límite";
  return "Dentro del presupuesto";
}

export function getBudgetDelta(option: RentalOption, maxBudget: number) {
  return getMonthlyTotal(option) - maxBudget;
}
