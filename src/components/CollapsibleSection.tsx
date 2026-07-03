import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { SectionHeader } from "@/components/SectionHeader";
import { spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type CollapsibleSectionProps = PropsWithChildren<{
  title: string;
  detail?: string;
  defaultOpen?: boolean;
  testID?: string;
}>;

export function CollapsibleSection({ title, detail, defaultOpen = false, testID, children }: CollapsibleSectionProps) {
  const { colors } = useThemeColors();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={styles.header}
        testID={testID}
      >
        <View style={styles.headerCopy}>
          <SectionHeader title={title} detail={detail} />
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  body: {
    gap: spacing.md,
  },
});
