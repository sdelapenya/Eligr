import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { statusLabels } from "@/domain/labels";
import { RentalStatus } from "@/domain/types";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

const statuses: RentalStatus[] = ["new", "contacted", "visit_planned", "visited", "favorite", "discarded"];

type StatusChipRowProps = {
  value: RentalStatus;
  onChange: (status: RentalStatus) => void;
};

export function StatusChipRow({ value, onChange }: StatusChipRowProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {statuses.map((status) => {
        const active = value === status;
        return (
          <Pressable
            key={status}
            onPress={() => onChange(status)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text variant="caption" style={active ? styles.chipTextActive : undefined}>
              {statusLabels[status]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chip: {
      backgroundColor: colors.surface,
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
  });
}
