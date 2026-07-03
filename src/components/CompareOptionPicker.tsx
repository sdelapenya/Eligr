import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { RentalOption } from "@/domain/types";
import { Input } from "@/ui/Input";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type CompareOptionPickerProps = {
  title: string;
  side: "a" | "b";
  selectedId?: string;
  disabledId?: string;
  options: RentalOption[];
  onSelect: (id: string) => void;
};

export function CompareOptionPicker({
  title,
  side,
  selectedId,
  disabledId,
  options,
  onSelect,
}: CompareOptionPickerProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(!selectedId);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.id === selectedId);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter(
      (option) =>
        option.title.toLowerCase().includes(normalized) || option.locationLabel.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  return (
    <View style={styles.wrap}>
      <Text variant="label">{title}</Text>
      {selected && !expanded ? (
        <Pressable
          onPress={() => setExpanded(true)}
          style={styles.selectedCard}
          testID={`compare-selected-${side}-${selected.id}`}
        >
          <View style={styles.selectedCopy}>
            <Text variant="subtitle" numberOfLines={1}>
              {selected.title}
            </Text>
            <Text variant="caption">{selected.locationLabel}</Text>
          </View>
          <Text variant="caption">Cambiar</Text>
        </Pressable>
      ) : (
        <View style={styles.panel}>
          {options.length > 4 ? (
            <Input
              label="Buscar"
              value={query}
              onChangeText={setQuery}
              placeholder="Título o zona"
              autoCapitalize="none"
            />
          ) : null}
          <ScrollView style={styles.list} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.map((option) => {
              const active = selectedId === option.id;
              const disabled = disabledId === option.id;
              return (
                <Pressable
                  key={option.id}
                  disabled={disabled}
                  onPress={() => {
                    onSelect(option.id);
                    setExpanded(false);
                    setQuery("");
                  }}
                  testID={`compare-picker-${side}-${option.id}`}
                  style={[styles.item, active && styles.itemActive, disabled && styles.itemDisabled]}
                >
                  <Text variant="subtitle" numberOfLines={1}>
                    {option.title}
                  </Text>
                  <Text variant="caption">{option.locationLabel}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {selected ? (
            <Pressable onPress={() => setExpanded(false)}>
              <Text variant="caption">Cancelar</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.sm,
    },
    selectedCard: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.accent,
      borderRadius: radius.md,
      borderWidth: 2,
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      padding: spacing.md,
    },
    selectedCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    panel: {
      gap: spacing.sm,
    },
    list: {
      gap: spacing.sm,
      maxHeight: 220,
    },
    item: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      gap: spacing.xs,
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    itemActive: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    itemDisabled: {
      opacity: 0.45,
    },
  });
}
