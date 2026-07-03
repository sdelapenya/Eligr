import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import {
  impressionChips,
  nextActionChips,
  setChecklistItem,
  resolveVisitDebriefStatus,
} from "@/domain/visit-debrief";
import {
  VisitChecklist,
  VisitChecklistKey,
  emptyVisitChecklist,
  getVisitChecklistProgress,
  visitChecklistLabels,
  visitChecklistOrder,
} from "@/domain/visit-checklist";
import { RentalOption } from "@/domain/types";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type VisitDebriefWizardProps = {
  option: RentalOption;
  onComplete: (payload: {
    visitChecklist: VisitChecklist;
    visitImpression: string;
    visitNextAction: string;
    status: RentalOption["status"];
  }) => void;
  onCancel: () => void;
};

type WizardStep = "checklist" | "impression" | "next";

export function VisitDebriefWizard({ option, onComplete, onCancel }: VisitDebriefWizardProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState<WizardStep>("checklist");
  const [checklist, setChecklist] = useState<VisitChecklist>(option.visitChecklist ?? emptyVisitChecklist());
  const [impression, setImpression] = useState(option.visitImpression ?? "");
  const [nextAction, setNextAction] = useState(option.visitNextAction ?? "");

  const progress = useMemo(() => getVisitChecklistProgress(checklist), [checklist]);
  const stepIndex = step === "checklist" ? 1 : step === "impression" ? 2 : 3;

  const markItem = (key: VisitChecklistKey, status: "ok" | "issue") => {
    setChecklist((current) => setChecklistItem(current, key, status));
  };

  const finish = () => {
    const status = resolveVisitDebriefStatus(impression, nextAction, progress.reviewed, option.status);

    onComplete({
      visitChecklist: checklist,
      visitImpression: impression.trim(),
      visitNextAction: nextAction.trim(),
      status,
    });
  };

  return (
    <View style={styles.wrap} testID="visit-debrief-wizard">
      <View style={styles.progress}>
        <Text variant="caption">
          Paso {stepIndex} de 3 · {option.title}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(stepIndex / 3) * 100}%` }]} />
        </View>
      </View>

      {step === "checklist" ? (
        <Card>
          <Text variant="subtitle">¿Qué comprobaste en la visita?</Text>
          <Text variant="caption">
            Marca cada punto. Llevas {progress.reviewed}/{progress.total} revisados.
          </Text>
          <View style={styles.checklist}>
            {visitChecklistOrder.map((key) => {
              const status = checklist[key];
              return (
                <View key={key} style={styles.checklistRow}>
                  <Text style={styles.checklistLabel}>{visitChecklistLabels[key]}</Text>
                  <View style={styles.checklistActions}>
                    <Pressable
                      onPress={() => markItem(key, "ok")}
                      style={[styles.miniBtn, status === "ok" && styles.miniBtnOk]}
                      testID={`visit-checklist-ok-${key}`}
                    >
                      <Text variant="caption" style={status === "ok" ? styles.miniBtnTextActive : undefined}>
                        Bien
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => markItem(key, "issue")}
                      style={[styles.miniBtn, status === "issue" && styles.miniBtnIssue]}
                      testID={`visit-checklist-issue-${key}`}
                    >
                      <Text variant="caption" style={status === "issue" ? styles.miniBtnTextActive : undefined}>
                        Revisar
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
          <Button label="Siguiente" icon="arrow-forward-outline" onPress={() => setStep("impression")} testID="visit-wizard-next" />
        </Card>
      ) : null}

      {step === "impression" ? (
        <Card>
          <Text variant="subtitle">Impresión general</Text>
          <Text variant="caption">Una frase basta. Afectará pros, contras y la sensación personal en el ranking.</Text>
          <View style={styles.chips}>
            {impressionChips.map((chip, index) => (
              <Pressable
                key={chip}
                onPress={() => setImpression(chip)}
                style={[styles.chip, impression === chip && styles.chipActive]}
                testID={`visit-impression-chip-${index}`}
              >
                <Text variant="caption" style={impression === chip ? styles.chipTextActive : undefined}>
                  {chip}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={impression}
            onChangeText={setImpression}
            placeholder="Ej. luminoso pero se oye la calle..."
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
            testID="visit-impression-input"
          />
          <View style={styles.row}>
            <Button label="Atrás" variant="secondary" onPress={() => setStep("checklist")} />
            <Button label="Siguiente" icon="arrow-forward-outline" onPress={() => setStep("next")} testID="visit-wizard-next" />
          </View>
        </Card>
      ) : null}

      {step === "next" ? (
        <Card>
          <Text variant="subtitle">Próximo paso</Text>
          <Text variant="caption">¿Qué harás con esta opción?</Text>
          <View style={styles.chips}>
            {nextActionChips.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => setNextAction(chip)}
                style={[styles.chip, nextAction === chip && styles.chipActive]}
              >
                <Text variant="caption" style={nextAction === chip ? styles.chipTextActive : undefined}>
                  {chip}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={nextAction}
            onChangeText={setNextAction}
            placeholder="O escribe tu propio siguiente paso..."
            placeholderTextColor={colors.muted}
            style={styles.input}
            testID="visit-next-action-input"
          />
          <View style={styles.row}>
            <Button label="Atrás" variant="secondary" onPress={() => setStep("impression")} />
            <Button label="Guardar visita" icon="checkmark-outline" onPress={finish} testID="visit-wizard-save" />
          </View>
        </Card>
      ) : null}

      <Button label="Cancelar" variant="secondary" onPress={onCancel} testID="visit-wizard-cancel" />
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.md,
    },
    progress: {
      gap: spacing.xs,
    },
    progressBar: {
      backgroundColor: colors.border,
      borderRadius: radius.pill,
      height: 6,
      overflow: "hidden",
    },
    progressFill: {
      backgroundColor: colors.accent,
      height: 6,
    },
    checklist: {
      gap: spacing.sm,
    },
    checklistRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
    },
    checklistLabel: {
      flex: 1,
    },
    checklistActions: {
      flexDirection: "row",
      gap: spacing.xs,
    },
    miniBtn: {
      backgroundColor: colors.inkSoft,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    miniBtnOk: {
      backgroundColor: colors.accentSoft,
    },
    miniBtnIssue: {
      backgroundColor: colors.warningSoft,
    },
    miniBtnTextActive: {
      fontWeight: "700",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    chip: {
      backgroundColor: colors.inkSoft,
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.accentDeep,
      borderColor: colors.accentDeep,
    },
    chipTextActive: {
      color: colors.surface,
    },
    input: {
      backgroundColor: colors.inkSoft,
      borderColor: colors.border,
      borderRadius: radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      color: colors.text,
      fontSize: 15,
      minHeight: 72,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      textAlignVertical: "top",
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
  });
}
