import { zodResolver } from "@hookform/resolvers/zod";
import { Control, Controller, FieldPath, useForm } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { ComponentProps } from "react";
import { z } from "zod";

import { RentalPhotoPicker } from "@/components/RentalPhotoPicker";
import { rentalTypeLabels } from "@/domain/labels";
import { BathroomType, RentalOption, RentalStatus, RentalType } from "@/domain/types";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Input } from "@/ui/Input";
import { Text } from "@/ui/Text";
import { radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

const optionalNumber = z.preprocess((value) => (value === "" || value === undefined ? undefined : Number(value)), z.number().optional());

const rentalSchema = z.object({
  title: z.string().min(3, "Pon un título reconocible."),
  sourceUrl: z.string().optional(),
  rentalType: z.enum(["room", "studio", "flat", "coliving", "other"]),
  monthlyPrice: z.coerce.number().positive("El precio debe ser mayor que 0."),
  billsIncluded: z.boolean(),
  estimatedBills: z.coerce.number().min(0),
  deposit: z.coerce.number().min(0),
  agencyFee: z.coerce.number().min(0),
  locationLabel: z.string().min(2, "Añade zona o barrio."),
  commuteMinutes: optionalNumber,
  size: optionalNumber,
  furnished: z.boolean(),
  bathroomType: z.enum(["private", "shared", "unknown"]),
  contractAvailable: z.boolean(),
  availableDate: z.string().optional(),
  status: z.enum(["new", "contacted", "visit_planned", "visited", "favorite", "discarded"]),
  notes: z.string(),
  photoUri: z.string().optional(),
  locationRating: z.coerce.number().min(1).max(10),
  roomQualityRating: z.coerce.number().min(1).max(10),
  personalFeelingRating: z.coerce.number().min(1).max(10),
});

export type RentalFormValues = z.output<typeof rentalSchema>;
type RentalFormInput = z.input<typeof rentalSchema>;

export function getRentalFormValidationError(values: RentalFormValues): string | undefined {
  const result = rentalSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues[0]?.message ?? "Revisa los datos del alquiler.";
}

const rentalTypes: RentalType[] = ["room", "studio", "flat", "coliving", "other"];
const bathrooms: BathroomType[] = ["private", "shared", "unknown"];

export function toFormValues(option?: RentalOption): RentalFormValues {
  return {
    title: option?.title ?? "",
    sourceUrl: option?.sourceUrl ?? "",
    rentalType: option?.rentalType ?? "room",
    monthlyPrice: option?.monthlyPrice ?? 700,
    billsIncluded: option?.billsIncluded ?? false,
    estimatedBills: option?.estimatedBills ?? 0,
    deposit: option?.deposit ?? 0,
    agencyFee: option?.agencyFee ?? 0,
    locationLabel: option?.locationLabel ?? "",
    commuteMinutes: option?.commuteMinutes,
    size: option?.size,
    furnished: option?.furnished ?? false,
    bathroomType: option?.bathroomType ?? "unknown",
    contractAvailable: option?.contractAvailable ?? false,
    availableDate: option?.availableDate ?? "",
    status: option?.status ?? "new",
    notes: option?.notes ?? "",
    photoUri: option?.photoUri ?? "",
    locationRating: option?.locationRating ?? 5,
    roomQualityRating: option?.roomQualityRating ?? 5,
    personalFeelingRating: option?.personalFeelingRating ?? 5,
  };
}

type RentalFormProps = {
  initialValues?: RentalOption;
  submitLabel: string;
  onSubmit: (values: RentalFormValues) => void;
};

export function RentalForm({ initialValues, submitLabel, onSubmit }: RentalFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<RentalFormInput, unknown, RentalFormValues>({
    resolver: zodResolver(rentalSchema),
    defaultValues: toFormValues(initialValues),
  });

  const rentalType = watch("rentalType");
  const bathroomType = watch("bathroomType");
  const billsIncluded = watch("billsIncluded");
  const furnished = watch("furnished");
  const contractAvailable = watch("contractAvailable");
  const photoUri = watch("photoUri");

  const validationMessages = Object.values(errors)
    .map((issue) => issue?.message)
    .filter((message): message is string => Boolean(message));

  return (
    <View style={styles.form} testID="rental-form">
      {isSubmitted && validationMessages.length > 0 ? (
        <Card variant="accent" testID="rental-form-validation-hint">
          <Text variant="subtitle">Revisa antes de guardar</Text>
          <Text>{validationMessages[0]}</Text>
          {validationMessages.length > 1 ? (
            <Text variant="caption">Y {validationMessages.length - 1} campo(s) más con errores.</Text>
          ) : null}
        </Card>
      ) : null}

      <Card testID="rental-form-section-basics">
        <Text variant="subtitle">Datos básicos</Text>
        <RentalPhotoPicker value={photoUri || undefined} onChange={(uri) => setValue("photoUri", uri ?? "")} />
        <Field control={control} name="title" label="Título" error={errors.title?.message} testID="rental-form-title" />
        <Field control={control} name="sourceUrl" label="URL del anuncio" keyboardType="url" testID="rental-form-source-url" />
        <Field
          control={control}
          name="locationLabel"
          label="Zona o barrio"
          error={errors.locationLabel?.message}
          testID="rental-form-location"
        />
        <Text variant="caption">Tipo</Text>
        <View style={styles.chips}>
          {rentalTypes.map((type) => (
            <Chip
              key={type}
              label={rentalTypeLabels[type]}
              active={rentalType === type}
              onPress={() => setValue("rentalType", type)}
              testID={`rental-form-type-${type}`}
            />
          ))}
        </View>
      </Card>

      <Card testID="rental-form-section-costs">
        <Text variant="subtitle">Costes</Text>
        <View style={styles.twoCols}>
          <Field
            control={control}
            name="monthlyPrice"
            label="Precio mensual"
            keyboardType="numeric"
            error={errors.monthlyPrice?.message}
            testID="rental-form-monthly-price"
          />
          <Field control={control} name="estimatedBills" label="Gastos estimados" keyboardType="numeric" />
          <Field control={control} name="deposit" label="Fianza" keyboardType="numeric" />
          <Field control={control} name="agencyFee" label="Agencia" keyboardType="numeric" />
        </View>
        <Toggle label="Gastos incluidos" value={billsIncluded} onChange={(value) => setValue("billsIncluded", value)} />
      </Card>

      <Card testID="rental-form-section-fit">
        <Text variant="subtitle">Encaje</Text>
        <View style={styles.twoCols}>
          <Field
            control={control}
            name="commuteMinutes"
            label="Trayecto min"
            keyboardType="numeric"
            placeholder="45"
            testID="rental-form-commute"
          />
          <Field control={control} name="size" label="Tamaño m²" keyboardType="numeric" />
          <Field control={control} name="availableDate" label="Fecha disponible" placeholder="2026-07-01" />
          <Field control={control} name="locationRating" label="Zona 1-10" keyboardType="numeric" />
          <Field control={control} name="roomQualityRating" label="Calidad 1-10" keyboardType="numeric" />
          <Field control={control} name="personalFeelingRating" label="Sensación 1-10" keyboardType="numeric" />
        </View>
        <Toggle label="Amueblado" value={furnished} onChange={(value) => setValue("furnished", value)} />
        <Toggle label="Contrato disponible" value={contractAvailable} onChange={(value) => setValue("contractAvailable", value)} />
        <Text variant="caption">Baño</Text>
        <View style={styles.chips}>
          {bathrooms.map((type) => (
            <Chip key={type} label={type === "private" ? "Privado" : type === "shared" ? "Compartido" : "Sin dato"} active={bathroomType === type} onPress={() => setValue("bathroomType", type)} />
          ))}
        </View>
      </Card>

      <Card testID="rental-form-section-notes">
        <Text variant="subtitle">Notas</Text>
        <Field control={control} name="notes" label="Notas" multiline testID="rental-form-notes" />
      </Card>

      <Button label={submitLabel} icon="save-outline" onPress={handleSubmit(onSubmit)} testID="rental-form-submit" />
    </View>
  );
}

function Field({
  control,
  name,
  label,
  error,
  ...props
}: {
  control: Control<RentalFormInput>;
  name: FieldPath<RentalFormInput>;
  label: string;
  error?: string;
} & ComponentProps<typeof Input>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <Input
          {...props}
          label={label}
          value={value === undefined ? "" : String(value)}
          onChangeText={onChange}
          error={error}
          style={props.multiline ? styles.multiline : undefined}
        />
      )}
    />
  );
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
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.text : colors.inkSoft, borderColor: active ? colors.text : colors.border },
      ]}
    >
      <Text variant="caption" style={active ? { color: colors.surface } : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const { colors } = useThemeColors();
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggle}>
      <Text>{label}</Text>
      <View style={[styles.switchTrack, { backgroundColor: value ? colors.accent : colors.inkSoft }]}>
        <View style={[styles.switchThumb, { backgroundColor: colors.surface }, value && styles.switchThumbActive]} />
      </View>
    </Pressable>
  );
}

export type RentalFormPatch = Omit<
  RentalOption,
  "id" | "searchId" | "createdAt" | "updatedAt" | "visitChecklist" | "visitImpression" | "visitNextAction"
>;

export function normalizeFormValues(values: RentalFormValues): RentalFormPatch {
  return {
    ...values,
    sourceUrl: values.sourceUrl?.trim() || undefined,
    availableDate: values.availableDate?.trim() || undefined,
    photoUri: values.photoUri?.trim() || undefined,
    commuteMinutes: values.commuteMinutes,
    size: values.size,
    status: values.status as RentalStatus,
  };
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  field: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 130,
  },
  multiline: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  twoCols: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggle: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  switchTrack: {
    borderRadius: 16,
    height: 28,
    padding: 3,
    width: 52,
  },
  switchThumb: {
    borderRadius: 11,
    height: 22,
    width: 22,
  },
  switchThumbActive: {
    transform: [{ translateX: 24 }],
  },
});
