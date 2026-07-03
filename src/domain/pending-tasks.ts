import { getActiveOptions } from "./filters";
import { RentalOption } from "./types";

export type PendingTaskKind = "visit" | "contact" | "followup" | "commute";

export type PendingTask = {
  id: string;
  rentalId: string;
  title: string;
  body: string;
  kind: PendingTaskKind;
  kindLabel: string;
  actionLabel: string;
};

const kindLabels: Record<PendingTaskKind, string> = {
  visit: "Visita",
  contact: "Contacto",
  followup: "Seguimiento",
  commute: "Trayecto",
};

const actionLabels: Record<PendingTaskKind, string> = {
  visit: "Registrar visita",
  contact: "Ver detalle",
  followup: "Ver detalle",
  commute: "Completar trayecto",
};

export function getPendingTaskKindLabel(kind: PendingTaskKind): string {
  return kindLabels[kind];
}

export function getPendingTaskActionLabel(kind: PendingTaskKind): string {
  return actionLabels[kind];
}

/** Hide visit rows when the main hint already routes to the visit assistant. */
export function filterPendingTasksForDisplay(
  tasks: PendingTask[],
  hintActionRoute?: string,
): PendingTask[] {
  if (hintActionRoute === "/visit") {
    return tasks.filter((task) => task.kind !== "visit");
  }
  return tasks;
}

export function getPendingTasks(options: RentalOption[]): PendingTask[] {
  const active = getActiveOptions(options);
  const tasks: PendingTask[] = [];

  for (const option of active) {
    if (option.status === "visit_planned" || option.status === "contacted") {
      tasks.push({
        id: `visit-${option.id}`,
        rentalId: option.id,
        title: option.title,
        body:
          option.status === "visit_planned"
            ? "Registra cómo fue la visita con el asistente."
            : "Has contactado; planifica o registra la visita.",
        kind: "visit",
        kindLabel: kindLabels.visit,
        actionLabel: actionLabels.visit,
      });
    }

    if (option.visitNextAction.trim()) {
      tasks.push({
        id: `action-${option.id}`,
        rentalId: option.id,
        title: option.title,
        body: option.visitNextAction.trim(),
        kind: "followup",
        kindLabel: kindLabels.followup,
        actionLabel: actionLabels.followup,
      });
    }

    if (!Number.isFinite(option.commuteMinutes)) {
      tasks.push({
        id: `commute-${option.id}`,
        rentalId: option.id,
        title: option.title,
        body: "Falta estimar el trayecto al destino.",
        kind: "commute",
        kindLabel: kindLabels.commute,
        actionLabel: actionLabels.commute,
      });
    }
  }

  return tasks.slice(0, 6);
}
