import { sampleRentalOptions } from "./seed";
import { RentalOption } from "./types";

const SAMPLE_IDS = new Set(sampleRentalOptions.map((o) => o.id));

export function isUsingSampleData(rentalOptions: RentalOption[]): boolean {
  if (rentalOptions.length === 0) return false;
  if (rentalOptions.length !== sampleRentalOptions.length) return false;
  return rentalOptions.every((o) => SAMPLE_IDS.has(o.id));
}
