import { compareRentals } from "./compare";
import { getActiveOptions } from "./filters";
import { effectiveCommuteMinutes, getMonthlyTotal, getMoveInCost } from "./rental-costs";
import { scoreRental } from "./scoring";
import { RentalScore, RentalSearch, RentalOption } from "./types";

type RankedOption = { option: RentalOption; score: RentalScore };

export function buildComparisonSummary(search: RentalSearch, options: RankedOption[]) {
  const activeCount = getActiveOptions(options.map((item) => item.option)).length;
  const lines = [
    "Eligr — Comparación de alquileres",
    "",
    `Búsqueda: ${search.title}`,
    `Zona: ${search.city}, ${search.area}`,
    `Destino: ${search.destinationLabel}`,
    `Presupuesto máx.: ${search.maxBudget} €/mes`,
    `Opciones activas: ${activeCount}`,
    "",
    "Ranking:",
  ];

  options.forEach(({ option, score }, index) => {
    lines.push(
      `${index + 1}. ${option.title} — ${score.overallScore}/100 — ${getMonthlyTotal(option)} €/mes — ${option.locationLabel}`,
    );
    if (score.warnings.length > 0) {
      lines.push(`   Avisos: ${score.warnings.join("; ")}`);
    }
  });

  const best = options[0];
  if (best) {
    lines.push("", "Recomendación:", best.score.explanation);
    if (best.score.pros.length > 0) {
      lines.push("", "Pros:", ...best.score.pros.map((item) => `• ${item}`));
    }
    if (best.score.warnings.length > 0) {
      lines.push("", "Avisos:", ...best.score.warnings.map((item) => `• ${item}`));
    }
  }

  lines.push("", "Generado con Eligr — Compara alquileres. Decide mejor.");
  return lines.join("\n");
}

export function buildPairComparisonSummary(
  search: RentalSearch,
  optionA: RentalOption,
  optionB: RentalOption,
  pool: RentalOption[],
) {
  const context = { maxBudget: search.maxBudget, moveInDate: search.moveInDate, rentalTypes: search.rentalTypes };
  const comparison = compareRentals(optionA, optionB, pool, search.priorities, search);
  const scoreA = scoreRental(optionA, pool, search.priorities, context);
  const scoreB = scoreRental(optionB, pool, search.priorities, context);

  const lines = [
    "Eligr — Comparación de 2 alquileres",
    "",
    `A) ${optionA.title} — ${scoreA.overallScore}/100`,
    `   ${getMonthlyTotal(optionA)} €/mes · desembolso ${getMoveInCost(optionA)} € · trayecto ${Number.isFinite(optionA.commuteMinutes) ? `${optionA.commuteMinutes} min` : `~${effectiveCommuteMinutes(optionA)} min`}`,
    "",
    `B) ${optionB.title} — ${scoreB.overallScore}/100`,
    `   ${getMonthlyTotal(optionB)} €/mes · desembolso ${getMoveInCost(optionB)} € · trayecto ${Number.isFinite(optionB.commuteMinutes) ? `${optionB.commuteMinutes} min` : `~${effectiveCommuteMinutes(optionB)} min`}`,
    "",
    comparison.headline,
    "",
    ...comparison.insights.slice(0, 4).map((i) => `${i.label}: ${i.summary}`),
    "",
    "Generado con Eligr — Compara alquileres. Decide mejor.",
  ];
  return lines.join("\n");
}

export function buildRankingShareSummary(search: RentalSearch, ranking: RankedOption[], limit = 3) {
  const slice = ranking.slice(0, limit);
  const lines = [
    "🏠 Eligr — Top opciones",
    "",
    `📍 ${search.title} · ${search.city}`,
    `💶 Presupuesto: ${search.maxBudget} €/mes`,
    "",
    "━━ Ranking ━━",
  ];
  slice.forEach(({ option, score }, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
    const warnings = score.warnings.length > 0 ? ` ⚠️ ${score.warnings.length}` : "";
    lines.push(
      `${medal} ${option.title}`,
      `   ${score.orientative ? "Orientativo" : `${score.overallScore}/100`} · ${getMonthlyTotal(option)} €/mes · ${option.locationLabel}${warnings}`,
    );
    if (score.pros[0]) {
      lines.push(`   ✓ ${score.pros[0]}`);
    }
  });

  if (ranking.length >= 2) {
    const cheapest = ranking.reduce(
      (current, item) => (getMonthlyTotal(item.option) < getMonthlyTotal(current.option) ? item : current),
      ranking[0],
    );
    const priciest = ranking.reduce(
      (current, item) => (getMonthlyTotal(item.option) > getMonthlyTotal(current.option) ? item : current),
      ranking[0],
    );
    const monthlyDelta = getMonthlyTotal(priciest.option) - getMonthlyTotal(cheapest.option);
    if (monthlyDelta > 0) {
      lines.push("", `💡 Diferencia mensual entre opciones: hasta ${monthlyDelta} €`);
    }
  }

  if (ranking[0]) {
    lines.push("", "💬 Recomendación:", ranking[0].score.explanation);
    if (ranking[0].score.warnings.length > 0) {
      lines.push("", "⚠️ Avisos del #1:", ...ranking[0].score.warnings.map((item) => `• ${item}`));
    }
  }

  lines.push(
    "",
    "—",
    "Compara alquileres. Decide mejor.",
    "¿Buscas piso? Guarda tus anuncios en Eligr y compara con criterio.",
  );
  return lines.join("\n");
}

export function buildChosenOptionSummary(
  search: RentalSearch,
  option: RentalOption,
  score: RentalScore,
) {
  const lines = [
    "Eligr — Mi elección de alquiler",
    "",
    `Búsqueda: ${search.title} · ${search.city}`,
    `Presupuesto: ${search.maxBudget} €/mes`,
    `Destino trayecto: ${search.destinationLabel}`,
    "",
    `Elegí: ${option.title}`,
    `Zona: ${option.locationLabel}`,
    `Puntuación: ${score.orientative ? "orientativa" : `${score.overallScore}/100`}`,
    `Coste mensual: ${getMonthlyTotal(option)} €/mes`,
    `Desembolso inicial: ${getMoveInCost(option)} €`,
    `Trayecto: ${Number.isFinite(option.commuteMinutes) ? `${option.commuteMinutes} min` : `~${effectiveCommuteMinutes(option)} min (estimado)`}`,
    "",
    score.explanation,
  ];

  if (score.pros.length > 0) {
    lines.push("", "Pros:", ...score.pros.map((item) => `• ${item}`));
  }
  if (score.cons.length > 0) {
    lines.push("", "Contras:", ...score.cons.map((item) => `• ${item}`));
  }
  if (score.warnings.length > 0) {
    lines.push("", "Avisos:", ...score.warnings.map((item) => `• ${item}`));
  }
  if (option.visitNextAction.trim()) {
    lines.push("", `Siguiente paso: ${option.visitNextAction.trim()}`);
  }
  if (option.visitImpression.trim()) {
    lines.push("", `Impresión de visita: ${option.visitImpression.trim()}`);
  }

  lines.push("", "Generado con Eligr — Compara alquileres. Decide mejor.");
  return lines.join("\n");
}
