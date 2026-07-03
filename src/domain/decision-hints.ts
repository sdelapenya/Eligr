import { getActiveOptions } from "./filters";
import { RentalOption, RentalSearch } from "./types";

export type DecisionHint = {
  title: string;
  body: string;
  actionLabel?: string;
  actionRoute?: "/rental/new" | "/search/edit" | "/priorities" | "/ranking" | "/compare" | "/visit";
  actionRentalId?: string;
};

export function getDecisionHint(search: RentalSearch, rentalOptions: RentalOption[]): DecisionHint | null {
  const active = getActiveOptions(rentalOptions);

  if (active.length === 0) {
    return {
      title: "Empieza tu comparación",
      body: "Pega un anuncio o añade un alquiler en menos de 2 minutos. Con dos opciones ya verás un ranking.",
      actionLabel: "Añadir opción",
      actionRoute: "/rental/new",
    };
  }

  if (active.length === 1) {
    return {
      title: "Falta una para comparar",
      body: "Con dos opciones activas el ranking ya tiene sentido. Pega otro anuncio o usa añadir rápido.",
      actionLabel: "Añadir segunda",
      actionRoute: "/rental/new",
    };
  }

  if (active.length === 2) {
    return {
      title: "¡Listo para comparar!",
      body: "Ya tienes dos opciones. Mira el ranking para ver cuál encaja mejor con tus prioridades.",
      actionLabel: "Ver ranking",
      actionRoute: "/ranking",
    };
  }

  const needsVisit = active.filter((o) => o.status === "visit_planned" || o.status === "contacted");
  if (needsVisit.length > 0) {
    return {
      title: "Visitas pendientes",
      body: `${needsVisit.length} opción${needsVisit.length === 1 ? "" : "es"} esperan tus notas. El asistente tarda menos de un minuto.`,
      actionLabel: "Registrar visita",
      actionRoute: "/visit",
    };
  }

  const noCommute = active.filter((o) => !Number.isFinite(o.commuteMinutes));
  if (noCommute.length > 0) {
    const first = noCommute[0];
    return {
      title: "Falta el trayecto",
      body: `${noCommute.length} opción${noCommute.length === 1 ? "" : "es"} sin minutos estimados a ${search.destinationLabel}. Empieza por «${first.title}».`,
      actionLabel: "Añadir trayecto",
      actionRoute: "/ranking",
      actionRentalId: first.id,
    };
  }

  if (active.length >= 2) {
    return {
      title: "¿Dudas entre dos?",
      body: "Usa la comparación lado a lado para ver tradeoffs claros según tus prioridades.",
      actionLabel: "Comparar",
      actionRoute: "/compare",
    };
  }

  return null;
}
