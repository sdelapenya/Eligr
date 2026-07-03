import { BathroomType, RentalType } from "../types";

export type ParseConfidence = "high" | "partial" | "low";

export type ParsedListing = {
  title?: string;
  sourceUrl?: string;
  monthlyPrice?: number;
  locationLabel?: string;
  size?: number;
  deposit?: number;
  agencyFee?: number;
  billsIncluded?: boolean;
  furnished?: boolean;
  contractAvailable?: boolean;
  rentalType?: RentalType;
  bathroomType?: BathroomType;
  notes?: string;
  confidence: ParseConfidence;
  message: string;
  detectedLabels: string[];
};
