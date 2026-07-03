import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EligrLogo } from "@/components/EligrLogo";
import { PriorityProfileChips } from "@/components/PriorityProfileChips";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";
import { PriorityProfileId } from "@/domain/priority-profiles";

const STEPS = [
  {
    icon: "clipboard-outline" as const,
    title: "Pega y compara",
    body: "Copia anuncios de Idealista, Fotocasa o WhatsApp. Ajusta prioridades y Eligr te muestra un ranking claro con pros, contras y avisos.",
  },
  {
    icon: "checkmark-done-outline" as const,
    title: "Visita y decide",
    body: "Tras cada visita, registra impresiones en un minuto. Compara tradeoffs, revisa el ranking y marca tu elección final.",
  },
];

type OnboardingModalProps = {
  visible: boolean;
  step: number;
  onNext: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onStartFreshSearch?: () => void;
  onApplyProfile?: (profileId: PriorityProfileId) => void;
};

export function OnboardingModal({ visible, step, onNext, onComplete, onSkip, onStartFreshSearch, onApplyProfile }: OnboardingModalProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profileId, setProfileId] = useState<PriorityProfileId>("balanced");
  const current = STEPS[step] ?? STEPS[0];
  const isLast = step >= STEPS.length - 1;

  const applyProfile = () => onApplyProfile?.(profileId);

  const finishPaste = () => {
    applyProfile();
    onComplete();
    router.push("/rental/new");
  };

  const finishFreshSearch = () => {
    applyProfile();
    onComplete();
    onStartFreshSearch?.();
  };

  const finishDemo = () => {
    applyProfile();
    onComplete();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onSkip} testID="onboarding-modal">
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]} testID="onboarding-screen">
        <View style={styles.header}>
          <EligrLogo size="lg" showTagline />
        </View>

        <View style={styles.content}>
          <Card variant="elevated" style={styles.stepCard} testID="onboarding-step-card">
            <View style={styles.iconWrap}>
              <Ionicons name={current.icon} size={28} color={colors.accentDeep} />
            </View>
            <Text variant="label" testID="onboarding-step-label">
              Paso {step + 1} de {STEPS.length}
            </Text>
            <Text variant="title" style={styles.stepTitle}>
              {current.title}
            </Text>
            <Text style={styles.stepBody}>{current.body}</Text>
            <View style={styles.dots}>
              {STEPS.map((_, index) => (
                <View key={index} style={[styles.dot, index === step && styles.dotActive]} />
              ))}
            </View>
          </Card>
        </View>

        <View style={styles.footer}>
          {isLast ? (
            <>
              <PriorityProfileChips value={profileId} onChange={setProfileId} />
              <Text variant="caption" style={styles.authNote}>
                Tus datos se guardan en el móvil. Sin cuenta por ahora.
              </Text>
              <Button
                label="Pegar mi primer anuncio"
                icon="clipboard-outline"
                onPress={finishPaste}
                testID="onboarding-finish"
              />
              <Button
                label="Empezar mi búsqueda"
                variant="secondary"
                icon="home-outline"
                onPress={finishFreshSearch}
                testID="onboarding-fresh-search"
              />
              <Button label="Explorar demo" variant="ghost" onPress={finishDemo} testID="onboarding-explore-demo" />
            </>
          ) : (
            <View style={styles.actions}>
              <Button label="Saltar" variant="ghost" onPress={onSkip} testID="onboarding-skip" />
              <Button
                label="Pegar anuncio"
                variant="secondary"
                icon="clipboard-outline"
                onPress={finishPaste}
                testID="onboarding-paste-step"
              />
              <Button label="Siguiente" icon="arrow-forward-outline" onPress={onNext} testID="onboarding-next" />
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
      flex: 1,
      paddingHorizontal: spacing.xl,
    },
    header: {
      alignItems: "center",
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    content: {
      flex: 1,
      justifyContent: "center",
    },
    stepCard: {
      alignItems: "flex-start",
      gap: spacing.md,
    },
    iconWrap: {
      alignItems: "center",
      backgroundColor: colors.accentMuted,
      borderRadius: radius.lg,
      height: 56,
      justifyContent: "center",
      width: 56,
    },
    stepTitle: {
      maxWidth: 320,
    },
    stepBody: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      maxWidth: 340,
    },
    dots: {
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    dot: {
      backgroundColor: colors.border,
      borderRadius: radius.pill,
      height: 8,
      width: 8,
    },
    dotActive: {
      backgroundColor: colors.accent,
      width: 24,
    },
    footer: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      justifyContent: "space-between",
    },
    authNote: {
      marginBottom: spacing.xs,
      textAlign: "center",
    },
  });
}
