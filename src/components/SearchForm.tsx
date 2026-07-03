import { ComponentProps, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Control, Controller, FieldPath, useForm } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { z } from "zod";

import { rentalTypeLabels } from "@/domain/labels";
import { RentalSearch, RentalType } from "@/domain/types";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { DateField } from "@/ui/DateField";
import { Input } from "@/ui/Input";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

const rentalTypeEnum = z.enum(["room", "studio", "flat", "coliving", "other"]);

const searchSchema = z.object({
  title: z.string().min(3, "Pon un nombre para la búsqueda."),
  city: z.string().min(2, "Indica la ciudad."),
  area: z.string().min(2, "Indica zona o barrios objetivo."),
  maxBudget: z.coerce.number().positive("El presupuesto debe ser mayor que 0."),
  moveInDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Elige una fecha de entrada.")
    .min(4, "Indica fecha de entrada ideal."),
  destinationLabel: z.string().min(2, "Indica trabajo, universidad o destino del trayecto."),
  rentalTypes: z.array(rentalTypeEnum).min(1, "Elige al menos un tipo de alquiler."),
});

export type SearchFormValues = z.output<typeof searchSchema>;
type SearchFormInput = z.input<typeof searchSchema>;

const rentalTypes: RentalType[] = ["room", "studio", "flat", "coliving", "other"];

export function toSearchFormValues(search: RentalSearch): SearchFormValues {
  return {
    title: search.title,
    city: search.city,
    area: search.area,
    maxBudget: search.maxBudget,
    moveInDate: search.moveInDate,
    destinationLabel: search.destinationLabel,
    rentalTypes: search.rentalTypes,
  };
}

type SearchFormProps = {
  initialValues: RentalSearch;
  submitLabel: string;
  onSubmit: (values: SearchFormValues) => void;
};

export function SearchForm({ initialValues, submitLabel, onSubmit }: SearchFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<SearchFormInput, unknown, SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: toSearchFormValues(initialValues),
  });

  const selectedTypes = watch("rentalTypes") ?? [];

  const validationMessages = Object.values(errors)
    .map((issue) => issue?.message)
    .filter((message): message is string => Boolean(message));

  const toggleType = (type: RentalType) => {
    const next = selectedTypes.includes(type) ? selectedTypes.filter((item) => item !== type) : [...selectedTypes, type];
    setValue("rentalTypes", next, { shouldValidate: true });
  };

  return (
    <View style={styles.form} testID="search-form">
      {isSubmitted && validationMessages.length > 0 ? (
        <Card variant="accent" testID="search-form-validation-hint">
          <Text variant="subtitle">Revisa antes de guardar</Text>
          <Text>{validationMessages[0]}</Text>
          {validationMessages.length > 1 ? (
            <Text variant="caption">Y {validationMessages.length - 1} campo(s) más con errores.</Text>
          ) : null}
        </Card>
      ) : null}
      <Card testID="search-form-section-context">
        <Text variant="subtitle">Contexto</Text>
        <Text variant="caption">Nombre y zona te ayudan a reconocer esta búsqueda más adelante.</Text>
        <Field
          control={control}
          name="title"
          label="Nombre de la búsqueda"
          error={errors.title?.message}
          testID="search-form-title"
        />
        <Field control={control} name="city" label="Ciudad" error={errors.city?.message} testID="search-form-city" />
        <Field
          control={control}
          name="area"
          label="Zonas objetivo"
          error={errors.area?.message}
          placeholder="Centro, Arganzuela..."
          testID="search-form-area"
        />
      </Card>

      <Card testID="search-form-section-criteria">
        <Text variant="subtitle">Criterios</Text>
        <Field
          control={control}
          name="maxBudget"
          label="Presupuesto máximo (€/mes)"
          keyboardType="numeric"
          error={errors.maxBudget?.message}
          testID="search-form-budget"
        />
        <DateFieldController control={control} name="moveInDate" error={errors.moveInDate?.message} />
        <Field
          control={control}
          name="destinationLabel"
          label="Destino del trayecto"
          error={errors.destinationLabel?.message}
          placeholder="Oficina, universidad..."
          testID="search-form-destination"
        />
        <Text variant="caption">El trayecto pesa mucho en el ranking: indica a dónde irías cada día.</Text>
      </Card>

      <Card testID="search-form-section-types">
        <Text variant="subtitle">Tipos que buscas</Text>
        <Text variant="caption">Marca uno o varios. El scoring seguirá comparando cualquier opción guardada.</Text>
        <View style={styles.chips}>
          {rentalTypes.map((type) => (
            <Chip
              key={type}
              label={rentalTypeLabels[type]}
              active={selectedTypes.includes(type)}
              onPress={() => toggleType(type)}
              testID={`search-form-type-${type}`}
            />
          ))}
        </View>
        {errors.rentalTypes?.message ? <ChipError message={errors.rentalTypes.message} /> : null}
      </Card>

      <Button
        label={submitLabel}
        icon="checkmark-outline"
        onPress={handleSubmit(onSubmit)}
        testID="search-form-submit"
      />
    </View>
  );
}

function Field({
  control,
  name,
  label,
  error,
  testID,
  ...props
}: {
  control: Control<SearchFormInput>;
  name: FieldPath<SearchFormInput>;
  label: string;
  error?: string;
  testID?: string;
} & ComponentProps<typeof Input>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <Input
          {...props}
          testID={testID}
          label={label}
          value={value === undefined ? "" : String(value)}
          onChangeText={onChange}
          error={error}
        />
      )}
    />
  );
}

function DateFieldController({
  control,
  name,
  error,
}: {
  control: Control<SearchFormInput>;
  name: FieldPath<SearchFormInput>;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <DateField
          label="Fecha de entrada ideal"
          value={String(value ?? "")}
          onChange={onChange}
          error={error}
          testID="search-form-move-in"
        />
      )}
    />
  );
}

function ChipError({ message }: { message: string }) {
  const { colors } = useThemeColors();
  return <Text style={{ color: colors.danger }}>{message}</Text>;
}

function Chip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createChipStyles(colors), [colors]);

  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} testID={testID}>
      <Text variant="caption" style={active ? styles.chipTextActive : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

function createChipStyles(colors: ColorPalette) {
  return StyleSheet.create({
    chip: {
      backgroundColor: colors.inkSoft,
      borderColor: colors.border,
      borderRadius: radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    chipTextActive: {
      color: colors.surface,
    },
  });
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
