import { Href, router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { AssistantPanel } from "@/components/AssistantPanel";
import { EligrLogo } from "@/components/EligrLogo";
import { EmptyState } from "@/components/EmptyState";
import { FreeLimitCard } from "@/components/FreeLimitCard";
import { ListFilterChips } from "@/components/ListFilterChips";
import { ListSortChips } from "@/components/ListSortChips";
import { OnboardingModal } from "@/components/OnboardingModal";
import { QuickAddFab } from "@/components/QuickAddFab";
import { SwipeableRentalCard } from "@/components/SwipeableRentalCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getDecisionHint } from "@/domain/decision-hints";
import { ListFilter, getActiveOptions, getDisplayRanking, getFilterCounts, isDiscarded } from "@/domain/filters";
import { ListSortMode, sortRankedList } from "@/domain/list-sort";
import { formatMoveInCountdown } from "@/domain/move-in";
import { getPriorityProfile, PriorityProfileId } from "@/domain/priority-profiles";
import { getPendingTasks, filterPendingTasksForDisplay } from "@/domain/pending-tasks";
import { usesEstimatedCommute } from "@/domain/rental-costs";
import { isUsingSampleData } from "@/domain/sample-data";
import { FREE_TIER_LIMITS, useEligrStore } from "@/store/useEligrStore";
import { showDestructiveConfirm } from "@/utils/alert";
import { configureRankingLayoutAnimation, rankingOrderKey } from "@/utils/list-layout-animation";
import { isE2eMode } from "@/utils/e2e";
import { ChosenOptionCard } from "@/components/ChosenOptionCard";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export default function RentalOptionsScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const search = useEligrStore((state) => state.search);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const appMeta = useEligrStore((state) => state.appMeta);
  const completeOnboarding = useEligrStore((state) => state.completeOnboarding);
  const dismissSampleBanner = useEligrStore((state) => state.dismissSampleBanner);
  const startFreshSearch = useEligrStore((state) => state.startFreshSearch);
  const clearChosenOption = useEligrStore((state) => state.clearChosenOption);
  const updatePriorities = useEligrStore((state) => state.updatePriorities);
  const [filter, setFilter] = useState<ListFilter>("active");
  const [sortMode, setSortMode] = useState<ListSortMode>("score");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const filterCounts = useMemo(() => getFilterCounts(rentalOptions), [rentalOptions]);
  const ranking = useMemo(() => getDisplayRanking(rentalOptions, filter, search), [rentalOptions, filter, search]);
  const displayList = useMemo(() => sortRankedList(ranking, sortMode), [ranking, sortMode]);
  const displayOrder = useMemo(() => rankingOrderKey(displayList), [displayList]);
  const prevDisplayOrder = useRef(displayOrder);

  useEffect(() => {
    if (prevDisplayOrder.current !== displayOrder) {
      configureRankingLayoutAnimation();
      prevDisplayOrder.current = displayOrder;
    }
  }, [displayOrder]);
  const activeCount = getActiveOptions(rentalOptions).length;
  const freeLimitReached = !search.isPremium && activeCount >= FREE_TIER_LIMITS.rentalOptions;
  const hint = useMemo(() => getDecisionHint(search, rentalOptions), [search, rentalOptions]);
  const pendingTasks = useMemo(
    () => filterPendingTasksForDisplay(getPendingTasks(rentalOptions), hint?.actionRoute),
    [rentalOptions, hint?.actionRoute],
  );
  const moveInLabel = formatMoveInCountdown(search.moveInDate);
  const chosenOption = rentalOptions.find((option) => option.id === appMeta.chosenOptionId);

  useEffect(() => {
    if (!appMeta.chosenOptionId) return;
    if (!chosenOption || isDiscarded(chosenOption)) {
      clearChosenOption();
    }
  }, [appMeta.chosenOptionId, chosenOption, clearChosenOption]);
  const estimatedCommuteCount = getActiveOptions(rentalOptions).filter(usesEstimatedCommute).length;
  const searchNeedsSetup = search.city === "Por definir" || search.destinationLabel === "Por definir";
  const showSampleBanner = isUsingSampleData(rentalOptions) && !appMeta.dismissedSampleBanner;
  const showOnboarding = !isE2eMode && appMeta.hasCompletedOnboarding === false;
  const showNextStepBlock =
    (activeCount >= 1 || appMeta.hasCompletedOnboarding) && Boolean(hint || pendingTasks.length > 0);
  const searchSummary = [
    search.city || "Sin ciudad",
    search.area,
    search.destinationLabel ? `trayecto a ${search.destinationLabel}` : null,
    `hasta ${search.maxBudget} €/mes`,
    search.moveInDate ? `entrada ${search.moveInDate}` : null,
    moveInLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  const openHint = () => {
    if (!hint) return;
    if (hint.actionRentalId) {
      router.push(`/rental/${hint.actionRentalId}/edit`);
      return;
    }
    if (hint.actionRoute) router.push(hint.actionRoute as Href);
  };

  const openPendingTask = (rentalId: string, kind: string) => {
    if (kind === "visit") router.push(`/visit/${rentalId}` as Href);
    else if (kind === "commute") router.push(`/rental/${rentalId}/edit`);
    else router.push(`/rental/${rentalId}`);
  };

  const confirmFreshSearch = () => {
    showDestructiveConfirm(
      "Empezar mi búsqueda",
      "Se borrarán las opciones de ejemplo y empezarás con una búsqueda vacía.",
      startFreshSearch,
    );
  };

  const applyOnboardingProfile = (profileId: PriorityProfileId) => {
    updatePriorities(getPriorityProfile(profileId).priorities);
  };

  const nextStepContent = showNextStepBlock ? (
    <>
      <Text variant="subtitle">Siguiente paso</Text>
      {hint ? (
        <View style={styles.actionBlock}>
          <Text variant="caption">{hint.title}</Text>
          <Text>{hint.body}</Text>
          {hint.actionRoute || hint.actionRentalId ? (
            <Button label={hint.actionLabel ?? "Continuar"} icon="arrow-forward-outline" onPress={openHint} />
          ) : null}
        </View>
      ) : null}
      {pendingTasks.length > 0 ? (
        <View style={styles.taskList}>
          {pendingTasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <View style={styles.taskCopy}>
                <View style={styles.taskHeader}>
                  <Badge label={task.kindLabel} tone={task.kind === "visit" ? "warning" : "neutral"} />
                  <Text variant="caption" numberOfLines={1}>
                    {task.title}
                  </Text>
                </View>
                <Text>{task.body}</Text>
              </View>
              <Button
                label={task.actionLabel}
                variant="secondary"
                onPress={() => openPendingTask(task.rentalId, task.kind)}
              />
            </View>
          ))}
        </View>
      ) : null}
    </>
  ) : null;

  return (
    <View style={styles.screenWrap}>
    <Screen testID="options-screen">
      <OnboardingModal
        visible={showOnboarding}
        step={onboardingStep}
        onNext={() => setOnboardingStep((s) => Math.min(s + 1, 1))}
        onComplete={completeOnboarding}
        onSkip={completeOnboarding}
        onStartFreshSearch={confirmFreshSearch}
        onApplyProfile={applyOnboardingProfile}
      />

      <View style={styles.topBar}>
        <EligrLogo size="sm" />
        {search.isPremium ? (
          <View style={[styles.planPill, styles.planPillPremium]}>
            <Text variant="caption" style={styles.planPillTextPremium}>
              Premium
            </Text>
          </View>
        ) : (
          <View style={styles.planPill}>
            <Text variant="caption">
              {activeCount}/{FREE_TIER_LIMITS.rentalOptions}
            </Text>
          </View>
        )}
      </View>

      {showSampleBanner ? (
        <Card variant="muted" style={styles.sampleBanner}>
          <Text variant="subtitle">Modo demo — datos de ejemplo</Text>
          <Text>
            Los 3 pisos de Madrid son una muestra. Cuando quieras comparar alquileres reales, empieza tu búsqueda o
            descarta el banner para seguir explorando.
          </Text>
          <View style={styles.sampleActions}>
            <Button label="Mi búsqueda" icon="home-outline" onPress={confirmFreshSearch} testID="sample-banner-fresh" />
            <Button label="Seguir con demo" variant="secondary" onPress={dismissSampleBanner} testID="sample-banner-dismiss" />
          </View>
        </Card>
      ) : null}

      {!showOnboarding ? (
        <AssistantPanel
          search={search}
          rentalOptions={rentalOptions}
          nextStep={nextStepContent}
          defaultCollapsed={activeCount >= 2}
        />
      ) : null}

      {chosenOption ? <ChosenOptionCard option={chosenOption} compact /> : null}

      {activeCount === 1 && !showOnboarding && !showSampleBanner ? (
        <Card variant="accent" style={styles.progressNudge} testID="options-add-second-nudge">
          <Text variant="subtitle">1 de 2 para comparar</Text>
          <Text>
            Con una sola opción el ranking es orientativo. Añade la segunda (pegar anuncio o rápido) y verás pros,
            contras y avisos de verdad.
          </Text>
          <View style={styles.nudgeActions}>
            <Button
              label="Añadir segunda"
              icon="clipboard-outline"
              onPress={() => router.push("/rental/new")}
              testID="options-add-second-button"
            />
            <Button label="Rápido" variant="secondary" icon="flash-outline" onPress={() => router.push("/rental/quick")} />
          </View>
        </Card>
      ) : null}

      {activeCount === 2 && !showOnboarding && !showSampleBanner ? (
        <Card variant="accent" style={styles.progressNudge} testID="options-ranking-nudge">
          <Text variant="subtitle">Ya puedes comparar</Text>
          <Text>Dos opciones activas: mira el ranking o compara lado a lado.</Text>
          <View style={styles.nudgeActions}>
            <Button label="Ver ranking" icon="podium-outline" onPress={() => router.push("/ranking")} />
            <Button label="Comparar dos" variant="secondary" icon="git-compare-outline" onPress={() => router.push("/compare")} />
          </View>
        </Card>
      ) : null}

      <Card variant="elevated" style={styles.searchCard}>
        <CollapsibleSection
          title="Búsqueda activa"
          detail={search.title}
          defaultOpen={activeCount < 2}
          testID="search-collapsible"
        >
          <View style={styles.searchHeader}>
            <View style={styles.searchIntro}>
              <View style={styles.searchTitleRow}>
                <Text variant="subtitle">{search.title}</Text>
                {moveInLabel ? <Badge label={moveInLabel} tone="warning" /> : null}
              </View>
              <Text variant="caption">{searchSummary}</Text>
              {searchNeedsSetup ? (
                <Text variant="caption" style={styles.setupHint}>
                  Falta ciudad o destino del trayecto. Edita la búsqueda para un ranking más fiable.
                </Text>
              ) : null}
              {estimatedCommuteCount > 0 ? (
                <Text variant="caption" style={styles.commuteNote}>
                  {estimatedCommuteCount} opción{estimatedCommuteCount === 1 ? "" : "es"} con trayecto estimado (~75
                  min). Edítalas para un ranking más fiable.
                </Text>
              ) : null}
            </View>
            <Button
              label="Editar"
              variant="secondary"
              icon="create-outline"
              onPress={() => router.push("/search/edit")}
              style={styles.editSearchButton}
            />
          </View>
          <View style={styles.searchStats}>
            <Stat styles={styles} value={String(filterCounts.active)} label="activas" />
            <Stat
              styles={styles}
              value={
                ranking[0] != null
                  ? ranking[0].score.orientative
                    ? "—"
                    : String(ranking[0].score.overallScore)
                  : "—"
              }
              label={ranking[0]?.score.orientative ? "puntuación orientativa" : "mejor puntuación"}
            />
            <Stat styles={styles} value={String(filterCounts.favorite)} label="favoritas" />
          </View>
        </CollapsibleSection>
      </Card>

      <ListFilterChips value={filter} counts={filterCounts} onChange={setFilter} />

      {displayList.length > 1 ? (
        <View style={styles.sortRow}>
          <Text variant="caption">Ordenar</Text>
          <ListSortChips value={sortMode} onChange={setSortMode} />
        </View>
      ) : null}

      {freeLimitReached ? <FreeLimitCard activeCount={activeCount} onViewDiscarded={() => setFilter("discarded")} /> : null}

      <View style={styles.rowBetween}>
        <SectionHeader
          title="Opciones guardadas"
          detail={
            freeLimitReached
              ? `Límite free: ${FREE_TIER_LIMITS.rentalOptions} opciones`
              : displayList.length > 0
                ? "Desliza a la izquierda: favorito o descartar"
                : "Pega un anuncio o usa el botón + flotante"
          }
        />
        <Button
          label="Añadir"
          icon="add-outline"
          onPress={() => router.push("/rental/new")}
          disabled={freeLimitReached}
          style={styles.addButton}
          testID="options-add-button"
        />
      </View>

      {displayList.length === 0 ? (
        <EmptyState
          testID={
            filter === "discarded"
              ? "options-empty-discarded"
              : filter === "favorite"
                ? "options-empty-favorite"
                : filter === "active"
                  ? "options-empty-active"
                  : "options-empty-all"
          }
          icon={filter === "active" || filter === "all" ? "home-outline" : "heart-outline"}
          title={
            filter === "discarded"
              ? "Sin descartadas"
              : filter === "favorite"
                ? "Sin favoritas"
                : filter === "active"
                  ? "Tu comparación empieza aquí"
                  : "Empieza con 3 opciones"
          }
          body={
            filter === "discarded"
              ? "Las opciones que descartes aparecerán aquí para consultarlas sin mezclarlas con las activas."
              : filter === "favorite"
                ? "Marca una opción como Favorito en su detalle para verla aquí."
                : filter === "active"
                  ? activeCount === 0
                    ? "Copia un anuncio de Idealista o WhatsApp y Eligr detecta precio y zona."
                    : "Pega anuncios o añade datos básicos. Con dos opciones ya verás un ranking útil."
                  : "Añade los alquileres que ya tienes en portales, chats o visitas para compararlos con criterio."
          }
          steps={
            filter === "discarded" || filter === "favorite"
              ? undefined
              : ["Pega o añade un anuncio", "Repite con otra opción", "Mira el ranking y decide"]
          }
          actions={
            filter === "discarded" || filter === "favorite"
              ? undefined
              : [
                  { label: "Pegar o añadir anuncio", onPress: () => router.push("/rental/new"), icon: "clipboard-outline", testID: "options-empty-paste" },
                ]
          }
        />
      ) : (
        <View style={styles.list}>
          {displayList.map(({ option, score }, index) => (
            <SwipeableRentalCard
              key={option.id}
              option={option}
              score={score}
              rank={filter !== "discarded" && sortMode === "score" ? index + 1 : undefined}
              maxBudget={search.maxBudget}
              compact
            />
          ))}
        </View>
      )}
    </Screen>
    {!showOnboarding && !freeLimitReached ? (
      <QuickAddFab onPress={() => router.push("/rental/quick")} />
    ) : null}
    </View>
  );
}

function Stat({ value, label, styles }: { value: string; label: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.stat}>
      <Text variant="subtitle">{value}</Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  screenWrap: {
    flex: 1,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  planPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  planPillPremium: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  planPillTextPremium: {
    color: colors.surface,
  },
  sampleBanner: {
    borderColor: colors.accentDeep,
    borderWidth: 1,
    gap: spacing.md,
  },
  sampleActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  progressNudge: {
    gap: spacing.sm,
  },
  nudgeActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  searchCard: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  commuteNote: {
    color: colors.warning,
  },
  setupHint: {
    color: colors.warning,
  },
  searchHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  searchIntro: {
    flex: 1,
    gap: spacing.xs,
  },
  searchTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  editSearchButton: {
    minWidth: 96,
  },
  searchStats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stat: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  rowBetween: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  addButton: {
    minWidth: 108,
    flexShrink: 0,
  },
  list: {
    gap: spacing.md,
  },
  sortRow: {
    gap: spacing.xs,
  },
  actionBlock: {
    gap: spacing.sm,
  },
  taskList: {
    gap: spacing.sm,
  },
  taskRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  taskCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  taskHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  });
}
