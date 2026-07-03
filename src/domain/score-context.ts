import { RentalSearch } from "./types";

export type ScoreContext = Pick<RentalSearch, "maxBudget" | "moveInDate" | "rentalTypes">;

export function getScoreContext(search: RentalSearch): ScoreContext {
  return {
    maxBudget: search.maxBudget,
    moveInDate: search.moveInDate,
    rentalTypes: search.rentalTypes,
  };
}
