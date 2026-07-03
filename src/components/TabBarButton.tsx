import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";

type TabBarButtonProps = BottomTabBarButtonProps & {
  testID: string;
};

export function TabBarButton({ testID, ...props }: TabBarButtonProps) {
  return <PlatformPressable {...props} testID={testID} />;
}
