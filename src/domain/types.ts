import { VisitChecklist } from "./visit-checklist";

export type RentalStatus =
  | "new"
  | "contacted"
  | "visit_planned"
  | "visited"
  | "favorite"
  | "discarded";

export type RentalType = "room" | "studio" | "flat" | "coliving" | "other";

export type BathroomType = "private" | "shared" | "unknown";

export type PriorityKey =
  | "price"
  | "moveInCost"
  | "commute"
  | "location"
  | "safety"
  | "roomQuality"
  | "privacy"
  | "billsIncluded"
  | "availability"
  | "personalFeeling";

export type PriorityWeights = Record<PriorityKey, number>;

export type RentalSearch = {
  id: string;
  title: string;
  city: string;
  area: string;
  rentalTypes: RentalType[];
  maxBudget: number;
  moveInDate: string;
  destinationLabel: string;
  priorities: PriorityWeights;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RentalOption = {
  id: string;
  searchId: string;
  title: string;
  sourceUrl?: string;
  rentalType: RentalType;
  monthlyPrice: number;
  billsIncluded: boolean;
  estimatedBills: number;
  deposit: number;
  agencyFee: number;
  locationLabel: string;
  commuteMinutes?: number;
  size?: number;
  furnished: boolean;
  bathroomType: BathroomType;
  contractAvailable: boolean;
  availableDate?: string;
  status: RentalStatus;
  notes: string;
  photoUri?: string;
  visitChecklist: VisitChecklist;
  visitImpression: string;
  visitNextAction: string;
  locationRating: number;
  roomQualityRating: number;
  personalFeelingRating: number;
  partnerFeelingRating?: number;
  partnerNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type ScoreBreakdown = Record<PriorityKey, number>;

export type RentalScore = {
  rentalOptionId: string;
  overallScore: number;
  breakdown: ScoreBreakdown;
  weightedBreakdown: ScoreBreakdown;
  explanation: string;
  pros: string[];
  cons: string[];
  warnings: string[];
  badges: string[];
  orientative?: boolean;
};

export type VisitNote = {
  id: string;
  rentalOptionId: string;
  visitedAt?: string;
  impression: string;
  questionsAsked: string[];
  redFlags: string[];
  nextAction: string;
};
