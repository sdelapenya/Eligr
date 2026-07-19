import { useMemo } from "react";
import { Href, router, useLocalSearchParams } from "expo-router";
import { normalizeRouteId } from "@/utils/route";
import { Linking, Image, StyleSheet, View } from "react-native";

import { ChosenOptionCard } from "@/components/ChosenOptionCard";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ScoreBar } from "@/components/ScoreBar";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusChipRow } from "@/components/StatusChipRow";
import { VisitChecklistSummaryCard, VisitQuickNotesCard } from "@/components/VisitChecklistCard";
import { PartnerOpinionCard } from "@/components/PartnerOpinionCard";
import { getBudgetFit, getBudgetFitLabel } from "@/domain/budget";
import { getScoringPool, getActiveOptions, isDiscarded } from "@/domain/filters";
import { priorityLabels, rentalTypeLabels, statusLabels } from "@/domain/labels";
import { buildVisitChecklistWhatsAppMessage, getVisitChecklistProgress, getVisitChecklistSummary } from "@/domain/visit-checklist";
import { getScoreContext } from "@/domain/score-context";
import { getMonthlyTotal, getMoveInCost, DEFAULT_COMMUTE_MINUTES, usesEstimatedCommute } from "@/domain/rental-costs";
import { scoreRental } from "@/domain/scoring";
import { RentalStatus } from "@/domain/types";
import { FREE_TIER_LIMITS, useEligrStore } from "@/store/useEligrStore";
import { showToast } from "@/store/toastStore";
import { showAlert, showDestructiveConfirm } from "@/utils/alert";
import { shareContent } from "@/utils/share-content";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export default function RentalDetailScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = normalizeRouteId(rawId);
  const search = useEligrStore((state) => state.search);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const option = rentalOptions.find((item) => item.id === id);
  const setStatus = useEligrStore((state) => state.setStatus);
  const setChosenOption = useEligrStore((state) => state.setChosenOption);
  const chosenOptionId = useEligrStore((state) => state.appMeta.chosenOptionId);
  const deleteRentalOption = useEligrStore((state) => state.deleteRentalOption);
  const updateVisitNotes = useEligrStore((state) => state.updateVisitNotes);

  if (!option) {
    return (
      <Screen testID="rental-detail-not-found">
        <Card>
          <Text variant="subtitle">Opción no encontrada</Text>
          <Text>Puede que se haya eliminado o que el enlace esté desactualizado.</Text>
          <Button label="Volver" icon="arrow-back-outline" onPress={() => router.back()} testID="rental-detail-back" />
        </Card>
      </Screen>
    );
  }

  const scorePool = getScoringPool(rentalOptions);
  const score = scoreRental(option, scorePool, search.priorities, getScoreContext(search));
  const budgetFit = getBudgetFit(option, search.maxBudget);
  const scoreColor = score.overallScore >= 75 ? colors.scoreHigh : score.overallScore >= 55 ? colors.scoreMid : colors.warning;
  const visitSummary = getVisitChecklistSummary(option.visitChecklist);
  const visitSectionOpen =
    option.status === "visit_planned" ||
    option.status === "visited" ||
    Boolean(option.visitImpression?.trim()) ||
    Boolean(option.visitNextAction?.trim()) ||
    getVisitChecklistProgress(option.visitChecklist).reviewed > 0;
  const otherOptions = rentalOptions.filter((item) => item.id !== option.id);
  const activeOthers = getActiveOptions(otherOptions);
  const activeCount = getActiveOptions(rentalOptions).length;
  const isChosen = chosenOptionId === option.id;
  const estimatedCommute = usesEstimatedCommute(option);
  const visitProgress = getVisitChecklistProgress(option.visitChecklist);
  const needsVisitNudge =
    !option.visitImpression?.trim() && visitProgress.reviewed === 0 && option.status !== "discarded";
  const showRankingNudge = activeCount >= 2 && !chosenOptionId && !isChosen;

  const remove = () => {
    showDestructiveConfirm("Eliminar opción", "Se quitará de esta comparación local.", () => {
      deleteRentalOption(option.id);
      router.back();
    });
  };

  const handleStatusChange = (status: RentalStatus) => {
    const ok = setStatus(option.id, status);
    if (!ok) {
      showAlert(
        "Límite alcanzado",
        `El plan free permite ${FREE_TIER_LIMITS.rentalOptions} opciones activas. Descarta alguna o activa premium.`,
      );
    }
  };

  const markAsChoice = () => {
    const ok = setChosenOption(option.id);
    if (ok) {
      showToast("Marcada como tu elección. Abre «Resumen completo» para compartirla.");
      return;
    }
    if (isDiscarded(option)) {
      showAlert("No disponible", "No puedes elegir una opción descartada. Reactívala primero.");
      return;
    }
    showAlert(
      "Límite alcanzado",
      `El plan free permite ${FREE_TIER_LIMITS.rentalOptions} opciones activas. Descarta alguna o activa premium.`,
    );
  };

  return (
    <Screen testID="rental-detail-screen">
      <ScreenHeader
        eyebrow={`Detalle · ${rentalTypeLabels[option.rentalType]}`}
        title={option.title}
        description={`${option.locationLabel} · ${statusLabels[option.status]}`}
      />
      <Button
        label="Volver"
        variant="ghost"
        icon="arrow-back-outline"
        onPress={() => router.back()}
        testID="rental-detail-back"
      />

      {option.photoUri ? (
        <Image source={{ uri: option.photoUri }} style={styles.photoHero} resizeMode="cover" accessibilityLabel={`Foto de ${option.title}`} />
      ) : null}

      {isChosen ? (
        <ChosenOptionCard option={option} />
      ) : (
        <Card variant="accent" testID="rental-detail-choice-nudge">
          <Text variant="subtitle">¿Es tu elección final?</Text>
          <Text>
            Marca este alquiler cuando hayas decidido. Se guardará como favorito y podrás compartir un resumen con pros,
            contras y notas de visita.
          </Text>
          <Button label="Esta es mi elección" icon="heart-outline" onPress={markAsChoice} testID="mark-choice-button" />
        </Card>
      )}

      {estimatedCommute ? (
        <Card variant="accent" style={styles.nudge} testID="rental-detail-commute-nudge">
          <Text variant="subtitle">Trayecto estimado en el scoring</Text>
          <Text>
            Indica los minutos reales hasta tu destino. Sin ellos, Eligr asume ~{DEFAULT_COMMUTE_MINUTES} min y la
            puntuación es menos fiable.
          </Text>
          <Button
            label="Editar trayecto"
            variant="secondary"
            icon="create-outline"
            onPress={() => router.push(`/rental/${option.id}/edit`)}
            testID="rental-detail-edit-commute"
          />
        </Card>
      ) : null}

      {needsVisitNudge ? (
        <Card variant="accent" style={styles.nudge} testID="rental-detail-visit-nudge">
          <Text variant="subtitle">¿Ya la visitaste?</Text>
          <Text>Registra impresión y checklist en el asistente. El resumen de decisión quedará más completo.</Text>
          <Button
            label="Asistente de visita"
            variant="secondary"
            icon="footsteps-outline"
            onPress={() => router.push(`/visit/${option.id}` as Href)}
            testID="rental-detail-visit-link"
          />
        </Card>
      ) : null}

      {showRankingNudge ? (
        <Card variant="muted" style={styles.nudge} testID="rental-detail-ranking-nudge">
          <Text variant="subtitle">¿Cuál te encaja más?</Text>
          <Text>Compara con otra opción o revisa el ranking antes de marcar tu elección final.</Text>
          <View style={styles.nudgeActions}>
            {activeOthers.length > 0 ? (
              <Button
                label="Comparar con otra"
                variant="secondary"
                icon="git-compare-outline"
                onPress={() =>
                  router.push({ pathname: "/compare", params: { a: option.id, b: activeOthers[0].id } })
                }
                testID="rental-detail-compare-nudge"
              />
            ) : null}
            <Button
              label="Ver ranking"
              icon="podium-outline"
              onPress={() => router.push("/ranking")}
              testID="rental-detail-ranking-link"
            />
          </View>
        </Card>
      ) : null}

      {isChosen ? (
        <Card variant="accent" style={styles.nudge} testID="rental-detail-decision-nudge">
          <Text variant="subtitle">Comparte tu decisión</Text>
          <Text>Genera un resumen con imagen, texto o informe HTML para enviarlo o imprimirlo.</Text>
          <Button
            label="Resumen de decisión"
            icon="document-text-outline"
            onPress={() => router.push("/decision" as Href)}
            testID="rental-detail-decision-button"
          />
        </Card>
      ) : null}

      <View style={styles.badges}>
        {budgetFit !== "under" ? <Badge label={getBudgetFitLabel(budgetFit)} tone={budgetFit === "over" ? "warning" : "neutral"} /> : null}
        {score.badges.map((badge) => (
          <Badge
            key={badge}
            label={badge}
            tone={badge === "Revisar" ? "warning" : badge === "Orientativo" ? "neutral" : "good"}
          />
        ))}
      </View>

      <Card style={{ ...styles.scoreHero, borderColor: score.orientative ? colors.border : scoreColor }}>
        <View style={styles.scoreHeroTop}>
          <View>
            <Text variant="caption">{score.orientative ? "Puntuación orientativa" : "Puntuación total"}</Text>
            <Text variant="title" style={{ color: score.orientative ? colors.muted : scoreColor }}>
              {score.orientative ? "—" : `${score.overallScore}/100`}
            </Text>
          </View>
          <View style={styles.metricCol}>
            <Text variant="caption">Mensual</Text>
            <Text variant="subtitle">{getMonthlyTotal(option)} €</Text>
          </View>
          <View style={styles.metricCol}>
            <Text variant="caption">Desembolso inicial</Text>
            <Text variant="subtitle">{getMoveInCost(option)} €</Text>
          </View>
        </View>
        <Text>{score.explanation}</Text>
        {estimatedCommute ? (
          <Badge label="Trayecto estimado en el scoring" tone="warning" />
        ) : (
          <Text variant="caption">Trayecto: {option.commuteMinutes} min · {visitSummary}</Text>
        )}
        {estimatedCommute ? <Text variant="caption">{visitSummary}</Text> : null}
      </Card>

      <CollapsibleSection
        title="Visita"
        detail={
          getVisitChecklistProgress(option.visitChecklist).reviewed === 0
            ? "Marca el checklist en el asistente"
            : "Checklist, asistente y notas rápidas"
        }
        testID="rental-visit-section"
        defaultOpen={visitSectionOpen}
      >
        <View style={styles.visitActions}>
          <Button
            label="Registrar visita con asistente"
            icon="footsteps-outline"
            onPress={() => router.push(`/visit/${option.id}` as Href)}
            testID="visit-register-assistant-button"
          />
          <Button
            label="Mensaje al casero"
            variant="secondary"
            icon="logo-whatsapp"
            onPress={() => shareContent({ message: buildVisitChecklistWhatsAppMessage(option.title) })}
          />
        </View>

        <VisitChecklistSummaryCard
          checklist={option.visitChecklist}
          onOpenAssistant={() => router.push(`/visit/${option.id}` as Href)}
        />

        <VisitQuickNotesCard
          visitImpression={option.visitImpression}
          visitNextAction={option.visitNextAction}
          onChangeImpression={(value) => updateVisitNotes(option.id, { visitImpression: value })}
          onChangeNextAction={(value) => updateVisitNotes(option.id, { visitNextAction: value })}
        />
      </CollapsibleSection>

      <PartnerOpinionCard option={option} />

      <SectionHeader title="Estado" detail="Marca el avance de la decisión" />
      <StatusChipRow value={option.status} onChange={handleStatusChange} />

      <CollapsibleSection title="Desglose y análisis" detail="Criterio 0–100 y puntos que aporta al total">
        <Card>
          <Text variant="caption" style={{ marginBottom: 8 }}>
            La barra es la nota del criterio (0–100). A la derecha ves cuánto aporta al score según tus prioridades.
          </Text>
          {Object.entries(score.breakdown).map(([key, raw]) => {
            const weighted = score.weightedBreakdown[key as keyof typeof score.weightedBreakdown] ?? 0;
            return (
              <ScoreBar
                key={key}
                label={priorityLabels[key as keyof typeof priorityLabels]}
                value={raw}
                max={100}
                detail={`${raw} → +${weighted} pts`}
              />
            );
          })}
        </Card>

        <View style={styles.columns}>
          <InfoList styles={styles} title="Pros" items={score.pros} empty="Sin pros claros todavía." />
          <InfoList styles={styles} title="Contras" items={score.cons} empty="Sin contras fuertes." />
          <InfoList styles={styles} title="Avisos" items={score.warnings} empty="Sin avisos importantes." warning />
        </View>
      </CollapsibleSection>

      {option.notes ? (
        <Card variant="muted">
          <Text variant="subtitle">Notas generales</Text>
          <Text>{option.notes}</Text>
        </Card>
      ) : null}

      {option.sourceUrl ? (
        <Button
          label="Abrir anuncio"
          variant="secondary"
          icon="link-outline"
          onPress={async () => {
            const url = option.sourceUrl?.trim();
            if (!url) return;
            try {
              const supported = await Linking.canOpenURL(url);
              if (!supported) {
                showAlert("Enlace no válido", "No se pudo abrir esta URL en el dispositivo.");
                return;
              }
              await Linking.openURL(url);
            } catch {
              showAlert("Error", "No se pudo abrir el anuncio.");
            }
          }}
        />
      ) : null}

      <View style={styles.actions}>
        {activeOthers.length > 0 ? (
          <Button
            label="Comparar con otra"
            variant="secondary"
            icon="git-compare-outline"
            onPress={() => router.push({ pathname: "/compare", params: { a: option.id, b: activeOthers[0].id } })}
            testID="rental-detail-compare-button"
          />
        ) : activeCount < 2 ? (
          <Button
            label="Añadir otra para comparar"
            variant="secondary"
            icon="add-outline"
            onPress={() => router.push("/rental/new")}
            testID="rental-detail-add-second-button"
          />
        ) : null}
        <Button
          label="Editar"
          icon="create-outline"
          onPress={() => router.push(`/rental/${option.id}/edit`)}
          testID="rental-detail-edit-button"
        />
        <Button label="Eliminar" icon="trash-outline" variant="danger" onPress={remove} />
      </View>
    </Screen>
  );
}

function InfoList({
  styles,
  title,
  items,
  empty,
  warning,
}: {
  styles: ReturnType<typeof createStyles>;
  title: string;
  items: string[];
  empty: string;
  warning?: boolean;
}) {
  return (
    <Card>
      <Text variant="subtitle">{title}</Text>
      {(items.length ? items : [empty]).map((item, index) => (
        <View key={`${title}-${index}`} style={styles.infoRow}>
          <View style={[styles.dot, warning && styles.warningDot]} />
          <Text>{item}</Text>
        </View>
      ))}
    </Card>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  photoHero: {
    borderRadius: radius.lg,
    height: 200,
    width: "100%",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  scoreHero: {
    borderWidth: 2,
    gap: spacing.md,
  },
  scoreHeroTop: {
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
  },
  metricCol: {
    gap: spacing.xs,
  },
  columns: {
    gap: spacing.md,
  },
  infoRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  dot: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm / 2,
    height: 8,
    marginTop: 7,
    width: 8,
  },
  warningDot: {
    backgroundColor: colors.warning,
  },
  visitActions: {
    gap: spacing.sm,
  },
  nudge: {
    gap: spacing.sm,
  },
  nudgeActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  });
}
