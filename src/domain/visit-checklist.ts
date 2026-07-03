export type ChecklistStatus = "pending" | "ok" | "issue";

export type VisitChecklistKey =
  | "noise"
  | "light"
  | "humidity"
  | "contract"
  | "inventory"
  | "bills"
  | "roommates"
  | "commuteCheck";

export type VisitChecklist = Record<VisitChecklistKey, ChecklistStatus>;

export const visitChecklistOrder: VisitChecklistKey[] = [
  "noise",
  "light",
  "humidity",
  "contract",
  "inventory",
  "bills",
  "roommates",
  "commuteCheck",
];

export const visitChecklistLabels: Record<VisitChecklistKey, string> = {
  noise: "Ruido",
  light: "Luz",
  humidity: "Humedad",
  contract: "Contrato",
  inventory: "Inventario",
  bills: "Gastos",
  roommates: "Convivencia",
  commuteCheck: "Trayecto real",
};

export function emptyVisitChecklist(): VisitChecklist {
  return {
    noise: "pending",
    light: "pending",
    humidity: "pending",
    contract: "pending",
    inventory: "pending",
    bills: "pending",
    roommates: "pending",
    commuteCheck: "pending",
  };
}

export function cycleChecklistStatus(current: ChecklistStatus): ChecklistStatus {
  if (current === "pending") return "ok";
  if (current === "ok") return "issue";
  return "pending";
}

export function getVisitChecklistProgress(checklist?: VisitChecklist) {
  const safe = checklist ?? emptyVisitChecklist();
  const total = visitChecklistOrder.length;
  const reviewed = visitChecklistOrder.filter((key) => safe[key] !== "pending").length;
  const issues = visitChecklistOrder.filter((key) => safe[key] === "issue").length;
  return { total, reviewed, issues, percent: Math.round((reviewed / total) * 100) };
}

export function getVisitChecklistSummary(checklist?: VisitChecklist) {
  if (!checklist) return "Sin revisar en visita.";
  const { reviewed, issues, total } = getVisitChecklistProgress(checklist);
  if (reviewed === 0) return "Sin revisar en visita.";
  if (issues > 0) return `${issues} punto${issues === 1 ? "" : "s"} a revisar de ${reviewed}/${total}.`;
  return `Checklist OK (${reviewed}/${total}).`;
}

export function getVisitChecklistWarnings(checklist?: VisitChecklist) {
  if (!checklist) return [];
  return visitChecklistOrder
    .filter((key) => checklist[key] === "issue")
    .map((key) => `Visita: ${visitChecklistLabels[key]} a revisar.`);
}

export function buildVisitChecklistWhatsAppMessage(optionTitle: string): string {
  const lines = [
    `Hola, acabo de visitar «${optionTitle}». Me gustaría confirmar:`,
    "",
    ...visitChecklistOrder.map((key) => `• ${visitChecklistLabels[key]}`),
    "",
    "¿Podemos aclarar estos puntos antes de decidir?",
    "",
    "— Enviado con Eligr",
  ];
  return lines.join("\n");
}
