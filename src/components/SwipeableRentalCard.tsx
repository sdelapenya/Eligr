import { useMemo, useRef } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { isDiscarded } from "@/domain/filters";
import { RentalCard, RentalCardProps } from "@/components/RentalCard";
import { FREE_TIER_LIMITS, useEligrStore } from "@/store/useEligrStore";
import { showToast } from "@/store/toastStore";
import { showAlert } from "@/utils/alert";
import { radius } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

const ACTION_WIDTH = 152;
const OPEN_THRESHOLD = 64;

export function SwipeableRentalCard(props: RentalCardProps) {
  if (!props.compact) {
    return <RentalCard {...props} />;
  }

  return <SwipeableRentalCardInner {...props} />;
}

function SwipeableRentalCardInner(props: RentalCardProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const setStatus = useEligrStore((state) => state.setStatus);
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);
  const discarded = isDiscarded(props.option);

  const close = () => {
    openRef.current = false;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
  };

  const open = () => {
    openRef.current = true;
    Animated.spring(translateX, { toValue: -ACTION_WIDTH, useNativeDriver: true, bounciness: 0 }).start();
  };

  const applyStatus = (status: "favorite" | "discarded" | "new", label: string) => {
    const ok = setStatus(props.option.id, status);
    close();
    if (ok) {
      showToast(label);
      return;
    }
    showAlert(
      "Límite alcanzado",
      `El plan free permite ${FREE_TIER_LIMITS.rentalOptions} opciones activas. Descarta alguna o activa premium.`,
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderMove: (_, gesture) => {
        const next = openRef.current
          ? Math.min(0, Math.max(-ACTION_WIDTH, -ACTION_WIDTH + gesture.dx))
          : Math.min(0, gesture.dx);
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldOpen = openRef.current
          ? gesture.dx > -OPEN_THRESHOLD / 2
          : gesture.dx < -OPEN_THRESHOLD;
        if (shouldOpen) open();
        else close();
      },
    }),
  ).current;

  return (
    <View style={styles.wrap} testID={`swipe-rental-${props.option.id}`}>
      <View style={styles.actions}>
        {discarded ? (
          <Pressable
            style={[styles.action, styles.actionRestore]}
            onPress={() => applyStatus("new", "Opción reactivada")}
            accessibilityLabel="Reactivar opción"
          >
            <Ionicons name="refresh-outline" size={20} color={colors.surface} />
          </Pressable>
        ) : (
          <>
            <Pressable
              style={[styles.action, styles.actionFavorite]}
              onPress={() => applyStatus("favorite", "Marcada como favorita")}
              accessibilityLabel="Marcar favorita"
            >
              <Ionicons name="heart-outline" size={20} color={colors.surface} />
            </Pressable>
            <Pressable
              style={[styles.action, styles.actionDiscard]}
              onPress={() => applyStatus("discarded", "Opción descartada")}
              accessibilityLabel="Descartar opción"
            >
              <Ionicons name="trash-outline" size={20} color={colors.surface} />
            </Pressable>
          </>
        )}
      </View>

      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <RentalCard {...props} />
      </Animated.View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>["colors"]) {
  return StyleSheet.create({
    wrap: {
      overflow: "hidden",
      position: "relative",
    },
    actions: {
      alignItems: "stretch",
      bottom: 0,
      flexDirection: "row",
      justifyContent: "flex-end",
      position: "absolute",
      right: 0,
      top: 0,
      width: ACTION_WIDTH,
    },
    action: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    actionFavorite: {
      backgroundColor: colors.accentDeep,
      borderBottomLeftRadius: radius.md,
      borderTopLeftRadius: radius.md,
    },
    actionDiscard: {
      backgroundColor: colors.danger,
    },
    actionRestore: {
      backgroundColor: colors.accent,
      borderBottomLeftRadius: radius.md,
      borderTopLeftRadius: radius.md,
      flex: 1,
    },
  });
}
