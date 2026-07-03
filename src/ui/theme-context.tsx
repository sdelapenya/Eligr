import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

import { useEligrStore } from "@/store/useEligrStore";
import { ColorPalette, darkColors, lightColors, ThemeMode } from "@/ui/theme";

type ThemeContextValue = {
  colors: ColorPalette;
  isDark: boolean;
  themeMode: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  themeMode: "system",
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const themeMode = useEligrStore((state) => state.appMeta.themeMode ?? "system");
  const systemScheme = useColorScheme();

  const value = useMemo(() => {
    const resolvedDark = themeMode === "dark" || (themeMode === "system" && systemScheme === "dark");
    return {
      colors: resolvedDark ? darkColors : lightColors,
      isDark: resolvedDark,
      themeMode,
    };
  }, [themeMode, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeColors() {
  return useContext(ThemeContext);
}
