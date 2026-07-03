import { Ionicons } from "@expo/vector-icons";

import { defaultPriorities } from "./seed";
import { PriorityWeights } from "./types";

export type PriorityProfileId = "student" | "couple" | "remote" | "balanced";

export type PriorityProfile = {
  id: PriorityProfileId;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  priorities: PriorityWeights;
};

export const priorityProfiles: PriorityProfile[] = [
  {
    id: "student",
    label: "Estudiante",
    description: "Precio y trayecto a clase pesan más.",
    icon: "school-outline",
    priorities: {
      price: 10,
      moveInCost: 8,
      commute: 10,
      location: 6,
      safety: 7,
      roomQuality: 5,
      privacy: 4,
      billsIncluded: 8,
      availability: 7,
      personalFeeling: 6,
    },
  },
  {
    id: "couple",
    label: "Pareja",
    description: "Equilibrio entre espacio, sensación y coste.",
    icon: "people-outline",
    priorities: {
      price: 7,
      moveInCost: 7,
      commute: 7,
      location: 8,
      safety: 9,
      roomQuality: 8,
      privacy: 8,
      billsIncluded: 5,
      availability: 6,
      personalFeeling: 9,
    },
  },
  {
    id: "remote",
    label: "Teletrabajo",
    description: "Calidad del espacio y privacidad por encima del trayecto.",
    icon: "laptop-outline",
    priorities: {
      price: 7,
      moveInCost: 6,
      commute: 3,
      location: 6,
      safety: 8,
      roomQuality: 10,
      privacy: 10,
      billsIncluded: 5,
      availability: 5,
      personalFeeling: 8,
    },
  },
  {
    id: "balanced",
    label: "Equilibrado",
    description: "Pesos por defecto de Eligr.",
    icon: "options-outline",
    priorities: { ...defaultPriorities },
  },
];

export function getPriorityProfile(id: PriorityProfileId): PriorityProfile {
  return priorityProfiles.find((profile) => profile.id === id) ?? priorityProfiles[3];
}
