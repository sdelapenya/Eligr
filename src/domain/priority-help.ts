import { PriorityKey } from "./types";

export const priorityHelpText: Record<PriorityKey, string> = {
  price: "Cuanto más alto, más penaliza el coste mensual total.",
  moveInCost: "Pesa la entrada: primer mes, fianza y comisiones.",
  commute: "Importa el tiempo hasta tu destino habitual.",
  location: "Valora la zona, servicios y sensación del barrio.",
  safety: "Prioriza contrato claro y señales de riesgo bajas.",
  roomQuality: "Tamaño, luz, estado y comodidades del espacio.",
  privacy: "Baño propio, convivencia y tranquilidad en casa.",
  billsIncluded: "Prefiere opciones con gastos incluidos o previsibles.",
  availability: "Encaje con tu fecha de mudanza.",
  personalFeeling: "Tu impresión tras la visita o sensación inicial.",
};
