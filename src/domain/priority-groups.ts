import { PriorityKey } from "./types";

export type PriorityGroup = {
  title: string;
  keys: PriorityKey[];
};

export const priorityGroups: PriorityGroup[] = [
  { title: "Dinero", keys: ["price", "moveInCost", "billsIncluded"] },
  { title: "Ubicación", keys: ["commute", "location", "safety"] },
  { title: "Calidad", keys: ["roomQuality", "privacy", "availability"] },
  { title: "Sensación", keys: ["personalFeeling"] },
];
