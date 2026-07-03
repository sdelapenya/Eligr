import { withVisitDefaults } from "./rental-defaults";
import { emptyVisitChecklist } from "./visit-checklist";
import { PriorityWeights, RentalOption, RentalSearch } from "./types";

const now = new Date("2026-06-06T10:00:00.000Z").toISOString();

export const defaultPriorities: PriorityWeights = {
  price: 8,
  moveInCost: 7,
  commute: 9,
  location: 7,
  safety: 8,
  roomQuality: 6,
  privacy: 6,
  billsIncluded: 5,
  availability: 5,
  personalFeeling: 7,
};

function defaultMoveInDate() {
  const date = new Date();
  date.setDate(date.getDate() + 60);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function createEmptySearch(): RentalSearch {
  const createdAt = new Date().toISOString();
  return {
    id: `search-${createdAt}`,
    title: "Mi búsqueda",
    city: "Por definir",
    area: "Por definir",
    rentalTypes: ["room"],
    maxBudget: 800,
    moveInDate: defaultMoveInDate(),
    destinationLabel: "Por definir",
    priorities: { ...defaultPriorities },
    isPremium: false,
    createdAt,
    updatedAt: createdAt,
  };
}

export const sampleSearch: RentalSearch = {
  id: "search-1",
  title: "Mudanza a Madrid",
  city: "Madrid",
  area: "Centro / Arganzuela",
  rentalTypes: ["room", "studio", "flat"],
  maxBudget: 950,
  moveInDate: "2026-07-01",
  destinationLabel: "Oficina en Atocha",
  priorities: defaultPriorities,
  isPremium: false,
  createdAt: now,
  updatedAt: now,
};

type RentalSeed = Parameters<typeof withVisitDefaults>[0];

const rawSampleRentalOptions: RentalSeed[] = [
  {
    id: "rental-1",
    searchId: sampleSearch.id,
    title: "Habitacion luminosa en Delicias",
    sourceUrl: "https://example.com/delicias",
    rentalType: "room",
    monthlyPrice: 690,
    billsIncluded: true,
    estimatedBills: 0,
    deposit: 690,
    agencyFee: 0,
    locationLabel: "Delicias",
    commuteMinutes: 14,
    size: 13,
    furnished: true,
    bathroomType: "shared",
    contractAvailable: true,
    availableDate: "2026-06-20",
    status: "favorite",
    notes: "Buena luz, compañeros tranquilos, barrio práctico.",
    visitChecklist: {
      ...emptyVisitChecklist(),
      light: "ok" as const,
      roommates: "ok" as const,
      commuteCheck: "ok" as const,
      contract: "ok" as const,
    },
    visitImpression: "Sensación acogedora y luminosa. Cocina compartida ordenada.",
    visitNextAction: "Pedir copia del contrato y confirmar gastos incluidos.",
    locationRating: 8,
    roomQualityRating: 7,
    personalFeelingRating: 8,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "rental-2",
    searchId: sampleSearch.id,
    title: "Estudio cerca de Embajadores",
    sourceUrl: "https://example.com/embajadores",
    rentalType: "studio",
    monthlyPrice: 920,
    billsIncluded: false,
    estimatedBills: 95,
    deposit: 1840,
    agencyFee: 920,
    locationLabel: "Embajadores",
    commuteMinutes: 18,
    size: 28,
    furnished: true,
    bathroomType: "private",
    contractAvailable: true,
    availableDate: "2026-07-10",
    status: "contacted",
    notes: "Mas privacidad, pero entrada alta.",
    locationRating: 9,
    roomQualityRating: 8,
    personalFeelingRating: 7,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "rental-3",
    searchId: sampleSearch.id,
    title: "Habitacion economica en Usera",
    rentalType: "room",
    monthlyPrice: 520,
    billsIncluded: false,
    estimatedBills: 70,
    deposit: 520,
    agencyFee: 0,
    locationLabel: "Usera",
    commuteMinutes: 36,
    size: 10,
    furnished: false,
    bathroomType: "shared",
    contractAvailable: false,
    availableDate: "2026-06-15",
    status: "new",
    notes: "Precio fuerte, falta contrato y muebles.",
    locationRating: 5,
    roomQualityRating: 4,
    personalFeelingRating: 5,
    createdAt: now,
    updatedAt: now,
  },
];

export const sampleRentalOptions: RentalOption[] = rawSampleRentalOptions.map(withVisitDefaults);
