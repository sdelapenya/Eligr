import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { shadows, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type QuickAddFabProps = {
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

const TAB_BAR_CLEARANCE = 88;

export function QuickAddFab({ onPress, disabled, testID = "quick-add-fab" }: QuickAddFabProps) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          alignItems: "center",
          backgroundColor: colors.accentDeep,
          borderRadius: 999,
          bottom: TAB_BAR_CLEARANCE + insets.bottom,
          height: 56,
          justifyContent: "center",
          position: "absolute",
          right: spacing.lg,
          width: 56,
          ...shadows.cardLifted,
        },
        pressed: {
          opacity: 0.88,
          transform: [{ scale: 0.96 }],
        },
        disabled: {
          opacity: 0.4,
        },
      }),
    [colors, insets.bottom],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Añadir rápido"
      accessibilityHint="Abre el formulario rápido para guardar un alquiler"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.fab, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons name="flash" size={26} color={colors.surface} />
    </Pressable>
  );
}
