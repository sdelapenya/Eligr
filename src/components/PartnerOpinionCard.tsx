import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useDebouncedTextField } from "@/hooks/useDebouncedValue";
import { quickRating } from "@/domain/listing-import/to-form";
import { RentalOption } from "@/domain/types";
import { useEligrStore } from "@/store/useEligrStore";
import { showToast } from "@/store/toastStore";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Input } from "@/ui/Input";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type PartnerOpinionCardProps = {
  option: RentalOption;
  compact?: boolean;
};

const LEVELS = [
  { id: "low" as const, label: "Poco", value: quickRating("low") },
  { id: "mid" as const, label: "Bien", value: quickRating("mid") },
  { id: "high" as const, label: "Mucho", value: quickRating("high") },
];

export function PartnerOpinionCard({ option, compact = false }: PartnerOpinionCardProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const updateRentalOption = useEligrStore((state) => state.updateRentalOption);
  const rating = option.partnerFeelingRating;
  const activeLevel = LEVELS.find((level) => level.value === rating)?.id;

  const setRating = (value: number) => {
    updateRentalOption(option.id, { partnerFeelingRating: value, updatedAt: new Date().toISOString() });
    showToast("Opinión guardada");
  };

  const commitNote = useCallback(
    (partnerNote: string) => {
      updateRentalOption(option.id, { partnerNote, updatedAt: new Date().toISOString() });
    },
    [option.id, updateRentalOption],
  );
  const [noteDraft, setNoteDraft] = useDebouncedTextField(option.partnerNote ?? "", commitNote);

  const clearOpinion = () => {
    updateRentalOption(option.id, {
      partnerFeelingRating: undefined,
      partnerNote: undefined,
      updatedAt: new Date().toISOString(),
    });
    showToast("Opinión borrada");
  };

  return (
    <Card variant="muted" testID={`partner-opinion-${option.id}`}>
      <Text variant="label">Opinión de pareja / compañero</Text>
      <Text variant="caption">
        {compact
          ? "Valoración rápida sin rellenar todo el formulario."
          : "Ideal cuando importáis la búsqueda juntos: anota sensación en segundos."}
      </Text>

      <View style={styles.chips}>
        {LEVELS.map((level) => (
          <Pressable
            key={level.id}
            accessibilityRole="button"
            accessibilityState={{ selected: activeLevel === level.id }}
            onPress={() => setRating(level.value)}
            style={[styles.chip, activeLevel === level.id && styles.chipActive]}
            testID={`partner-rating-${level.id}-${option.id}`}
          >
            <Text variant="caption" style={activeLevel === level.id ? styles.chipLabelActive : undefined}>
              {level.label} · {level.value}/10
            </Text>
          </Pressable>
        ))}
      </View>

      {!compact ? (
        <Input
          label="Nota breve (opcional)"
          value={noteDraft}
          onChangeText={setNoteDraft}
          placeholder="Ej.: le gusta la luz pero le preocupa el ruido"
          testID={`partner-note-${option.id}`}
        />
      ) : null}

      {rating != null ? (
        <View style={styles.footer}>
          <Text variant="caption">Sensación registrada: {rating}/10</Text>
          <Button label="Quitar opinión" variant="ghost" onPress={clearOpinion} />
        </View>
      ) : null}
    </Card>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    chip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.accentMuted,
      borderColor: colors.accent,
      borderWidth: 1,
    },
    chipLabelActive: {
      color: colors.accentDeep,
      fontWeight: "700",
    },
    footer: {
      gap: spacing.xs,
    },
  });
}

export function formatPartnerOpinion(option: RentalOption): string | null {
  if (option.partnerFeelingRating == null) return null;
  const note = option.partnerNote?.trim();
  return note ? `${option.partnerFeelingRating}/10 — ${note}` : `${option.partnerFeelingRating}/10`;
}
