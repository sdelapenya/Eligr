import { RentalStatus } from "./types";
import { ChecklistStatus, VisitChecklist, VisitChecklistKey } from "./visit-checklist";

export type VisitDebriefPayload = {
  visitChecklist: VisitChecklist;
  visitImpression: string;
  visitNextAction: string;
  status: RentalStatus;
};

export const impressionChips = [
  "Me gustó, encaja con lo que busco",
  "Dudas, hay cosas que confirmar",
  "No convence, descartaría",
  "Mejor de lo esperado en persona",
  "Peor de lo esperado en persona",
] as const;

export const nextActionChips = [
  "Pedir copia del contrato",
  "Solicitar segunda visita",
  "Negociar precio o condiciones",
  "Contactar al casero con preguntas",
  "Descartar esta opción",
  "Marcar como favorita",
] as const;

export function setChecklistItem(checklist: VisitChecklist, key: VisitChecklistKey, status: ChecklistStatus): VisitChecklist {
  return { ...checklist, [key]: status };
}

export function statusFromNextActionChip(chip: string): RentalStatus | undefined {
  if (chip === "Descartar esta opción") return "discarded";
  if (chip === "Marcar como favorita") return "favorite";
  return undefined;
}

export function statusFromImpressionChip(chip: string): RentalStatus | undefined {
  const trimmed = chip.trim();
  if (!trimmed) return undefined;
  // Impresión solo marca "visitado". Favorito/descartado requieren chip explícito en «Próximo paso».
  return "visited";
}

export function resolveVisitDebriefStatus(
  impression: string,
  nextAction: string,
  checklistReviewed: number,
  currentStatus: RentalStatus,
): RentalStatus {
  return (
    statusFromNextActionChip(nextAction.trim()) ??
    (impression.trim() || checklistReviewed > 0 ? "visited" : currentStatus)
  );
}
