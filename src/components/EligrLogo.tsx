import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, ViewStyle } from "react-native";

import { Text } from "@/ui/Text";
import { spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type EligrLogoProps = {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  style?: ViewStyle;
};

const sizes = {
  sm: { mark: 32, icon: 16, title: 18, gap: spacing.sm },
  md: { mark: 44, icon: 22, title: 24, gap: spacing.md },
  lg: { mark: 56, icon: 28, title: 30, gap: spacing.md },
} as const;

export function EligrLogo({ size = "md", showTagline = false, style }: EligrLogoProps) {
  const { colors } = useThemeColors();
  const scale = sizes[size];

  return (
    <View style={[styles.wrap, { gap: scale.gap }, style]}>
      <View
        style={[
          styles.mark,
          {
            width: scale.mark,
            height: scale.mark,
            borderRadius: scale.mark * 0.28,
            backgroundColor: colors.accentDeep,
            shadowColor: colors.accentDeep,
          },
        ]}
      >
        <Ionicons name="home" size={scale.icon} color={colors.surface} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { fontSize: scale.title, lineHeight: scale.title + 4, color: colors.text }]}>
          Eligr
        </Text>
        {showTagline ? <Text variant="caption">Compara alquileres. Decide mejor.</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  mark: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  copy: {
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    fontWeight: "800",
    letterSpacing: -0.5,
  },
});
