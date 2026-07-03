import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { ListFilter, listFilterLabels } from "@/domain/filters";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type ListFilterChipsProps = {
  value: ListFilter;
  counts: Record<ListFilter, number>;
  onChange: (filter: ListFilter) => void;
};

const filters: ListFilter[] = ["active", "all", "favorite", "discarded"];

export function ListFilterChips({ value, counts, onChange }: ListFilterChipsProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {filters.map((filter) => {
        const active = value === filter;
        return (
          <Pressable
            key={filter}
            onPress={() => onChange(filter)}
            style={[styles.chip, active && styles.chipActive]}
            testID={`options-filter-${filter}`}
          >
            <Text variant="caption" style={active ? styles.chipTextActive : undefined}>
              {listFilterLabels[filter]} ({counts[filter]})
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
