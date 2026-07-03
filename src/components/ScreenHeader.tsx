import { StyleSheet, View } from "react-native";

import { Text } from "@/ui/Text";
import { radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function ScreenHeader({ eyebrow, title, description }: ScreenHeaderProps) {
  const { colors } = useThemeColors();

  return (
    <View style={styles.wrap}>
      <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />
      {eyebrow ? <Text variant="label">{eyebrow}</Text> : null}
      <Text variant="title">{title}</Text>
      {description ? <Text>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  accentBar: {
    borderRadius: radius.pill,
    height: 4,
    width: 56,
  },
});
