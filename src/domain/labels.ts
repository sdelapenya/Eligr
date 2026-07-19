import { PriorityKey, RentalStatus, RentalType } from "./types";

export const priorityLabels: Record<PriorityKey, string> = {
  price: "Precio",
  moveInCost: "Entrada",
  commute: "Trayecto",
  location: "Zona",
  safety: "Contrato / papeles",
  roomQuality: "Calidad",
  privacy: "Privacidad",
  billsIncluded: "Gastos",
  availability: "Fecha",
  personalFeeling: "Sensación",
};

export const statusLabels: Record<RentalStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  visit_planned: "Visita planificada",
  visited: "Visitado",
  favorite: "Favorito",
  discarded: "Descartado",
};

export const rentalTypeLabels: Record<RentalType, string> = {
  room: "Habitación",
  studio: "Estudio",
  flat: "Piso",
  coliving: "Coliving",
  other: "Otro",
};
