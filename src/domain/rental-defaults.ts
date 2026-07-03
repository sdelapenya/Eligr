import { emptyVisitChecklist } from "./visit-checklist";
import { RentalOption } from "./types";

export function withVisitDefaults(
  option: Omit<RentalOption, "visitChecklist" | "visitImpression" | "visitNextAction"> &
    Partial<Pick<RentalOption, "visitChecklist" | "visitImpression" | "visitNextAction">>,
): RentalOption {
  return {
    ...option,
    visitChecklist: option.visitChecklist ?? emptyVisitChecklist(),
    visitImpression: option.visitImpression ?? "",
    visitNextAction: option.visitNextAction ?? "",
  };
}
