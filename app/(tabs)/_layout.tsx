import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GuardedTabBarButton } from "@/components/GuardedTabBarButton";
import { radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_BAR_HEIGHT = 72;
const TAB_BAR_PADDING_BOTTOM = 10;

const tabTestIds: Record<string, string> = {
  index: "tab-options",
  priorities: "tab-priorities",
  ranking: "tab-ranking",
  premium: "tab-premium",
};

const tabLabels: Record<string, string> = {
  index: "Opciones",
  priorities: "Prioridades",
  ranking: "Ranking",
  premium: "Más",
};

const tabIcons: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: "home", inactive: "home-outline" },
  priorities: { active: "options", inactive: "options-outline" },
  ranking: { active: "podium", inactive: "podium-outline" },
  premium: { active: "ellipsis-horizontal", inactive: "ellipsis-horizontal-outline" },
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const bottomInset = Math.max(insets.bottom, 0);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentDeep,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginBottom: 2,
        },
        tabBarButton: (props) => {
          const { accessibilityState, style, ...rest } = props;
          const focused = accessibilityState?.selected;
          return (
            <GuardedTabBarButton
              {...rest}
              style={[
                style,
                {
                  borderRadius: radius.md,
                  marginHorizontal: 4,
                  marginVertical: 4,
                  paddingVertical: spacing.xs,
                },
                focused
                  ? {
                      backgroundColor: colors.accentMuted,
                    }
                  : undefined,
              ]}
              testID={tabTestIds[route.name] ?? `tab-${route.name}`}
              accessibilityLabel={tabLabels[route.name] ?? route.name}
              routeName={route.name}
            />
          );
        },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: TAB_BAR_HEIGHT + bottomInset,
          paddingBottom: TAB_BAR_PADDING_BOTTOM + bottomInset,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icon = tabIcons[route.name] ?? tabIcons.index;
          return <Ionicons name={focused ? icon.active : icon.inactive} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Opciones",
        }}
      />
      <Tabs.Screen
        name="priorities"
        options={{
          title: "Prioridades",
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: "Ranking",
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          title: "Más",
        }}
      />
    </Tabs>
  );
}
