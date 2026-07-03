import { getActiveOptions } from "./filters";
import { getVisitChecklistProgress } from "./visit-checklist";
import { RentalOption, RentalSearch } from "./types";

export type JourneyPhase = "setup" | "collect" | "visit" | "decide";

export type JourneyStep = {
  id: JourneyPhase;
  label: string;
  done: boolean;
  current: boolean;
};

export type AssistantFocus = {
  phase: JourneyPhase;
  title: string;
  body: string;
  primaryLabel: string;
  primaryRoute: "/search/edit" | "/rental/new" | "/rental/quick" | "/visit" | "/ranking" | "/compare";
  secondaryLabel?: string;
  secondaryRoute?: "/rental/new" | "/rental/quick" | "/ranking" | "/compare";
};

export function getVisitDebriefCandidates(options: RentalOption[]) {
  const active = getActiveOptions(options);
  const priority = active.filter((o) => o.status === "visit_planned" || o.status === "contacted");
  const incomplete = active.filter((o) => {
    const { reviewed, total } = getVisitChecklistProgress(o.visitChecklist);
    return (o.status === "visited" || o.status === "favorite") && reviewed < total;
  });
  const rest = active.filter(
    (o) => !priority.includes(o) && !incomplete.includes(o) && o.status !== "discarded",
  );
  return [...priority, ...incomplete, ...rest];
}

export function getJourneySteps(search: RentalSearch, options: RentalOption[]): JourneyStep[] {
  const active = getActiveOptions(options);
  const hasSearch = Boolean(search.city && search.maxBudget);
  const hasOptions = active.length >= 1;
  const hasVisitActivity = active.some(
    (o) =>
      o.status === "visited" ||
      o.status === "favorite" ||
      o.status === "visit_planned" ||
      getVisitChecklistProgress(o.visitChecklist).reviewed > 0,
  );
  const readyToDecide = active.length >= 2 && active.some((o) => getVisitChecklistProgress(o.visitChecklist).reviewed > 0);

  const pendingVisit = active.filter((o) => o.status === "visit_planned" || o.status === "contacted");

  const phase: JourneyPhase = !hasSearch
    ? "setup"
    : !hasOptions
      ? "collect"
      : readyToDecide
        ? "decide"
        : pendingVisit.length > 0
          ? "visit"
          : hasVisitActivity
            ? "visit"
            : "collect";

  const steps: JourneyStep[] = [
    { id: "setup", label: "Búsqueda", done: hasSearch, current: phase === "setup" },
    { id: "collect", label: "Opciones", done: hasOptions, current: phase === "collect" },
    { id: "visit", label: "Visitas", done: hasVisitActivity, current: phase === "visit" },
    { id: "decide", label: "Decisión", done: readyToDecide, current: phase === "decide" },
  ];
  return steps;
}

export function getAssistantFocus(search: RentalSearch, options: RentalOption[]): AssistantFocus {
  const active = getActiveOptions(options);
  const steps = getJourneySteps(search, options);
  const phase = steps.find((s) => s.current)?.id ?? "collect";
  const pendingVisit = active.filter((o) => o.status === "visit_planned" || o.status === "contacted");

  if (phase === "setup") {
    return {
      phase,
      title: "Configura tu búsqueda",
      body: "Cuéntale al asistente qué buscas: zona, presupuesto, fecha de entrada y tipos de vivienda.",
      primaryLabel: "Configurar búsqueda",
      primaryRoute: "/search/edit",
    };
  }

  if (phase === "collect" || active.length === 0) {
    if (active.length === 1) {
      return {
        phase: "collect",
        title: "Una más y comparas",
        body: "Ya tienes un piso guardado. Añade otro anuncio para ver el ranking con pros, contras y avisos.",
        primaryLabel: "Añadir segunda",
        primaryRoute: "/rental/new",
        secondaryLabel: "Añadir rápido",
        secondaryRoute: "/rental/quick",
      };
    }
    if (active.length >= 2) {
      return {
        phase: "collect",
        title: "Ya puedes comparar",
        body: `Tienes ${active.length} opciones activas. Mira el ranking para ver quién va ganando según tus prioridades.`,
        primaryLabel: "Ver ranking",
        primaryRoute: "/ranking",
        secondaryLabel: "Añadir otra",
        secondaryRoute: "/rental/new",
      };
    }
    return {
      phase: "collect",
      title: "Guarda tus opciones",
      body: "Pega el texto del anuncio o responde unas preguntas. En menos de 2 minutos tendrás datos para comparar.",
      primaryLabel: "Pegar anuncio",
      primaryRoute: "/rental/new",
      secondaryLabel: "Añadir rápido",
      secondaryRoute: "/rental/quick",
    };
  }

  if (pendingVisit.length > 0 || phase === "visit") {
    return {
      phase: "visit",
      title: pendingVisit.length > 0 ? "Tienes visitas en marcha" : "Registra lo que viste",
      body:
        pendingVisit.length > 0
          ? `${pendingVisit.length} opción${pendingVisit.length === 1 ? "" : "es"} esperan tus notas tras la visita. Tarda menos de un minuto.`
          : "Después de cada visita, registra impresiones y señales de riesgo. El asistente actualizará tu ranking.",
      primaryLabel: "Acabo de visitar un piso",
      primaryRoute: "/visit",
      secondaryLabel: "Añadir otra opción",
      secondaryRoute: "/rental/new",
    };
  }

  return {
    phase: "decide",
    title: "Hora de decidir",
    body: "Ya tienes datos de visita. Mira el ranking o compara dos finalistas con tradeoffs claros.",
    primaryLabel: "Ver ranking",
    primaryRoute: "/ranking",
    secondaryLabel: "Comparar dos",
    secondaryRoute: "/compare",
  };
}
