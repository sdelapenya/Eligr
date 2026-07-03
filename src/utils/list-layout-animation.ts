import { LayoutAnimation, Platform, UIManager } from "react-native";

let androidEnabled = false;

export function configureRankingLayoutAnimation() {
  if (Platform.OS === "android" && !androidEnabled) {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
    androidEnabled = true;
  }

  LayoutAnimation.configureNext({
    duration: 280,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

export function rankingOrderKey(items: { option: { id: string } }[]) {
  return items.map((item) => item.option.id).join("|");
}
