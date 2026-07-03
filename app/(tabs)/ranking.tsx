import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ChosenOptionCard } from "@/components/ChosenOptionCard";
import { AnimatedRankingRow } from "@/components/AnimatedRankingRow";
import { EmptyState } from "@/components/EmptyState";
import { RankingShareCard } from "@/components/RankingShareCard";
import { RentalCard } from "@/components/RentalCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { getActiveOptions, getScoringPool } from "@/domain/filters";
import { priorityLabels } from "@/domain/labels";
import { getQuickPickAccent, getQuickPickIcon, getQuickPickSubtitle, QuickPickKind } from "@/domain/quick-picks";
import { effectiveCommuteMinutes, getMonthlyTotal } from "@/domain/rental-costs";
import { getScoreContext } from "@/domain/score-context";
import { getTopScoreContributions } from "@/domain/score-breakdown";
import { buildRankingShareSummary } from "@/domain/summary";
import { buildRankingReportHtml } from "@/domain/report-html";
import { rankRentals } from "@/domain/scoring";
import { useEligrStore } from "@/store/useEligrStore";
import { showAlert } from "@/utils/alert";
import { shareCollaborationPack } from "@/utils/share-collaboration";
import { shareContent } from "@/utils/share-content";
import { shareHtmlReport } from "@/utils/share-report";
import { shareViewCapture } from "@/utils/share-view-image";
import { configureRankingLayoutAnimation, rankingOrderKey } from "@/utils/list-layout-animation";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { radius, spacing, ColorPalette } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export default function RankingScreen() {
  const { colors } = useThemeColors();
  const search = useEligrStore((state) => state.search);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const exportBackupJson = useEligrStore((state) => state.exportBackupJson);
  const chosenOptionId = useEligrStore((state) => state.appMeta.chosenOptionId);
  const chosenOption = rentalOptions.find((option) => option.id === chosenOptionId);
  const activeOptions = useMemo(() => getActiveOptions(rentalOptions), [rentalOptions]);
  const pool = useMemo(() => getScoringPool(rentalOptions), [rentalOptions]);
  const scoreContext = getScoreContext(search);
  const ranking = useMemo(
    () => (activeOptions.length > 0 ? rankRentals(pool, search.priorities, scoreContext) : []),
    [activeOptions.length, pool, search.priorities, scoreContext],
  );
  const best = ranking[0];
  const discardedCount = rentalOptions.length - activeOptions.length;
  const shareCardRef = useRef<View>(null);
  const shareLimit = search.isPremium ? ranking.length : 3;
  const rankingOrder = useMemo(() => rankingOrderKey(ranking), [ranking]);
  const prevRankingOrder = useRef(rankingOrder);

  useEffect(() => {
    if (prevRankingOrder.current !== rankingOrder) {
      configureRankingLayoutAnimation();
      prevRankingOrder.current = rankingOrder;
    }
  }, [rankingOrder]);

  const quickPicks = useMemo(() => {
    if (!ranking.length) return [];
    const cheapest = ranking.reduce(
      (current, item) => (getMonthlyTotal(item.option) < getMonthlyTotal(current.option) ? item : current),
      ranking[0],
    );
    const lowRisk = ranking.reduce(
      (current, item) => (item.score.warnings.length < current.score.warnings.length ? item : current),
      ranking[0],
    );
    const fastest = ranking.reduce(
      (current, item) =>
        effectiveCommuteMinutes(item.option) < effectiveCommuteMinutes(current.option) ? item : current,
      ranking[0],
    );

    const candidates: { title: string; kind: QuickPickKind; item: (typeof ranking)[number] }[] = [
      { title: "Mejor global", kind: "best", item: best! },
      { title: "Más barato", kind: "cheapest", item: cheapest },
      { title: "Menos alertas", kind: "lowRisk", item: lowRisk },
      { title: "Trayecto corto", kind: "fastest", item: fastest },
    ];

    const seen = new Set<string>();
    return candidates.filter(({ item }) => {
      if (!item || seen.has(item.option.id)) return false;
      seen.add(item.option.id);
      return true;
    });
  }, [ranking, best]);

  const shareSummary = async () => {
    if (!ranking.length) return;
    const limit = search.isPremium ? ranking.length : 3;
    await shareContent({ message: buildRankingShareSummary(search, ranking, limit) });
  };

  const exportReport = async () => {
    if (!ranking.length) return;
    const limit = search.isPremium ? ranking.length : 3;
    const html = buildRankingReportHtml(search, ranking.slice(0, limit));
    const result = await shareHtmlReport(html, "eligr-ranking");
    if (result === "unavailable") {
      showAlert("No disponible", "Tu dispositivo no permite compartir el informe. Prueba en un build de desarrollo.");
    } else if (result === "error") {
      showAlert("Error", "No se pudo exportar el informe. Inténtalo de nuevo.");
    }
  };

  const shareImage = async () => {
    if (!ranking.length) return;
    const result = await shareViewCapture(shareCardRef, "Top Eligr");
    if (result === "unavailable") {
      showAlert("No disponible", "Compartir imagen no está disponible aquí. Usa captura de pantalla o comparte texto.");
    } else if (result === "error") {
      showAlert("Error", "No se pudo generar la imagen. Inténtalo de nuevo.");
    }
  };

  const inviteToCompare = async () => {
    await shareCollaborationPack(search, exportBackupJson);
  };

  const searchNeedsSetup = search.city === "Por definir" || search.destinationLabel === "Por definir";

  return (
    <Screen testID="ranking-screen">
      <ScreenHeader
        eyebrow="Ranking explicado"
        title="La mejor opción depende de tus prioridades."
        description={discardedCount > 0 ? `${discardedCount} descartada${discardedCount === 1 ? "" : "s"} fuera del ranking activo.` : undefined}
      />

      {chosenOption ? <ChosenOptionCard option={chosenOption} compact /> : null}

      {searchNeedsSetup && ranking.length > 0 ? (
        <Card variant="muted" testID="ranking-search-setup-hint">
          <Text variant="subtitle">Búsqueda incompleta</Text>
          <Text variant="caption">
            Falta ciudad o destino del trayecto. Edita la búsqueda para un ranking y scoring más fiables.
          </Text>
          <Button
            label="Editar búsqueda"
            variant="secondary"
            icon="create-outline"
            onPress={() => router.push("/search/edit")}
            testID="ranking-edit-search"
          />
        </Card>
      ) : null}

      {activeOptions.length === 1 ? (
        <Card variant="accent" style={styles.singleOptionCard} testID="ranking-single-option-nudge">
          <Text variant="subtitle">Ranking orientativo</Text>
          <Text>Con una sola opción activa las puntuaciones son aproximadas. Añade otra para comparar de verdad.</Text>
          <View style={styles.singleOptionActions}>
            <Button
              label="Añadir segunda"
              icon="clipboard-outline"
              onPress={() => router.push("/rental/new")}
              testID="ranking-add-second"
            />
            <Button
              label="Rápido"
              variant="secondary"
              icon="flash-outline"
              onPress={() => router.push("/rental/quick")}
              testID="ranking-quick-add"
            />
          </View>
        </Card>
      ) : null}

      {activeOptions.length === 2 ? (
        <Card variant="accent" style={styles.twoOptionNudge} testID="ranking-compare-nudge">
          <Text variant="subtitle">Dos opciones, ranking fiable</Text>
          <Text>Compara tradeoffs lado a lado o comparte el top con quien decida contigo.</Text>
          <View style={styles.singleOptionActions}>
            <Button
              label="Comparar dos"
              icon="git-compare-outline"
              onPress={() =>
                router.push({
                  pathname: "/compare",
                  params: { a: ranking[0]?.option.id, b: ranking[1]?.option.id },
                })
              }
              testID="ranking-go-compare"
            />
            <Button
              label="Compartir top"
              variant="secondary"
              icon="share-outline"
              onPress={shareSummary}
              testID="ranking-nudge-share"
            />
          </View>
        </Card>
      ) : null}

      {activeOptions.length >= 3 && !chosenOption ? (
        <Card variant="accent" style={styles.chooseNudge} testID="ranking-choose-nudge">
          <Text variant="subtitle">¿Ya tienes favorita?</Text>
          <Text>
            Visita los mejores del ranking y marca «Esta es mi elección» en el detalle para generar un resumen
            compartible.
          </Text>
          <View style={styles.singleOptionActions}>
            {best ? (
              <Button
                label="Ver detalle del top"
                icon="open-outline"
                onPress={() => router.push(`/rental/${best.option.id}`)}
                testID="ranking-view-top"
              />
            ) : null}
            <Button
              label="Registrar visita"
              variant="secondary"
              icon="walk-outline"
              onPress={() => router.push("/visit")}
              testID="ranking-go-visit"
            />
          </View>
        </Card>
      ) : null}

      {ranking.length >= 2 ? (
        <Card variant="muted" style={styles.prioritiesHint} testID="ranking-priorities-nudge">
          <Text variant="subtitle">¿El orden no encaja?</Text>
          <Text variant="caption">
            Ajusta los pesos en Prioridades y el ranking se recalcula con pros, contras y avisos explicados.
          </Text>
          <Button
            label="Ajustar prioridades"
            variant="secondary"
            icon="options-outline"
            onPress={() => router.push("/priorities")}
            testID="ranking-go-priorities"
          />
        </Card>
      ) : null}

      {ranking.length > 0 ? (
        <>
          <RankingShareCard ref={shareCardRef} search={search} ranking={ranking} limit={shareLimit} />
          <Text variant="caption" style={{ color: colors.muted, textAlign: "center" }}>
            Comparte la imagen del top 3 a WhatsApp o Stories, o usa el resumen en texto.
          </Text>
        </>
      ) : null}

      <View style={styles.actions}>
        {ranking.length >= 2 ? (
          <Button
            label="Comparar dos"
            variant="secondary"
            icon="git-compare-outline"
            onPress={() =>
              router.push({
                pathname: "/compare",
                params: { a: ranking[0]?.option.id, b: ranking[1]?.option.id },
              })
            }
            testID="ranking-compare-button"
          />
        ) : null}
        {ranking.length > 0 ? (
          <Button
            label="Invitar a comparar"
            variant="secondary"
            icon="people-outline"
            onPress={inviteToCompare}
            testID="ranking-invite-button"
          />
        ) : null}
        {ranking.length > 0 ? (
          <Button
            label="Compartir imagen"
            variant="secondary"
            icon="image-outline"
            onPress={shareImage}
            testID="ranking-share-image-button"
          />
        ) : null}
        {ranking.length > 0 ? (
          <Button
            label="Compartir top"
            variant="secondary"
            icon="share-outline"
            onPress={shareSummary}
            testID="ranking-share-button"
          />
        ) : null}
        {ranking.length > 0 ? (
          <Button
            label="Exportar informe"
            variant="secondary"
            icon="document-text-outline"
            onPress={exportReport}
            testID="ranking-export-button"
          />
        ) : null}
      </View>

      {best ? (
        <>
          <Card variant="elevated" style={styles.recommendationCard} testID="ranking-top-recommendation">
            <View style={styles.row}>
              <View style={styles.recommendationTitle}>
                <Text variant="label">Recomendación</Text>
                <Text variant="subtitle">Mejor opción ahora</Text>
              </View>
              <View style={styles.badgeRow}>
                {best.score.orientative ? <Badge label="Orientativo" tone="neutral" /> : null}
                <Badge
                  label={best.score.orientative ? "—/100" : `${best.score.overallScore}/100`}
                  tone={best.score.orientative ? "neutral" : "good"}
                />
              </View>
            </View>
            <Text>{best.score.explanation}</Text>
            <View style={styles.singleOptionActions}>
              <Button
                label="Ver detalle"
                icon="open-outline"
                onPress={() => router.push(`/rental/${best.option.id}`)}
                testID="ranking-top-detail"
              />
              {chosenOptionId === best.option.id ? (
                <Button
                  label="Resumen de decisión"
                  variant="secondary"
                  icon="document-text-outline"
                  onPress={() => router.push("/decision")}
                  testID="ranking-go-decision"
                />
              ) : null}
            </View>
          </Card>

          {quickPicks.length > 1 ? (
            <View style={styles.quickGrid}>
              {quickPicks.map(({ title, kind, item }) => (
                <QuickPick
                  key={title}
                  kind={kind}
                  colors={colors}
                  title={title}
                  subtitle={getQuickPickSubtitle(kind, item)}
                  value={item.option.title}
                  onPress={() => router.push(`/rental/${item.option.id}`)}
                />
              ))}
            </View>
          ) : null}

          <SectionHeader
            title="Ranking activo"
            detail={`Pesos fuertes: ${Object.entries(search.priorities)
              .filter(([, value]) => value >= 8)
              .map(([key]) => priorityLabels[key as keyof typeof priorityLabels])
              .join(", ") || "ninguno marcado"}`}
          />

          <View style={styles.list}>
            {ranking.map(({ option, score }, index) => (
              <AnimatedRankingRow key={option.id} optionId={option.id} rank={index + 1}>
                <RentalCard
                  option={option}
                  score={score}
                  rank={index + 1}
                  maxBudget={search.maxBudget}
                  scoreContributions={getTopScoreContributions(score)}
                />
              </AnimatedRankingRow>
            ))}
          </View>
        </>
      ) : (
        <EmptyState
          icon="podium-outline"
          title="Aún no hay opciones activas"
          body="Pega un anuncio o añade alquileres. Con dos opciones activas el ranking ya tiene sentido."
          steps={["Pega o añade un anuncio", "Añade una segunda opción", "Revisa pros, contras y avisos aquí"]}
          testID="ranking-empty"
          actions={[
            {
              label: "Pegar anuncio",
              onPress: () => router.push("/rental/new"),
              icon: "clipboard-outline",
              testID: "ranking-empty-paste",
            },
            {
              label: "Añadir rápido",
              onPress: () => router.push("/rental/quick"),
              variant: "secondary",
              icon: "flash-outline",
              testID: "ranking-empty-quick",
            },
          ]}
        />
      )}
    </Screen>
  );
}

