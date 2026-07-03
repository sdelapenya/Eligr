import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PriorityProfileId, priorityProfiles } from "@/domain/priority-profiles";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type PriorityProfileChipsProps = {
  value: PriorityProfileId;
  onChange: (id: PriorityProfileId) => void;
  compact?: boolean;
};

export function PriorityProfileChips({ value, onChange, compact = false }: PriorityProfileChipsProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      {!compact ? <Text variant="caption">Plantilla de prioridades</Text> : null}
      <View style={styles.row}>
        {priorityProfiles.map((profile) => {
          const selected = value === profile.id;
          return (
            <Pressable
              key={profile.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${profile.label}. ${profile.description}`}
              onPress={() => onChange(profile.id)}
              style={[styles.chip, selected && styles.chipSelected]}
              testID={`priority-profile-${profile.id}`}
            >
              <Ionicons name={profile.icon} size={16} color={selected ? colors.accentDeep : colors.muted} />
              <Text variant="caption" style={selected ? styles.chipLabelSelected : styles.chipLabel}>
                {profile.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!compact ? (
        <Text variant="caption" style={styles.hint}>
          {priorityProfiles.find((profile) => profile.id === value)?.description}
        </Text>
      ) : null}
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
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    chip: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipSelected: {
      backgroundColor: colors.accentMuted,
      borderColor: colors.accent,
      borderWidth: 1,
    },
    chipLabel: {
      color: colors.textSecondary,
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
