import { StyleSheet, View } from "react-native";

import { Text } from "@/ui/Text";
import { spacing } from "@/ui/theme";

export function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.wrap}>
      <Text variant="label">{title}</Text>
      {detail ? <Text variant="caption">{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
});
