import { getMonthlyTotal, getMoveInCost, effectiveCommuteMinutes } from "./rental-costs";
import { RentalScore, RentalSearch, RentalOption } from "./types";

type RankedOption = { option: RentalOption; score: RentalScore };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatGeneratedAt() {
  return new Date().toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

function reportStyles() {
  return `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1a2420; margin: 24px; line-height: 1.5; max-width: 920px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin-top: 24px; color: #145c53; }
    h3 { font-size: 15px; margin: 0 0 8px; color: #1a2420; }
    .meta { color: #3d4a44; font-size: 14px; }
    .summary-box { background: #f0f7f5; border: 1px solid #c5ddd7; border-radius: 10px; padding: 16px; margin: 16px 0; }
    .insight { border: 1px solid #e8e2d6; border-radius: 8px; padding: 12px 14px; margin-top: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    th, td { border-bottom: 1px solid #e8e2d6; padding: 8px 6px; text-align: left; vertical-align: top; }
    th { color: #145c53; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
    .badge { display: inline-block; background: #f6e8d4; color: #9a5610; border-radius: 6px; padding: 2px 8px; font-size: 12px; margin-right: 4px; margin-top: 4px; }
    .badge-neutral { background: #e8e2d6; color: #3d4a44; }
    .footer { margin-top: 32px; font-size: 12px; color: #6b756f; border-top: 1px solid #e8e2d6; padding-top: 16px; }
    .cta { margin-top: 8px; color: #145c53; font-weight: 600; }
    ul { padding-left: 18px; margin: 8px 0; }
    .pros { color: #145c53; }
    .cons { color: #7a4a12; }
  `;
}

function renderScoreCell(score: RentalScore) {
  if (score.orientative) {
    return `<span class="badge badge-neutral">Orientativo</span>`;
  }
  return `${score.overallScore}/100`;
}

function renderInsightList(items: string[], className: string) {
  if (items.length === 0) return "";
  return `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function buildRankingReportHtml(search: RentalSearch, ranking: RankedOption[]) {
  const rows = ranking
    .map(
      ({ option, score }, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(option.title)}</strong><br/><span class="meta">${escapeHtml(option.locationLabel)}</span></td>
        <td>${renderScoreCell(score)}</td>
        <td>${getMonthlyTotal(option)} €</td>
        <td>${getMoveInCost(option)} €</td>
        <td>${Number.isFinite(option.commuteMinutes) ? `${option.commuteMinutes} min` : `~${effectiveCommuteMinutes(option)} min`}</td>
      </tr>`,
    )
    .join("");

  const best = ranking[0];
  const recommendation = best
    ? `<div class="summary-box">
        <h3>Recomendación: ${escapeHtml(best.option.title)}</h3>
        <p>${escapeHtml(best.score.explanation)}</p>
        ${
          best.score.warnings.length > 0
            ? `<p>${best.score.warnings.map((w) => `<span class="badge">${escapeHtml(w)}</span>`).join("")}</p>`
            : ""
        }
        ${best.score.orientative ? `<p class="meta">Puntuación orientativa: añade más opciones para un ranking más fiable.</p>` : ""}
      </div>`
    : "";

  const insights = ranking
    .slice(0, 3)
    .map(
      ({ option, score }, index) => `
      <div class="insight">
        <h3>${index + 1}. ${escapeHtml(option.title)}</h3>
        <p class="meta">${escapeHtml(option.locationLabel)} · ${getMonthlyTotal(option)} €/mes</p>
        ${renderInsightList(score.pros.slice(0, 3), "pros")}
        ${renderInsightList(score.cons.slice(0, 2), "cons")}
      </div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Informe Eligr — ${escapeHtml(search.title)}</title>
  <style>${reportStyles()}</style>
</head>
<body>
  <h1>Informe de comparación Eligr</h1>
  <p class="meta"><strong>Búsqueda:</strong> ${escapeHtml(search.title)} · ${escapeHtml(search.city)}, ${escapeHtml(search.area)}</p>
  <p class="meta"><strong>Presupuesto:</strong> ${search.maxBudget} €/mes · <strong>Destino:</strong> ${escapeHtml(search.destinationLabel)}</p>
  <p class="meta"><strong>Generado:</strong> ${escapeHtml(formatGeneratedAt())}</p>
  ${recommendation}
  <h2>Ranking</h2>
  <table>
    <thead><tr><th>#</th><th>Opción</th><th>Score</th><th>Mensual</th><th>Inicial</th><th>Trayecto</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${insights ? `<h2>Pros y contras (top ${Math.min(3, ranking.length)})</h2>${insights}` : ""}
  <p class="footer">Generado con Eligr — Compara alquileres. Decide mejor.<br/>Abre en el navegador y usa Imprimir → Guardar como PDF si lo necesitas.<br/><span class="cta">¿Buscas piso? Compara tus opciones con Eligr.</span></p>
</body>
</html>`;
}

export function buildDecisionReportHtml(search: RentalSearch, option: RentalOption, score: RentalScore) {
  const pros = score.pros.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const cons = score.cons.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const warnings = score.warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const visitBlock = [
    option.visitImpression?.trim() ? `<p><strong>Impresión de la visita:</strong> ${escapeHtml(option.visitImpression.trim())}</p>` : "",
    option.visitNextAction?.trim() ? `<p><strong>Siguiente paso:</strong> ${escapeHtml(option.visitNextAction.trim())}</p>` : "",
  ]
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mi elección — ${escapeHtml(option.title)}</title>
  <style>${reportStyles()}</style>
</head>
<body>
  <h1>Mi elección de alquiler</h1>
  <p class="meta"><strong>Búsqueda:</strong> ${escapeHtml(search.title)} · ${escapeHtml(search.city)}</p>
  <p class="meta"><strong>Generado:</strong> ${escapeHtml(formatGeneratedAt())}</p>
  <div class="summary-box">
    <h2 style="margin-top:0">${escapeHtml(option.title)}</h2>
    <p class="meta">${escapeHtml(option.locationLabel)}</p>
    <p><strong>Puntuación:</strong> ${score.orientative ? "Orientativa" : `${score.overallScore}/100`}</p>
    <p><strong>Coste mensual:</strong> ${getMonthlyTotal(option)} € · <strong>Inicial:</strong> ${getMoveInCost(option)} €</p>
    <p><strong>Trayecto:</strong> ${Number.isFinite(option.commuteMinutes) ? `${option.commuteMinutes} min` : `~${effectiveCommuteMinutes(option)} min (estimado)`}</p>
  </div>
  <h2>Por qué esta opción</h2>
  <p>${escapeHtml(score.explanation)}</p>
  ${visitBlock}
  ${pros ? `<h2>Pros</h2><ul class="pros">${pros}</ul>` : ""}
  ${cons ? `<h2>Contras</h2><ul class="cons">${cons}</ul>` : ""}
  ${warnings ? `<h2>Avisos</h2><ul>${warnings}</ul>` : ""}
  <p class="footer">Generado con Eligr — Compara alquileres. Decide mejor.<br/><span class="cta">¿Buscas piso? Compara tus opciones con Eligr.</span></p>
</body>
</html>`;
}
