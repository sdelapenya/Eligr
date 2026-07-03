import { getScoreContext } from "./score-context";
import { rankRentals, scoreRental } from "./scoring";
import { RentalOption, RentalSearch, RentalStatus } from "./types";

export type ListFilter = "all" | "active" | "favorite" | "discarded";

export const listFilterLabels: Record<ListFilter, string> = {
  all: "Todas",
  active: "Activas",
  favorite: "Favoritas",
  discarded: "Descartadas",
};

export function isDiscarded(option: RentalOption) {
  return option.status === "discarded";
}

export function getActiveOptions(options: RentalOption[]) {
  return options.filter((option) => !isDiscarded(option));
}

/** Pool used to normalize scores; prefers active options. */
export function getScoringPool(options: RentalOption[]) {
  const active = getActiveOptions(options);
  return active.length > 0 ? active : options;
}

export function filterOptionsByListFilter(options: RentalOption[], filter: ListFilter) {
  if (filter === "all") return options;
  if (filter === "active") return getActiveOptions(options);
  if (filter === "favorite") return options.filter((option) => option.status === "favorite");
  return options.filter((option) => option.status === "discarded");
}

export function countByStatus(options: RentalOption[], status: RentalStatus) {
  return options.filter((option) => option.status === status).length;
}

export function getFilterCounts(options: RentalOption[]): Record<ListFilter, number> {
  return {
    all: options.length,
    active: getActiveOptions(options).length,
    favorite: countByStatus(options, "favorite"),
    discarded: countByStatus(options, "discarded"),
  };
}

function scoreDiscarded(options: RentalOption[], pool: RentalOption[], search: RentalSearch) {
  const context = getScoreContext(search);
  return options
    .filter(isDiscarded)
    .map((option) => ({ option, score: scoreRental(option, pool, search.priorities, context) }))
    .sort((a, b) => b.score.overallScore - a.score.overallScore);
}

export function getDisplayRanking(options: RentalOption[], filter: ListFilter, search: RentalSearch) {
  const active = getActiveOptions(options);
  const pool = getScoringPool(options);
  const context = getScoreContext(search);
  const rankedActive = active.length > 0 ? rankRentals(active, search.priorities, context) : [];

  if (filter === "active") return rankedActive;
  if (filter === "favorite") return rankedActive.filter((item) => item.option.status === "favorite");
  if (filter === "discarded") return scoreDiscarded(options, pool, search);

  const rankedDiscarded = scoreDiscarded(options, pool, search);
  return [...rankedActive, ...rankedDiscarded];
}
