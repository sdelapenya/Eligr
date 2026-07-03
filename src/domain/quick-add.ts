import { emptyVisitChecklist } from "./visit-checklist";
import { RentalOption } from "./types";

export type QuickAddInput = {
  title: string;
  monthlyPrice: number;
  locationLabel: string;
  photoUri?: string;
};

export function buildQuickAddRental(
  input: QuickAddInput,
): Omit<RentalOption, "id" | "searchId" | "createdAt" | "updatedAt"> {
  const monthlyPrice = Math.max(1, Math.round(input.monthlyPrice));

  return {
    title: input.title.trim(),
    rentalType: "room",
    monthlyPrice,
    billsIncluded: false,
    estimatedBills: 80,
    deposit: monthlyPrice,
    agencyFee: 0,
    locationLabel: input.locationLabel.trim(),
    furnished: true,
    bathroomType: "shared",
    contractAvailable: true,
    status: "new",
    notes: "",
    photoUri: input.photoUri?.trim() || undefined,
    locationRating: 7,
    roomQualityRating: 7,
    personalFeelingRating: 7,
    visitChecklist: emptyVisitChecklist(),
    visitImpression: "",
    visitNextAction: "",
  };
}