function QuickPick({
  kind,
  colors,
  title,
  subtitle,
  value,
  onPress,
}: {
  kind: QuickPickKind;
  colors: ColorPalette;
  title: string;
  subtitle: string;
  value: string;
  onPress: () => void;
}) {
  const accent = getQuickPickAccent(kind, colors);
  const icon = getQuickPickIcon(kind);

  return (
    <Pressable onPress={onPress} style={styles.quickPickPressable} accessibilityRole="button" accessibilityLabel={`${title}: ${value}. ${subtitle}`}>
      <Card variant="muted" style={styles.quickPick}>
        <View style={styles.quickPickHeader}>
          <View style={[styles.quickPickIcon, { backgroundColor: accent.bg }]}>
            <Ionicons name={icon} size={16} color={accent.icon} />
          </View>
          <Text variant="caption">{title}</Text>
        </View>
        <Text numberOfLines={2}>{value}</Text>
        <Text variant="caption">{subtitle}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chooseNudge: {
    gap: spacing.sm,
  },
  prioritiesHint: {
    gap: spacing.sm,
  },
  twoOptionNudge: {
    gap: spacing.sm,
  },
  singleOptionCard: {
    gap: spacing.sm,
  },
  singleOptionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  recommendationCard: {
    borderColor: "transparent",
    gap: spacing.md,
  },
  recommendationTitle: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickPickPressable: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 148,
  },
  quickPick: {
    gap: spacing.xs,
  },
  quickPickHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickPickIcon: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  list: {
    gap: spacing.md,
  },
});
