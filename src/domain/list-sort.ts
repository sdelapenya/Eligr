import { effectiveCommuteMinutes, getMonthlyTotal } from "./rental-costs";
import { RentalOption, RentalScore } from "./types";

export type ListSortMode = "score" | "price_asc" | "price_desc" | "commute" | "recent";

export type RankedRental = {
  option: RentalOption;
  score: RentalScore;
};

export const listSortLabels: Record<ListSortMode, string> = {
  score: "Puntuación",
  price_asc: "Precio ↑",
  price_desc: "Precio ↓",
  commute: "Trayecto",
  recent: "Recientes",
};

export const listSortOrder: ListSortMode[] = ["score", "price_asc", "price_desc", "commute", "recent"];

export function sortRankedList(items: RankedRental[], mode: ListSortMode): RankedRental[] {
  const copy = [...items];

  switch (mode) {
    case "price_asc":
      return copy.sort((a, b) => getMonthlyTotal(a.option) - getMonthlyTotal(b.option));
    case "price_desc":
      return copy.sort((a, b) => getMonthlyTotal(b.option) - getMonthlyTotal(a.option));
    case "commute":
      return copy.sort((a, b) => effectiveCommuteMinutes(a.option) - effectiveCommuteMinutes(b.option));
    case "recent":
      return copy.sort((a, b) => b.option.updatedAt.localeCompare(a.option.updatedAt));
    case "score":
    default:
      return copy.sort((a, b) => b.score.overallScore - a.score.overallScore);
  }
}
