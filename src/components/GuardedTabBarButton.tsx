import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback } from "react";

import { usePrioritiesUiStore } from "@/store/prioritiesUiStore";
import { confirmPrioritiesLeave } from "@/utils/priorities-guard";

type GuardedTabBarButtonProps = BottomTabBarButtonProps & {
  testID: string;
  routeName: string;
  accessibilityLabel?: string;
};

export function GuardedTabBarButton({ testID, routeName, onPress, accessibilityLabel, ...props }: GuardedTabBarButtonProps) {
  const navigation = useNavigation();
  const route = useRoute();
  const isDirty = usePrioritiesUiStore((state) => state.isDirty);

  const handlePress = useCallback(
    (event: Parameters<NonNullable<BottomTabBarButtonProps["onPress"]>>[0]) => {
      const leavingPriorities = route.name === "priorities" && routeName !== "priorities";

      if (leavingPriorities && isDirty) {
        event.preventDefault();
        confirmPrioritiesLeave(() => navigation.navigate(routeName as never));
        return;
      }

      onPress?.(event);
    },
    [isDirty, navigation, onPress, route.name, routeName],
  );

  return <PlatformPressable {...props} testID={testID} accessibilityLabel={accessibilityLabel} onPress={handlePress} />;
}
