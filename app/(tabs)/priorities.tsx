import Slider from "@react-native-community/slider";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Pressable, StyleSheet, View } from "react-native";

import { AnimatedRankingRow } from "@/components/AnimatedRankingRow";
import { EmptyState } from "@/components/EmptyState";
import { PriorityProfileChips } from "@/components/PriorityProfileChips";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { getActiveOptions } from "@/domain/filters";
import { priorityLabels } from "@/domain/labels";
import { priorityHelpText } from "@/domain/priority-help";
import { priorityGroups } from "@/domain/priority-groups";
import { getPriorityProfile, PriorityProfileId } from "@/domain/priority-profiles";
import { defaultPriorities } from "@/domain/seed";
import { getScoreContext } from "@/domain/score-context";
import { rankRentals } from "@/domain/scoring";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { PriorityKey } from "@/domain/types";
import { usePrioritiesUiStore } from "@/store/prioritiesUiStore";
import { useEligrStore } from "@/store/useEligrStore";
import { showToast } from "@/store/toastStore";
import { confirmPrioritiesLeave } from "@/utils/priorities-guard";
import { configureRankingLayoutAnimation, rankingOrderKey } from "@/utils/list-layout-animation";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

const priorityOrder: PriorityKey[] = [
  "price",
  "moveInCost",
  "commute",
  "location",
  "safety",
  "roomQuality",
  "privacy",
  "billsIncluded",
  "availability",
  "personalFeeling",
];

