import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToastStore } from "@/store/toastStore";
import { Text } from "@/ui/Text";
import { radius, shadows, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export function ToastHost() {
  const message = useToastStore((state) => state.message);
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        host: {
          alignItems: "center",
          left: spacing.lg,
          position: "absolute",
          right: spacing.lg,
          zIndex: 100,
        },
        toast: {
          backgroundColor: colors.text,
          borderRadius: radius.md,
          maxWidth: 360,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          width: "100%",
        },
        text: {
          color: colors.surface,
          textAlign: "center",
        },
      }),
    [colors],
  );

  if (!message) return null;

  return (
    <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + spacing.xl }]}>
      <View style={[styles.toast, shadows.cardLifted]}>
        <Text variant="caption" style={styles.text}>
          {message}
        </Text>
      </View>
    </View>
  );
}
