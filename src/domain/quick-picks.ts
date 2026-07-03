import { ColorPalette } from "@/ui/theme";

import { effectiveCommuteMinutes, getMonthlyTotal } from "./rental-costs";
import { RentalOption, RentalScore } from "./types";

export type QuickPickKind = "best" | "cheapest" | "lowRisk" | "fastest";

type RankedRental = { option: RentalOption; score: RentalScore };

export type QuickPickIconName = "trophy-outline" | "cash-outline" | "shield-checkmark-outline" | "train-outline";

export function getQuickPickIcon(kind: QuickPickKind): QuickPickIconName {
  switch (kind) {
    case "best":
      return "trophy-outline";
    case "cheapest":
      return "cash-outline";
    case "lowRisk":
      return "shield-checkmark-outline";
    case "fastest":
      return "train-outline";
  }
}

export function getQuickPickAccent(kind: QuickPickKind, colors: ColorPalette) {
  switch (kind) {
    case "best":
      return { bg: colors.accentMuted, icon: colors.accentDeep };
    case "cheapest":
      return { bg: colors.warningSoft, icon: colors.warning };
    case "lowRisk":
      return { bg: colors.inkSoft, icon: colors.textSecondary };
    case "fastest":
      return { bg: colors.accentSoft, icon: colors.accent };
  }
}

export function getQuickPickSubtitle(kind: QuickPickKind, item: RankedRental): string {
  const { option, score } = item;
  switch (kind) {
    case "best":
      return score.orientative ? "Puntuación orientativa" : `${score.overallScore}/100 · ${score.warnings.length} alerta${score.warnings.length === 1 ? "" : "s"}`;
    case "cheapest":
      return `${getMonthlyTotal(option)} €/mes`;
    case "lowRisk":
      return score.warnings.length === 0 ? "Sin alertas" : `${score.warnings.length} alerta${score.warnings.length === 1 ? "" : "s"}`;
    case "fastest":
      return `~${effectiveCommuteMinutes(option)} min trayecto`;
  }
}
