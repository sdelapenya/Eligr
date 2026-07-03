import { StyleSheet, View } from "react-native";

import {
  ChecklistStatus,
  VisitChecklist,
  getVisitChecklistProgress,
  visitChecklistLabels,
  visitChecklistOrder,
} from "@/domain/visit-checklist";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Input } from "@/ui/Input";
import { Text } from "@/ui/Text";
import { radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

const statusLabels: Record<ChecklistStatus, string> = {
  pending: "Pendiente",
  ok: "OK",
  issue: "Revisar",
};

type VisitChecklistSummaryCardProps = {
  checklist: VisitChecklist;
  onOpenAssistant: () => void;
};

export function VisitChecklistHint() {
  const { colors } = useThemeColors();
  return (
    <Card variant="muted" style={styles.hintCard}>
      <Text variant="subtitle">Checklist solo lectura aquí</Text>
      <Text>
        Para marcar humedad, ruido, contrato y demás — y que el ranking lo tenga en cuenta — usa el asistente de visita.
      </Text>
      <Text variant="caption" style={{ color: colors.accentDeep }}>
        Botón «Completar en asistente» abajo.
      </Text>
    </Card>
  );
}

export function VisitChecklistSummaryCard({ checklist, onOpenAssistant }: VisitChecklistSummaryCardProps) {
  const { colors } = useThemeColors();
  const progress = getVisitChecklistProgress(checklist);
  const statusColors: Record<ChecklistStatus, string> = {
    pending: colors.inkSoft,
    ok: colors.accentSoft,
    issue: colors.warningSoft,
  };
  const showHint = progress.reviewed === 0;

  return (
    <Card testID="visit-checklist-summary">
      {showHint ? <VisitChecklistHint /> : null}
      <View style={styles.header}>
        <Text variant="subtitle">Checklist de visita</Text>
        <Text variant="caption">
          {progress.reviewed}/{progress.total} revisados
          {progress.issues > 0 ? ` · ${progress.issues} alerta${progress.issues === 1 ? "" : "s"}` : ""}
        </Text>
      </View>

      <View style={styles.grid}>
        {visitChecklistOrder.map((key) => {
          const status = checklist[key];
          return (
            <View key={key} style={[styles.item, styles.itemReadOnly, { backgroundColor: statusColors[status] ?? colors.inkSoft }]}>
              <Text variant="caption">{visitChecklistLabels[key]}</Text>
              <Text variant="subtitle">{statusLabels[status]}</Text>
            </View>
          );
        })}
      </View>

      <Button
        label="Completar en asistente"
        icon="footsteps-outline"
        variant="secondary"
        onPress={onOpenAssistant}
        testID="visit-checklist-assistant-button"
      />
    </Card>
  );
}

type VisitQuickNotesCardProps = {
  visitImpression: string;
  visitNextAction: string;
  onChangeImpression: (value: string) => void;
  onChangeNextAction: (value: string) => void;
};

export function VisitQuickNotesCard({
  visitImpression,
  visitNextAction,
  onChangeImpression,
  onChangeNextAction,
}: VisitQuickNotesCardProps) {
  return (
    <Card testID="visit-quick-notes">
      <View style={styles.header}>
        <Text variant="subtitle">Notas rápidas</Text>
        <Text variant="caption">Impresión y próximo paso sin salir del detalle.</Text>
      </View>
      <Text variant="caption">
        El asistente sigue siendo la forma recomendada tras la visita; estas notas no cambian el checklist ni el ranking.
      </Text>

      <Input
        label="Impresión tras la visita"
        value={visitImpression}
        onChangeText={onChangeImpression}
        placeholder="Luz, olores, ruido de fondo, sensación general..."
        multiline
        style={styles.multiline}
      />

      <Input
        label="Próximo paso"
        value={visitNextAction}
        onChangeText={onChangeNextAction}
        placeholder="Pedir contrato, segunda visita, negociar precio..."
        multiline
        style={styles.multiline}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  hintCard: {
    gap: spacing.xs,
  },
  header: {
    gap: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  item: {
    borderRadius: radius.sm,
    gap: spacing.xs,
    minWidth: "47%",
    padding: spacing.md,
  },
  itemReadOnly: {
    opacity: 0.92,
  },
  multiline: {
    minHeight: 72,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
});
