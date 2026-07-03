import { RentalFormValues, toFormValues } from "@/components/RentalForm";
import { ParsedListing } from "./types";

export function parsedListingToFormValues(parsed: ParsedListing): RentalFormValues {
  const base = toFormValues();
  return {
    ...base,
    title: parsed.title ?? base.title,
    sourceUrl: parsed.sourceUrl ?? base.sourceUrl,
    rentalType: parsed.rentalType ?? base.rentalType,
    monthlyPrice: parsed.monthlyPrice ?? base.monthlyPrice,
    locationLabel: parsed.locationLabel ?? base.locationLabel,
    size: parsed.size ?? base.size,
    deposit: parsed.deposit ?? (parsed.monthlyPrice ?? base.deposit),
    agencyFee: parsed.agencyFee ?? base.agencyFee,
    billsIncluded: parsed.billsIncluded ?? base.billsIncluded,
    estimatedBills: parsed.billsIncluded ? 0 : base.estimatedBills,
    furnished: parsed.furnished ?? base.furnished,
    contractAvailable: parsed.contractAvailable ?? base.contractAvailable,
    bathroomType: parsed.bathroomType ?? base.bathroomType,
    notes: parsed.notes ?? base.notes,
  };
}

export function quickRating(level: "low" | "mid" | "high") {
  if (level === "low") return 4;
  if (level === "high") return 9;
  return 7;
}
