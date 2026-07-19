import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

type AnimatedRankingRowProps = PropsWithChildren<{
  rank?: number;
  optionId: string;
}>;

export function AnimatedRankingRow({ children, rank, optionId }: AnimatedRankingRowProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevRank = useRef(rank);

  useEffect(() => {
    if (rank === undefined) return;
    let animation: Animated.CompositeAnimation | undefined;
    if (prevRank.current !== undefined && prevRank.current !== rank) {
      scale.setValue(0.98);
      opacity.setValue(0.72);
      animation = Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
      animation.start();
    }
    prevRank.current = rank;
    return () => animation?.stop();
  }, [rank, optionId, opacity, scale]);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
}
