import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ImportBackupMode } from "@/domain/collaboration";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

const MODES: { id: ImportBackupMode; label: string; hint: string }[] = [
  { id: "merge", label: "Combinar", hint: "Suma pisos nuevos sin borrar los tuyos. Tu elección marcada se mantiene." },
  { id: "replace", label: "Reemplazar", hint: "Sustituye toda la búsqueda y opciones" },
];

type ImportModeChipsProps = {
  value: ImportBackupMode;
  onChange: (mode: ImportBackupMode) => void;
};

export function ImportModeChips({ value, onChange }: ImportModeChipsProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const active = MODES.find((mode) => mode.id === value) ?? MODES[0];

  return (
    <View style={styles.wrap}>
      <Text variant="caption">Modo de importación</Text>
      <View style={styles.row}>
        {MODES.map((mode) => {
          const selected = value === mode.id;
          return (
            <Pressable
              key={mode.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(mode.id)}
              style={[styles.chip, selected && styles.chipSelected]}
              testID={`import-mode-${mode.id}`}
            >
              <Text variant="caption" style={selected ? styles.chipLabelSelected : undefined}>
                {mode.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="caption" style={styles.hint}>{active.hint}</Text>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    chip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipSelected: {
      backgroundColor: colors.accentMuted,
      borderColor: colors.accent,
      borderWidth: 1,
    },
    chipLabelSelected: {
      color: colors.accentDeep,
      fontWeight: "700",
    },
    hint: {
      color: colors.muted,
    },
  });
}
