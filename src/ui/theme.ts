export const lightColors = {
  background: "#F5F1E8",
  backgroundElevated: "#FAF8F4",
  surface: "#FFFFFF",
  surfaceAlt: "#EDE8DE",
  surfaceMuted: "#F0EDE6",
  text: "#1A2420",
  textSecondary: "#3D4A44",
  muted: "#6B756F",
  border: "#D9D0C0",
  borderLight: "#E8E2D6",
  accent: "#1F7A6D",
  accentSoft: "#D8EBE6",
  accentMuted: "#E8F3F0",
  accentDeep: "#145C53",
  warning: "#9A5610",
  warningSoft: "#F6E8D4",
  danger: "#9E3838",
  dangerSoft: "#F2D8D8",
  inkSoft: "#E9EEEC",
  scoreHigh: "#1F7A6D",
  scoreMid: "#5A6761",
  tabBar: "#FDFCFA",
} as const;

export const darkColors = {
  background: "#121816",
  backgroundElevated: "#171F1C",
  surface: "#1E2825",
  surfaceAlt: "#24302C",
  surfaceMuted: "#2A3632",
  text: "#F2F6F4",
  textSecondary: "#C5D0CB",
  muted: "#8A9690",
  border: "#3A4843",
  borderLight: "#2E3A36",
  accent: "#3BA99A",
  accentSoft: "#1F3D38",
  accentMuted: "#1A3330",
  accentDeep: "#5CC4B6",
  warning: "#E0A04A",
  warningSoft: "#3D2E18",
  danger: "#E07A7A",
  dangerSoft: "#3D2222",
  inkSoft: "#24302C",
  scoreHigh: "#5CC4B6",
  scoreMid: "#9AABA4",
  tabBar: "#171F1C",
} as const;

export type ColorPalette = {
  [K in keyof typeof lightColors]: string;
};

export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 26, lineHeight: 32, fontWeight: "800" as const, fontFamily: "DMSans_700Bold" },
  subtitle: { fontSize: 17, lineHeight: 23, fontWeight: "700" as const, fontFamily: "DMSans_700Bold" },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "500" as const, fontFamily: "DMSans_500Medium" },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "600" as const, fontFamily: "DMSans_500Medium" },
  label: { fontSize: 11, lineHeight: 14, fontWeight: "800" as const, letterSpacing: 0.6, fontFamily: "DMSans_700Bold" },
} as const;

export const shadows = {
  card: {
    shadowColor: "#1A2420",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLifted: {
    shadowColor: "#1A2420",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

export type ThemeMode = "system" | "light" | "dark";
