import { PropsWithChildren, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "./theme";
import { useThemeColors } from "./theme-context";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  footer?: React.ReactNode;
  testID?: string;
}>;

export function Screen({ children, scroll = true, footer, testID }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.backgroundElevated },
        scroll: { flex: 1 },
        static: { flex: 1 },
        scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
        content: { gap: spacing.lg, padding: spacing.lg },
        footer: {
          borderTopColor: colors.borderLight,
          borderTopWidth: StyleSheet.hairlineWidth,
          padding: spacing.lg,
          backgroundColor: colors.tabBar,
        },
      }),
    [colors],
  );

  const content = (
    <View style={styles.content} testID={testID}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
      testID={testID}
      accessible={Boolean(testID)}
      accessibilityLabel={testID}
    >
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.static}>{content}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}>{footer}</View> : null}
    </SafeAreaView>
  );
}
