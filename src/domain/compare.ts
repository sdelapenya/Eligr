import { priorityLabels } from "./labels";
import { effectiveCommuteMinutes, getMonthlyTotal, getMoveInCost } from "./rental-costs";
import { scoreRental } from "./scoring";
import { PriorityWeights, RentalOption, RentalSearch } from "./types";

export type CompareWinner = "a" | "b" | "tie";

export type CompareInsight = {
  label: string;
  winner: CompareWinner;
  detailA: string;
  detailB: string;
  summary: string;
};

export type RentalComparison = {
  scoreA: number;
  scoreB: number;
  winner: CompareWinner;
  headline: string;
  insights: CompareInsight[];
};

function winnerFromNumbers(a: number, b: number, lowerIsBetter = false): CompareWinner {
  if (a === b) return "tie";
  if (lowerIsBetter) return a < b ? "a" : "b";
  return a > b ? "a" : "b";
}

function insight(
  label: string,
  detailA: string,
  detailB: string,
  winner: CompareWinner,
  summary: string,
): CompareInsight {
  return { label, detailA, detailB, winner, summary };
}

export function compareRentals(
  optionA: RentalOption,
  optionB: RentalOption,
  allOptions: RentalOption[],
  weights: PriorityWeights,
  search?: RentalSearch,
): RentalComparison {
  const context = search
    ? { maxBudget: search.maxBudget, moveInDate: search.moveInDate, rentalTypes: search.rentalTypes }
    : undefined;
  const scoredA = scoreRental(optionA, allOptions, weights, context);
  const scoredB = scoreRental(optionB, allOptions, weights, context);
  const monthlyA = getMonthlyTotal(optionA);
  const monthlyB = getMonthlyTotal(optionB);
  const moveInA = getMoveInCost(optionA);
  const moveInB = getMoveInCost(optionB);
  const commuteA = effectiveCommuteMinutes(optionA);
  const commuteB = effectiveCommuteMinutes(optionB);

  const insights: CompareInsight[] = [
    insight(
      "Puntuación global",
      `${scoredA.overallScore}/100`,
      `${scoredB.overallScore}/100`,
      winnerFromNumbers(scoredA.overallScore, scoredB.overallScore),
      scoredA.overallScore === scoredB.overallScore
        ? "Empatan en encaje global."
        : scoredA.overallScore > scoredB.overallScore
          ? `${optionA.title} encaja mejor con tus prioridades.`
          : `${optionB.title} encaja mejor con tus prioridades.`,
    ),
    insight(
      "Coste mensual",
      `${monthlyA} €`,
      `${monthlyB} €`,
      winnerFromNumbers(monthlyA, monthlyB, true),
      monthlyA === monthlyB ? "Mismo coste mensual estimado." : "Menor coste mensual.",
    ),
    insight(
      "Desembolso inicial",
      `${moveInA} €`,
      `${moveInB} €`,
      winnerFromNumbers(moveInA, moveInB, true),
      moveInA === moveInB ? "Mismo desembolso inicial." : "Menor desembolso inicial.",
    ),
    insight(
      "Trayecto",
      Number.isFinite(optionA.commuteMinutes) ? `${commuteA} min` : `~${commuteA} min (estimado)`,
      Number.isFinite(optionB.commuteMinutes) ? `${commuteB} min` : `~${commuteB} min (estimado)`,
      winnerFromNumbers(commuteA, commuteB, true),
      commuteA === commuteB ? "Trayecto similar." : "Trayecto más corto.",
    ),
    insight(
      "Riesgos",
      `${scoredA.warnings.length} aviso${scoredA.warnings.length === 1 ? "" : "s"}`,
      `${scoredB.warnings.length} aviso${scoredB.warnings.length === 1 ? "" : "s"}`,
      winnerFromNumbers(scoredB.warnings.length, scoredA.warnings.length),
      scoredA.warnings.length === scoredB.warnings.length
        ? "Mismo nivel de avisos."
        : "Menos señales de riesgo.",
    ),
  ];

  const topPriority = Object.entries(weights).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topPriority) {
    const key = topPriority as keyof typeof priorityLabels;
    const valueA = scoredA.breakdown[key];
    const valueB = scoredB.breakdown[key];
    insights.push(
      insight(
        `Tu prioridad: ${priorityLabels[key]}`,
        `${valueA}/100`,
        `${valueB}/100`,
        winnerFromNumbers(valueA, valueB),
        valueA === valueB
          ? `Empatan en ${priorityLabels[key].toLowerCase()}.`
          : `Mejor en ${priorityLabels[key].toLowerCase()}.`,
      ),
    );
  }

  if (optionA.partnerFeelingRating != null || optionB.partnerFeelingRating != null) {
    const detailA =
      optionA.partnerFeelingRating != null ? `${optionA.partnerFeelingRating}/10` : "Sin opinión";
    const detailB =
      optionB.partnerFeelingRating != null ? `${optionB.partnerFeelingRating}/10` : "Sin opinión";
    const winner =
      optionA.partnerFeelingRating != null && optionB.partnerFeelingRating != null
        ? winnerFromNumbers(optionA.partnerFeelingRating, optionB.partnerFeelingRating)
        : "tie";
    insights.push(
      insight(
        "Opinión pareja/compañero",
        detailA,
        detailB,
        winner,
        optionA.partnerFeelingRating != null && optionB.partnerFeelingRating != null
          ? "Comparación de sensación registrada por otra persona."
          : "Solo una opción tiene opinión externa por ahora.",
      ),
    );
  }

  const winner = winnerFromNumbers(scoredA.overallScore, scoredB.overallScore);
  const headline =
    winner === "tie"
      ? "Muy parejas: la decisión depende de matices de visita."
      : winner === "a"
        ? `${optionA.title} gana por encaje global, pero revisa los tradeoffs.`
        : `${optionB.title} gana por encaje global, pero revisa los tradeoffs.`;

  return {
    scoreA: scoredA.overallScore,
    scoreB: scoredB.overallScore,
    winner,
    headline,
    insights,
  };
}
