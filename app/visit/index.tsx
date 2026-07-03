import { Href, router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { getVisitDebriefCandidates } from "@/domain/assistant-journey";
import { getActiveOptions } from "@/domain/filters";
import { rentalTypeLabels, statusLabels } from "@/domain/labels";
import { RentalOption } from "@/domain/types";
import { useEligrStore } from "@/store/useEligrStore";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { ColorPalette, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

function isPlannedVisit(option: RentalOption) {
  return option.status === "visit_planned" || option.status === "contacted";
}

export default function VisitPickScreen() {
  const rentalOptions = useEligrStore((state) => state.rentalOptions);
  const active = getActiveOptions(rentalOptions);
  const candidates = getVisitDebriefCandidates(rentalOptions);
  const planned = useMemo(() => candidates.filter(isPlannedVisit), [candidates]);
  const others = useMemo(() => candidates.filter((option) => !isPlannedVisit(option)), [candidates]);
  const topTwo = active.slice(0, 2);

  return (
    <Screen testID="visit-pick-screen">
      <ScreenHeader
        eyebrow="Post-visita"
        title="¿Qué piso acabas de ver?"
        description="En menos de un minuto: checklist, impresión y próximo paso para actualizar tu comparación."
      />
      <Button
        label="Volver"
        variant="ghost"
        icon="arrow-back-outline"
        onPress={() => router.back()}
        testID="visit-pick-back"
      />

      {active.length === 1 ? (
        <Card variant="accent" style={styles.singleHint} testID="visit-add-second-nudge">
          <Text variant="subtitle">Un piso en comparación</Text>
          <Text>
            Registra la visita y, cuando puedas, añade otra opción para ver tradeoffs en el ranking.
          </Text>
          <View style={styles.nudgeActions}>
            <Button label="Añadir segunda" icon="clipboard-outline" onPress={() => router.push("/rental/new")} />
            <Button
              label="Añadir rápido"
              variant="secondary"
              icon="flash-outline"
              onPress={() => router.push("/rental/quick")}
              testID="visit-add-second-quick"
            />
          </View>
        </Card>
      ) : null}

      {active.length === 2 ? (
        <Card variant="accent" style={styles.singleHint} testID="visit-compare-nudge">
          <Text variant="subtitle">Dos opciones activas</Text>
          <Text>Tras registrar la visita, compara tradeoffs lado a lado con la otra opción.</Text>
          <Button
            label="Comparar dos"
            variant="secondary"
            icon="git-compare-outline"
            testID="visit-compare-two"
            onPress={() =>
              router.push({
                pathname: "/compare",
                params: { a: topTwo[0]?.id, b: topTwo[1]?.id },
              })
            }
          />
        </Card>
      ) : null}

      {active.length === 0 ? (
        <EmptyState
          icon="walk-outline"
          title="Sin opciones activas"
          body="Pega un anuncio o añade un alquiler antes de registrar la visita."
          steps={["Pega o añade un piso", "Marca visita planificada en el detalle", "Registra impresión aquí"]}
          testID="visit-empty-state"
          actions={[
            {
              label: "Pegar anuncio",
              onPress: () => router.push("/rental/new"),
              icon: "clipboard-outline",
              testID: "visit-empty-paste",
            },
            {
              label: "Añadir rápido",
              onPress: () => router.push("/rental/quick"),
              variant: "secondary",
              icon: "flash-outline",
              testID: "visit-empty-quick",
            },
          ]}
        />
      ) : planned.length === 0 ? (
        <Card variant="muted" testID="visit-no-planned-hint">
          <Text variant="subtitle">Ninguna visita planificada</Text>
          <Text>
            Marca una opción como «Visita planificada» o «Contactado» en su ficha, o elige cualquiera abajo si acabas de
            salir de una visita.
          </Text>
        </Card>
      ) : null}

      {planned.length > 0 ? (
        <>
          <SectionHeader title="Planificadas" detail="Visitas o contactos pendientes de registrar" />
          <View style={styles.list}>
            {planned.map((option) => (
              <VisitPickCard key={option.id} option={option} />
            ))}
          </View>
        </>
      ) : null}

      {others.length > 0 ? (
        <>
          <SectionHeader title="Otras" detail="Resto de opciones activas" />
          <View style={styles.list}>
            {others.map((option) => (
              <VisitPickCard key={option.id} option={option} />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function VisitPickCard({ option }: { option: RentalOption }) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createCardStyles(colors), [colors]);

  return (
    <Pressable
      onPress={() => router.push(`/visit/${option.id}` as Href)}
      testID={`visit-pick-${option.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Registrar visita de ${option.title}`}
    >
      <Card style={styles.pickCard}>
        <Text variant="subtitle">{option.title}</Text>
        <Text variant="caption">
          {rentalTypeLabels[option.rentalType]} · {option.locationLabel} · {statusLabels[option.status]}
        </Text>
        <Text variant="caption" style={styles.cta}>
          Registrar visita →
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  singleHint: {
    gap: spacing.sm,
  },
  nudgeActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});

function createCardStyles(colors: ColorPalette) {
  return StyleSheet.create({
    pickCard: {
      gap: spacing.xs,
    },
    cta: {
      color: colors.accentDeep,
      fontWeight: "700",
      marginTop: spacing.xs,
    },
  });
}