export default function PrioritiesScreen() {
  const navigation = useNavigation();
  const search = useEligrStore((state) => state.search);
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const activeOptions = getActiveOptions(rentalOptions);
  const savedPriorities = search.priorities;
  const updatePriorities = useEligrStore((state) => state.updatePriorities);
  const setPrioritiesUi = usePrioritiesUiStore((state) => state.setPrioritiesUi);
  const clearPrioritiesUi = usePrioritiesUiStore((state) => state.clearPrioritiesUi);
  const chosenOptionId = useEligrStore((state) => state.appMeta.chosenOptionId);
  const chosenOption = rentalOptions.find((option) => option.id === chosenOptionId);
  const [draft, setDraft] = useState(savedPriorities);
  const [profileId, setProfileId] = useState<PriorityProfileId>("balanced");
  const debouncedDraft = useDebouncedValue(draft, 350);
  const isDirty = useMemo(
    () => priorityOrder.some((key) => draft[key] !== savedPriorities[key]),
    [draft, savedPriorities],
  );

  useEffect(() => {
    setDraft(savedPriorities);
  }, [savedPriorities]);

  useEffect(() => {
    setPrioritiesUi(draft, isDirty);
  }, [draft, isDirty, setPrioritiesUi]);

  useEffect(() => () => clearPrioritiesUi(), [clearPrioritiesUi]);

  usePreventRemove(isDirty, ({ data }) => {
    confirmPrioritiesLeave(() => navigation.dispatch(data.action));
  });

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isDirty) return false;
      confirmPrioritiesLeave(() => {
        if (navigation.canGoBack()) navigation.goBack();
      });
      return true;
    });
    return () => subscription.remove();
  }, [isDirty, navigation]);

  const openPreviewDetail = (rentalId: string) => {
    confirmPrioritiesLeave(() => router.push(`/rental/${rentalId}`));
  };

  const strongest = useMemo(
    () => [...priorityOrder].sort((a, b) => debouncedDraft[b] - debouncedDraft[a]).slice(0, 3),
    [debouncedDraft],
  );
  const previewRanking = useMemo(() => {
    const pool = getActiveOptions(rentalOptions);
    if (pool.length === 0) return [];
    return rankRentals(pool, debouncedDraft, getScoreContext(search)).slice(0, 3);
  }, [debouncedDraft, rentalOptions, search]);
  const previewOrder = useMemo(() => rankingOrderKey(previewRanking), [previewRanking]);
  const prevPreviewOrder = useRef(previewOrder);

  useEffect(() => {
    if (prevPreviewOrder.current !== previewOrder) {
      configureRankingLayoutAnimation();
      prevPreviewOrder.current = previewOrder;
    }
  }, [previewOrder]);

  const update = (key: PriorityKey, value: number) => {
    setDraft((current) => ({ ...current, [key]: Math.round(value) }));
  };

  const saveDraft = () => {
    updatePriorities(draft);
    clearPrioritiesUi();
    showToast(
      activeOptions.length >= 2
        ? "Prioridades guardadas. El ranking ya refleja estos pesos."
        : "Prioridades guardadas",
    );
  };

  const selectedProfile = getPriorityProfile(profileId);

  const applyProfile = (id: PriorityProfileId) => {
    setProfileId(id);
    setDraft(getPriorityProfile(id).priorities);
  };

  return (
    <Screen
      testID="priorities-screen"
      footer={
        <View style={styles.footer}>
          <Button
            label="Restablecer"
            variant="secondary"
            icon="refresh-outline"
            onPress={() => {
              setProfileId("balanced");
              setDraft(defaultPriorities);
            }}
            testID="priorities-reset-button"
          />
          <Button label="Guardar" icon="checkmark-outline" onPress={saveDraft} testID="priorities-save-button" />
        </View>
      }
    >
      <ScreenHeader
        eyebrow="Prioridades"
        title="Ajusta lo que pesa en la decisión."
        description={`El scoring usa estos pesos para ordenar las opciones. Lo más fuerte ahora: ${strongest
          .map((key) => priorityLabels[key])
          .join(", ")}.`}
      />

      <Card variant="muted" style={styles.weightHelp} testID="priorities-weight-help">
        <Text variant="subtitle">Cómo afectan los pesos</Text>
        <Text variant="caption">
          Cada criterio va de 0 a 10. A 0 no influye en la puntuación; a 10 puede decidir el orden entre opciones
          parecidas. No hace falta que sumen un total concreto: importa qué pesa más que el resto.
        </Text>
      </Card>

      <Card variant="accent" style={styles.profileCard} testID="priorities-profile-card">
        <PriorityProfileChips value={profileId} onChange={applyProfile} />
        <Text variant="caption" style={styles.profileHint}>
          Plantilla «{selectedProfile.label}»: {selectedProfile.description} Ajusta los sliders y pulsa Guardar para
          aplicarla al ranking.
        </Text>
      </Card>

      {isDirty ? (
        <Card variant="muted" testID="priorities-unsaved-banner">
          <Text variant="subtitle">Cambios sin guardar</Text>
          <Text variant="caption">Pulsa Guardar para aplicar estos pesos al ranking y la comparación.</Text>
        </Card>
      ) : null}

      {chosenOption && isDirty ? (
        <Card variant="muted">
          <Text variant="subtitle">Elección marcada</Text>
          <Text variant="caption">
            «{chosenOption.title}» sigue siendo tu favorita. Al guardar, el ranking puede cambiar pero tu elección se mantiene.
          </Text>
        </Card>
      ) : null}

      {activeOptions.length === 0 ? (
        <EmptyState
          testID="priorities-empty"
          title="Sin opciones activas"
          body="Añade alquileres para ver cómo cambia el ranking al mover los pesos."
          actions={[
            {
              label: "Añadir opción",
              onPress: () => router.push("/rental/new"),
              icon: "add-outline",
              testID: "priorities-empty-add",
            },
          ]}
        />
      ) : null}

      {activeOptions.length === 1 ? (
        <Card variant="accent" style={styles.singleOptionNudge} testID="priorities-single-option-nudge">
          <Text variant="subtitle">Ranking orientativo</Text>
          <Text>Con una sola opción los pesos aún no muestran tradeoffs claros. Añade otra para ver cómo cambia el orden.</Text>
          <View style={styles.nudgeActions}>
            <Button
              label="Añadir segunda"
              icon="clipboard-outline"
              onPress={() => router.push("/rental/new")}
              testID="priorities-add-second"
            />
            <Button
              label="Rápido"
              variant="secondary"
              icon="flash-outline"
              onPress={() => router.push("/rental/quick")}
              testID="priorities-quick-add"
            />
          </View>
        </Card>
      ) : null}

      {activeOptions.length >= 2 ? (
        <Card variant="accent" style={styles.rankingNudge} testID="priorities-ranking-nudge">
          <Text variant="subtitle">Ya puedes ver el impacto</Text>
          <Text>
            Con dos o más opciones, al mover los pesos cambia el orden. Guarda y abre el ranking para pros, contras y
            avisos completos.
          </Text>
          <View style={styles.nudgeActions}>
            <Button
              label="Ver ranking"
              icon="podium-outline"
              onPress={() => router.push("/ranking")}
              testID="priorities-go-ranking"
            />
            <Button
              label="Comparar dos"
              variant="secondary"
              icon="git-compare-outline"
              onPress={() => router.push("/compare")}
              testID="priorities-go-compare"
            />
          </View>
        </Card>
      ) : null}

      {previewRanking.length > 0 ? (
        <Card variant="muted" testID="priorities-preview">
          <Text variant="subtitle">Vista previa del ranking</Text>
          <Text variant="caption">{isDirty ? "Con estos pesos (sin guardar aún):" : "Con los pesos guardados:"}</Text>
          {previewRanking.map(({ option, score }, index) => (
            <AnimatedRankingRow key={option.id} optionId={option.id} rank={index + 1}>
              <Pressable
                onPress={() => openPreviewDetail(option.id)}
                accessibilityRole="button"
                accessibilityLabel={`${index + 1}. ${option.title}, ${score.overallScore} de 100. Ver detalle`}
                style={styles.previewRow}
                testID={`priorities-preview-row-${index + 1}`}
              >
                <Text>
                  {index + 1}. {option.title} — {score.overallScore}/100
                </Text>
              </Pressable>
            </AnimatedRankingRow>
          ))}
          {activeOptions.length >= 2 ? (
            <Button
              label="Ranking completo"
              variant="secondary"
              icon="arrow-forward-outline"
              onPress={() => router.push("/ranking")}
              testID="priorities-preview-ranking-link"
            />
          ) : null}
        </Card>
      ) : null}

      <SectionHeader title="Pesos de scoring" detail="0 no cuenta · 10 decide mucho" />

      {priorityGroups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text variant="label">{group.title}</Text>
          <View style={styles.list}>
            {group.keys.map((key) => (
              <PrioritySlider
                key={key}
                label={priorityLabels[key]}
                helpText={priorityHelpText[key]}
                value={draft[key]}
                onChange={(value) => update(key, value)}
              />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

function PrioritySlider({
  label,
  helpText,
  value,
  onChange,
}: {
  label: string;
  helpText: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { colors } = useThemeColors();

  return (
    <Card variant="muted">
      <View style={styles.row}>
        <Text variant="subtitle">{label}</Text>
        <View style={[styles.valuePill, { backgroundColor: colors.accentSoft }]}>
          <Text variant="subtitle">{value}</Text>
        </View>
      </View>
      <Text variant="caption">{helpText}</Text>
      <Slider
        minimumValue={0}
        maximumValue={10}
        step={1}
        value={value}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accentDeep}
        onValueChange={onChange}
        accessibilityLabel={`${label}, peso ${value}`}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  weightHelp: {
    gap: spacing.xs,
  },
  profileCard: {
    gap: spacing.sm,
  },
  profileHint: {
    opacity: 0.9,
  },
  group: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  valuePill: {
    borderRadius: 8,
    minWidth: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  previewRow: {
    paddingVertical: spacing.xs,
  },
  singleOptionNudge: {
    gap: spacing.sm,
  },
  rankingNudge: {
    gap: spacing.sm,
  },
  nudgeActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
