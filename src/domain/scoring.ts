import { getBudgetDelta } from "./budget";
import { priorityLabels, rentalTypeLabels } from "./labels";
import { effectiveCommuteMinutes, getMonthlyTotal, getMoveInCost } from "./rental-costs";
import { ScoreContext } from "./score-context";
import { PriorityWeights, RentalOption, RentalScore, ScoreBreakdown } from "./types";
import { getVisitImpressionSignals } from "./visit-impression-scoring";
import { getVisitChecklistWarnings } from "./visit-checklist";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value);

function parseDay(dateStr: string) {
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function lowerIsBetter(value: number, best: number, worst: number) {
  if (worst <= best) return 100;
  return clamp(100 - ((value - best) / (worst - best)) * 100);
}

function dateAvailabilityScore(availableDate?: string, moveInDate?: string) {
  if (!availableDate) return 45;
  const available = parseDay(availableDate);
  if (!available) return 45;

  const target = moveInDate ? parseDay(moveInDate) : startOfToday();
  if (!target) return 45;

  const daysFromTarget = Math.round((available.getTime() - target.getTime()) / 86400000);
  if (daysFromTarget <= 0) return 100;
  if (daysFromTarget <= 14) return 85;
  if (daysFromTarget <= 30) return 65;
  if (daysFromTarget <= 60) return 45;
  return 25;
}

export function scoreRental(
  option: RentalOption,
  options: RentalOption[],
  weights: PriorityWeights,
  context?: ScoreContext,
): RentalScore {
  const orientative = options.length < 2;
  const monthlyTotals = options.map(getMonthlyTotal);
  const moveInCosts = options.map(getMoveInCost);
  const commuteTimes = options.map(effectiveCommuteMinutes);
  const impressionSignals = getVisitImpressionSignals(option.visitImpression ?? "");

  const minMonthly = Math.min(...monthlyTotals);
  const maxMonthly = Math.max(...monthlyTotals);
  const minMoveIn = Math.min(...moveInCosts);
  const maxMoveIn = Math.max(...moveInCosts);
  const minCommute = Math.min(...commuteTimes);
  const maxCommute = Math.max(...commuteTimes);
  const budgetCap = Math.max(context?.maxBudget ?? getMonthlyTotal(option), getMonthlyTotal(option) * 1.15, 1);

  const breakdown: ScoreBreakdown = {
    price: round(
      orientative
        ? lowerIsBetter(getMonthlyTotal(option), 0, budgetCap)
        : lowerIsBetter(getMonthlyTotal(option), minMonthly, Math.max(maxMonthly, minMonthly + 1)),
    ),
    moveInCost: round(
      orientative
        ? lowerIsBetter(getMoveInCost(option), 0, Math.max(getMoveInCost(option), context?.maxBudget ?? 2000))
        : lowerIsBetter(getMoveInCost(option), minMoveIn, Math.max(maxMoveIn, minMoveIn + 1)),
    ),
    commute: round(
      orientative
        ? lowerIsBetter(effectiveCommuteMinutes(option), 0, 90)
        : lowerIsBetter(effectiveCommuteMinutes(option), minCommute, Math.max(maxCommute, minCommute + 1)),
    ),
    location: round(option.locationRating * 10),
    safety: round((option.contractAvailable ? 82 : 34) + (option.sourceUrl ? 8 : 0)),
    roomQuality: round(option.roomQualityRating * 10 + (option.furnished ? 5 : -8)),
    privacy: option.rentalType === "studio" || option.rentalType === "flat" ? 95 : option.bathroomType === "private" ? 75 : 48,
    billsIncluded: option.billsIncluded ? 100 : round(clamp(78 - option.estimatedBills / 2)),
    availability: dateAvailabilityScore(option.availableDate, context?.moveInDate),
    personalFeeling: round(clamp(option.personalFeelingRating * 10 + impressionSignals.feelingBoost, 0, 100)),
  };

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + (Number.isFinite(weight) ? weight : 0), 0);
  const weightedBreakdown = Object.fromEntries(
    Object.entries(breakdown).map(([key, value]) => {
      const weight = weights[key as keyof PriorityWeights] ?? 0;
      return [key, round((value * (Number.isFinite(weight) ? weight : 0)) / Math.max(totalWeight, 1))];
    }),
  ) as ScoreBreakdown;

  let overallScore = round(Object.values(weightedBreakdown).reduce((sum, score) => sum + score, 0));
  if (orientative) overallScore = Math.min(overallScore, 72);
  const pros = buildPros(option, breakdown, context);
  const cons = buildCons(option, breakdown);
  const warnings = buildWarnings(option, context);
  const badges = buildBadges(option, breakdown, overallScore, orientative);

  return {
    rentalOptionId: option.id,
    overallScore,
    breakdown,
    weightedBreakdown,
    explanation: buildExplanation(option, breakdown, overallScore, orientative),
    pros,
    cons,
    warnings,
    badges,
    orientative,
  };
}

