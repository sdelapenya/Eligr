import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Text } from "@/ui/Text";
import { spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

export function FontBootstrap({ children }: PropsWithChildren) {
  const { colors } = useThemeColors();
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!loaded) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text variant="caption">Preparando Eligr...</Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
});
