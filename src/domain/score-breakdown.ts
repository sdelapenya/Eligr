import { priorityLabels } from "./labels";
import { PriorityKey, RentalScore } from "./types";

export type ScoreContribution = {
  key: PriorityKey;
  label: string;
  weightedPoints: number;
};

export function getTopScoreContributions(score: RentalScore, limit = 2): ScoreContribution[] {
  if (score.orientative) return [];

  return Object.entries(score.weightedBreakdown)
    .map(([key, weightedPoints]) => ({
      key: key as PriorityKey,
      label: priorityLabels[key as PriorityKey],
      weightedPoints,
    }))
    .sort((a, b) => b.weightedPoints - a.weightedPoints)
    .slice(0, limit)
    .filter((item) => item.weightedPoints > 0);
}
