import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NotificationBootstrap } from "@/components/NotificationBootstrap";
import { FontBootstrap } from "@/components/FontBootstrap";
import { StoreGate } from "@/components/StoreGate";
import { ToastHost } from "@/components/ToastHost";
import { ThemeProvider, useThemeColors } from "@/ui/theme-context";

function AppShell() {
  const { colors, isDark } = useThemeColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NotificationBootstrap />
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.background} />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background, flex: 1 },
          }}
        />
      </View>
      <ToastHost />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FontBootstrap>
          <StoreGate>
            <AppShell />
          </StoreGate>
        </FontBootstrap>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
