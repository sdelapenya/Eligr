import { getMergeStats, mergeRentalOptions } from "../collaboration";
import { resolveImportedChosenOptionId, countOptionsWithPhotos } from "../backup-import-logic";
import { getBudgetFit } from "../budget";
import { getActiveOptions } from "../filters";
import { parseBackup, serializeBackup, validateBackupImport, getBackupImportPreview } from "../export-import";
import { buildRankingReportHtml } from "../report-html";
import { buildChosenOptionSummary } from "../summary";
import { getQuickPickSubtitle } from "../quick-picks";
import { buildQuickAddRental } from "../quick-add";
import { sortRankedList } from "../list-sort";
import { canReactivateFromDiscarded } from "../limits";
import { daysUntilMoveIn } from "../move-in";
import { parsePastedListingText } from "../listing-import/parse-text";
import { isUsingSampleData } from "../sample-data";
import { rankRentals } from "../scoring";
import { getTopScoreContributions } from "../score-breakdown";
import { sampleRentalOptions, sampleSearch } from "../seed";
import { getScoreContext } from "../score-context";
import { getPendingTasks, filterPendingTasksForDisplay } from "../pending-tasks";
import { resolveVisitDebriefStatus, statusFromImpressionChip } from "../visit-debrief";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function run() {
  assert(statusFromImpressionChip("") === undefined, "empty impression does not change status");
  assert(statusFromImpressionChip("No convence, descartaría") === "visited", "impression never auto-discards");
  assert(
    resolveVisitDebriefStatus("", "", 0, "new") === "new",
    "empty debrief keeps status",
  );
  assert(
    resolveVisitDebriefStatus("Me gustó, encaja con lo que busco", "", 1, "new") === "visited",
    "positive impression marks visited only",
  );
  assert(
    resolveVisitDebriefStatus("Me gustó", "Marcar como favorita", 1, "new") === "favorite",
    "explicit next-action can set favorite",
  );
  assert(
    resolveVisitDebriefStatus("", "Descartar esta opción", 0, "visited") === "discarded",
    "explicit next-action can discard",
  );

  const parsed = parsePastedListingText("Habitación en Chamberí\n750 €/mes\nGastos incluidos");
  assert(parsed.monthlyPrice === 750, "parse price");
  assert(Boolean(parsed.title), "parse title");

  const pricey = { ...sampleRentalOptions[0], monthlyPrice: 900, billsIncluded: true, estimatedBills: 0 };
  assert(getBudgetFit(pricey, 800) === "over", "budget over");

  const active = getActiveOptions(sampleRentalOptions);
  assert(active.length > 0, "active options");

  assert(isUsingSampleData(sampleRentalOptions), "detect sample data");

  const backup = serializeBackup(parseBackup(serializeBackup({ version: 1, exportedAt: "", search: sampleSearch, rentalOptions: sampleRentalOptions }))!);
  assert(backup.includes('"version": 1'), "backup roundtrip");

  assert(daysUntilMoveIn("2026-07-01") !== null, "move in parse");

  assert(canReactivateFromDiscarded(4, false), "can reactivate when under free limit");
  assert(!canReactivateFromDiscarded(5, false), "cannot reactivate at free limit");
  assert(canReactivateFromDiscarded(10, true), "premium ignores reactivate limit");

  const oversizedBackup = {
    version: 1 as const,
    exportedAt: "",
    search: sampleSearch,
    rentalOptions: Array.from({ length: 6 }, (_, index) => ({
      ...sampleRentalOptions[0],
      id: `rental-x-${index}`,
      status: "new" as const,
    })),
  };
  assert(validateBackupImport(oversizedBackup, false) === "limit_exceeded", "import limit free");
  assert(validateBackupImport(oversizedBackup, true) === "ok", "import limit premium");

  const sanitized = parseBackup(
    JSON.stringify({
      version: 1,
      exportedAt: "",
      search: sampleSearch,
      rentalOptions: [{ ...sampleRentalOptions[0], monthlyPrice: "oops", locationRating: 99 }],
    }),
  );
  assert(sanitized?.rentalOptions[0].monthlyPrice === 0, "sanitize invalid monthly price");
  assert(sanitized?.rentalOptions[0].locationRating === 10, "clamp rating");

  const checklistBackup = parseBackup(
    JSON.stringify({
      version: 1,
      exportedAt: "",
      search: sampleSearch,
      rentalOptions: [
        {
          ...sampleRentalOptions[0],
          visitChecklist: { noise: "ok", light: "bogus", humidity: "issue", extra: "bad" },
        },
      ],
    }),
  );
  assert(checklistBackup?.rentalOptions[0].visitChecklist.noise === "ok", "sanitize checklist valid key");
  assert(checklistBackup?.rentalOptions[0].visitChecklist.light === "pending", "sanitize checklist invalid value");
  assert(checklistBackup?.rentalOptions[0].visitChecklist.humidity === "issue", "sanitize checklist issue");

  const singleRank = rankRentals([sampleRentalOptions[0]], sampleSearch.priorities, getScoreContext(sampleSearch));
  assert(singleRank[0].score.orientative === true, "single option orientative");
  assert(singleRank[0].score.overallScore <= 72, "single option score capped");

  const visitPending = getPendingTasks([
    { ...sampleRentalOptions[0], status: "visit_planned", visitNextAction: "" },
  ]);
  assert(visitPending[0]?.actionLabel === "Registrar visita", "visit task action label");
  assert(visitPending[0]?.kindLabel === "Visita", "visit task kind label");

  const withFollowup = getPendingTasks([
    { ...sampleRentalOptions[0], status: "new", visitNextAction: "Pedir contrato" },
  ]);
  assert(withFollowup.some((t) => t.kind === "followup"), "followup task");

  const filtered = filterPendingTasksForDisplay(visitPending, "/visit");
  assert(filtered.length === 0, "hide visit tasks when hint covers visit");

  const ranked = rankRentals(sampleRentalOptions.slice(0, 2), sampleSearch.priorities, getScoreContext(sampleSearch));
  assert(getQuickPickSubtitle("cheapest", ranked[0]).includes("€/mes"), "quick pick cheapest subtitle");
  assert(getQuickPickSubtitle("lowRisk", ranked[0]).length > 0, "quick pick low risk subtitle");

  const preview = getBackupImportPreview(serializeBackup({ version: 1, exportedAt: "", search: sampleSearch, rentalOptions: sampleRentalOptions }), false);
  assert(preview.valid && preview.searchTitle.length > 0, "backup import preview valid");
  assert(getBackupImportPreview("{bad", false).valid === false, "backup import preview invalid");

  const quick = buildQuickAddRental({ title: "Piso test", monthlyPrice: 650, locationLabel: "Ruzafa" });
  assert(quick.monthlyPrice === 650 && quick.locationLabel === "Ruzafa", "quick add rental");
  assert(quick.contractAvailable === false, "quick add does not invent contract");
  assert(quick.deposit === 0 && quick.estimatedBills === 0, "quick add leaves costs unknown");
  assert(quick.locationRating === 5, "quick add uses neutral ratings");

  const quickWithPhoto = buildQuickAddRental({
    title: "Piso test",
    monthlyPrice: 650,
    locationLabel: "Ruzafa",
    photoUri: "file:///photo.jpg",
  });
  assert(quickWithPhoto.photoUri === "file:///photo.jpg", "quick add photo");

  const fullRank = rankRentals(sampleRentalOptions, sampleSearch.priorities, getScoreContext(sampleSearch));
  const byPrice = sortRankedList(fullRank, "price_asc");
  assert(byPrice[0].option.monthlyPrice <= byPrice[byPrice.length - 1].option.monthlyPrice, "sort price asc");
  const topContrib = getTopScoreContributions(fullRank[0].score, 2);
  assert(topContrib.length >= 1 && topContrib.length <= 2, "top score contributions");
  assert(topContrib[0].weightedPoints >= (topContrib[1]?.weightedPoints ?? 0), "contributions sorted");

  const chosenSummary = buildChosenOptionSummary(sampleSearch, fullRank[0].option, fullRank[0].score);
  assert(chosenSummary.includes("Mi elección"), "chosen option summary");

  const reportHtml = buildRankingReportHtml(sampleSearch, fullRank);
  assert(reportHtml.includes("<table>"), "ranking report html table");
  assert(reportHtml.includes("Informe de comparación Eligr"), "ranking report title");

  const [first, second] = sampleRentalOptions;
  const merged = mergeRentalOptions([first], [{ ...second, title: "Importado" }], "search-1");
  assert(merged.length === 2, "merge adds new option");
  const mergeStats = getMergeStats([first], [{ ...first, title: "Actualizado", updatedAt: "2099-01-01T00:00:00.000Z" }]);
  assert(mergeStats.updatedOptions === 1, "merge detects update");

  const chosenMerge = resolveImportedChosenOptionId("merge", "rental-2", merged, "rental-1");
  assert(chosenMerge === "rental-1", "merge keeps current chosen option");
  const chosenReplace = resolveImportedChosenOptionId("replace", "rental-2", merged, "rental-1");
  assert(chosenReplace === "rental-2", "replace uses backup chosen when valid");
  assert(countOptionsWithPhotos([{ ...first, photoUri: "file:///x.jpg" }]) === 1, "photo count");

  console.log("All domain tests passed.");
}

run();
