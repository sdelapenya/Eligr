import { emptyVisitChecklist } from "./visit-checklist";
import { RentalOption } from "./types";

export type QuickAddInput = {
  title: string;
  monthlyPrice: number;
  locationLabel: string;
  photoUri?: string;
};

/** Alta rápida: solo título, precio y zona. El resto queda «desconocido» para no inflar el ranking. */
export function buildQuickAddRental(
  input: QuickAddInput,
): Omit<RentalOption, "id" | "searchId" | "createdAt" | "updatedAt"> {
  const monthlyPrice = Math.max(1, Math.round(input.monthlyPrice));

  return {
    title: input.title.trim(),
    rentalType: "room",
    monthlyPrice,
    billsIncluded: false,
    estimatedBills: 0,
    deposit: 0,
    agencyFee: 0,
    locationLabel: input.locationLabel.trim(),
    furnished: false,
    bathroomType: "unknown",
    contractAvailable: false,
    status: "new",
    notes: "Alta rápida: completa fianza, gastos, trayecto y contrato cuando los sepas.",
    photoUri: input.photoUri?.trim() || undefined,
    locationRating: 5,
    roomQualityRating: 5,
    personalFeelingRating: 5,
    visitChecklist: emptyVisitChecklist(),
    visitImpression: "",
    visitNextAction: "",
  };
}