export function rankRentals(options: RentalOption[], weights: PriorityWeights, context?: ScoreContext) {
  return options
    .map((option) => ({ option, score: scoreRental(option, options, weights, context) }))
    .sort((a, b) => b.score.overallScore - a.score.overallScore);
}

function labelForPriorityKey(key: string) {
  return priorityLabels[key as keyof typeof priorityLabels] ?? key;
}

function buildExplanation(option: RentalOption, breakdown: ScoreBreakdown, overallScore: number, orientative = false) {
  const strongestKey = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "price";
  const weakestKey = Object.entries(breakdown).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "safety";
  const strongest = labelForPriorityKey(strongestKey).toLowerCase();
  const weakest = labelForPriorityKey(weakestKey).toLowerCase();
  const prefix = orientative ? "Con una sola opción, la puntuación es orientativa. " : "";
  if (overallScore >= 78) return `${prefix}${option.title} encaja muy bien: destaca en ${strongest} y mantiene pocos puntos flojos.`;
  if (overallScore >= 62) return `${prefix}${option.title} es una opción equilibrada, con buen ${strongest} pero margen de duda en ${weakest}.`;
  return `${prefix}${option.title} necesita cautela: el score baja por ${weakest}, aunque puede compensar en ${strongest}.`;
}

function buildPros(option: RentalOption, breakdown: ScoreBreakdown, context?: ScoreContext) {
  const pros: string[] = [];
  if (breakdown.price >= 78) pros.push("Coste mensual competitivo frente al resto.");
  if (breakdown.commute >= 78) pros.push("Trayecto cómodo para el destino principal.");
  if (option.contractAvailable) pros.push("Contrato disponible, reduce incertidumbre.");
  if (option.billsIncluded) pros.push("Gastos incluidos y presupuesto más previsible.");
  if (breakdown.privacy >= 75) pros.push("Buen nivel de privacidad.");
  if (breakdown.availability >= 85 && context?.moveInDate) pros.push("Disponible a tiempo para tu fecha de entrada.");
  if (context?.rentalTypes?.includes(option.rentalType)) pros.push("Encaja con los tipos de alquiler que buscas.");
  pros.push(...getVisitImpressionSignals(option.visitImpression ?? "").pros);
  return pros.slice(0, 4);
}

function buildCons(option: RentalOption, breakdown: ScoreBreakdown) {
  const cons: string[] = [];
  if (breakdown.moveInCost < 50) cons.push("Desembolso inicial alto.");
  if (breakdown.commute < 55) cons.push("Trayecto más largo que otras opciones.");
  if (breakdown.roomQuality < 55) cons.push("Calidad o equipamiento mejorables.");
  if (!option.billsIncluded) cons.push("Gastos no incluidos; conviene confirmar consumo real.");
  if (breakdown.personalFeeling < 60) cons.push("La sensación personal aún no convence.");
  if (breakdown.availability < 50) cons.push("Disponibilidad lejos de tu fecha de entrada.");
  cons.push(...getVisitImpressionSignals(option.visitImpression ?? "").cons);
  return cons.slice(0, 4);
}

function buildWarnings(option: RentalOption, context?: ScoreContext) {
  const warnings: string[] = [];
  if (!option.contractAvailable) warnings.push("Sin contrato confirmado.");
  if (!option.sourceUrl) warnings.push("Falta URL o fuente guardada.");
  if (!Number.isFinite(option.commuteMinutes)) warnings.push("Falta estimar el trayecto.");
  if (option.deposit <= 0) warnings.push("Fianza no indicada.");
  if (!option.billsIncluded && option.estimatedBills <= 0) {
    warnings.push("Gastos mensuales no estimados.");
  }
  if (option.agencyFee > 0) warnings.push("Incluye honorarios de agencia.");
  if (!option.availableDate) warnings.push("Disponibilidad sin fecha clara.");
  if (context?.maxBudget && getBudgetDelta(option, context.maxBudget) > 0) {
    warnings.push(`Supera el presupuesto en ${getBudgetDelta(option, context.maxBudget)} €/mes.`);
  }
  if (context?.rentalTypes?.length && !context.rentalTypes.includes(option.rentalType)) {
    warnings.push(`Tipo ${rentalTypeLabels[option.rentalType]} fuera de tu búsqueda.`);
  }
  warnings.push(...getVisitChecklistWarnings(option.visitChecklist));
  warnings.push(...getVisitImpressionSignals(option.visitImpression ?? "").warnings);
  return warnings;
}

function buildBadges(option: RentalOption, breakdown: ScoreBreakdown, overallScore: number, orientative = false) {
  const badges: string[] = [];
  if (orientative) badges.push("Orientativo");
  if (!orientative && overallScore >= 78) badges.push("Mejor encaje");
  if (breakdown.price >= 85) badges.push("Buen precio");
  if (breakdown.commute >= 85) badges.push("Trayecto rápido");
  if (breakdown.safety >= 80) badges.push("Bajo riesgo");
  if (breakdown.availability >= 90) badges.push("A tiempo");
  if (!option.contractAvailable || !option.sourceUrl) badges.push("Revisar");
  return badges.slice(0, 3);
}
