import * as ImagePicker from "expo-image-picker";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, TextInput, View } from "react-native";

import { showAlert } from "@/utils/alert";

import { getRentalFormValidationError, RentalFormValues, toFormValues } from "@/components/RentalForm";
import { rentalTypeLabels } from "@/domain/labels";
import { parsePastedListingText } from "@/domain/listing-import/parse-text";
import { ParsedListing } from "@/domain/listing-import/types";
import {
  getScreenshotOcrSupport,
  ocrUnavailableMessage,
  recognizeListingScreenshot,
} from "@/domain/listing-import/screenshot-ocr";
import { parsedListingToFormValues, quickRating } from "@/domain/listing-import/to-form";
import { BathroomType, RentalType } from "@/domain/types";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Text } from "@/ui/Text";
import { ColorPalette, radius, spacing } from "@/ui/theme";
import { useThemeColors } from "@/ui/theme-context";

type IntakeMode = "paste" | "screenshot" | "guided";
type WizardStep = "start" | "paste" | "screenshot" | "confirm" | "basics" | "costs" | "fit" | "feel" | "review";

type RentalIntakeWizardProps = {
  defaultMonthlyPrice?: number;
  expressPaste?: boolean;
  onSave: (values: RentalFormValues) => void;
};

const EXAMPLE_LISTING = `Habitación luminosa en Chamberí
650 €/mes · gastos incluidos
Chamberí, Madrid
Amueblado · baño compartido`;

const rentalTypes: RentalType[] = ["room", "studio", "flat", "coliving", "other"];
const bathrooms: BathroomType[] = ["private", "shared", "unknown"];

const STEP_ORDER: Record<IntakeMode, WizardStep[]> = {
  paste: ["start", "paste", "basics", "costs", "fit", "feel", "review"],
  screenshot: ["start", "screenshot", "basics", "costs", "fit", "feel", "review"],
  guided: ["start", "basics", "costs", "fit", "feel", "review"],
};

const STEP_LABELS: Record<WizardStep, string> = {
  start: "Inicio",
  paste: "Pegar anuncio",
  screenshot: "Captura",
  confirm: "Confirmar",
  basics: "Qué es",
  costs: "Costes",
  fit: "Encaje",
  feel: "Valoración",
  review: "Revisar",
};

export function RentalIntakeWizard({ defaultMonthlyPrice, expressPaste = false, onSave }: RentalIntakeWizardProps) {
  const { colors } = useThemeColors();
  const styles = useWizardStyles();
  const [fullFlow, setFullFlow] = useState(false);
  const [mode, setMode] = useState<IntakeMode | null>(expressPaste ? "paste" : null);
  const [step, setStep] = useState<WizardStep>(expressPaste ? "paste" : "start");
  const [pasteText, setPasteText] = useState("");
  const [pasteUrl, setPasteUrl] = useState("");
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [lastParsed, setLastParsed] = useState<ParsedListing | null>(null);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const ocrSupport = useMemo(() => getScreenshotOcrSupport(), []);
  const [form, setForm] = useState<RentalFormValues>(() => {
    const base = toFormValues();
    if (defaultMonthlyPrice) {
      base.monthlyPrice = defaultMonthlyPrice;
      base.deposit = defaultMonthlyPrice;
    }
    return base;
  });

  const steps: WizardStep[] = useMemo(() => {
    if (!mode) return ["start"];
    if (expressPaste && !fullFlow && mode === "paste") return ["paste", "confirm"];
    return STEP_ORDER[mode];
  }, [mode, expressPaste, fullFlow]);
  const stepIndex = Math.max(0, steps.indexOf(step));
  const progress = steps.length > 1 ? (stepIndex + 1) / steps.length : 0;

  const detectedSummary = useMemo(() => {
    if (!parseMessage) return null;
    return parseMessage;
  }, [parseMessage]);

  const patch = (patchValues: Partial<RentalFormValues>) => setForm((current) => ({ ...current, ...patchValues }));

  const goNext = () => {
    const idx = steps.indexOf(step);
    if (idx < 0 || idx >= steps.length - 1) return;
    setStep(steps[idx + 1]);
  };

  const goBack = () => {
    const idx = steps.indexOf(step);
    if (idx <= 0) {
      if (step === "start" || (expressPaste && step === "paste")) return;
      setStep("start");
      setMode(null);
      setFullFlow(false);
      return;
    }
    setStep(steps[idx - 1]);
  };

  const startMode = (nextMode: IntakeMode) => {
    if (nextMode === "screenshot" && !ocrSupport.available) {
      showAlert("Captura no disponible aquí", ocrUnavailableMessage(ocrSupport.reason), [
        { text: "Pegar texto", onPress: () => startMode("paste") },
        { text: "Entendido", style: "cancel" },
      ]);
      return;
    }
    setMode(nextMode);
    setStep(nextMode === "paste" ? "paste" : nextMode === "screenshot" ? "screenshot" : "basics");
    setParseMessage(null);
    setScreenshotUri(null);
  };

  const pickScreenshot = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert("Permiso necesario", "Activa el acceso a fotos para elegir la captura del anuncio.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    const uri = result.assets[0].uri;
    setScreenshotUri(uri);
    setOcrLoading(true);
    setParseMessage(null);

    try {
      const ocr = await recognizeListingScreenshot(uri);
      setPasteText(ocr.text);
      setParseMessage(`Leí ${ocr.lineCount} líneas de la captura. Revisa el texto y pulsa Analizar.`);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "OCR_EMPTY") {
        showAlert(
          "Poco texto detectado",
          "Prueba con otra captura más nítida (título y precio visibles) o pega el texto manualmente.",
        );
      } else if (code.startsWith("OCR_UNAVAILABLE")) {
        showAlert("Captura no disponible", ocrUnavailableMessage(ocrSupport.available ? "device" : ocrSupport.reason));
      } else {
        showAlert("No se pudo leer la captura", "Edita el texto abajo o prueba con otra imagen.");
      }
    } finally {
      setOcrLoading(false);
    }
  };

  const analyzePaste = () => {
    if (pasteText.trim().length < 8) {
      showAlert("Pega más texto", "Copia título, precio o zona del anuncio para que podamos detectar datos.");
      return;
    }
    const parsed = parsePastedListingText(pasteText, pasteUrl);
    setLastParsed(parsed);
    setParseMessage(parsed.message);
    setForm(parsedListingToFormValues(parsed));
    if (expressPaste && !fullFlow) {
      setStep("confirm");
      return;
    }
    goNext();
  };

  const expandToFullFlow = () => {
    setFullFlow(true);
    setStep("basics");
  };

  const saveExpress = () => {
    // No inventar valoraciones: se usan las del formulario (neutras 5 por defecto).
    const normalized: RentalFormValues = {
      ...form,
      commuteMinutes:
        form.commuteMinutes !== undefined && !Number.isFinite(form.commuteMinutes) ? undefined : form.commuteMinutes,
    };
    if (normalized.title.trim().length < 3) {
      showAlert("Falta título", "Pon un nombre corto para reconocer esta opción.");
      return;
    }
    if (normalized.locationLabel.trim().length < 2) {
      showAlert("Falta zona", "Indica barrio o zona aunque sea aproximada.");
      return;
    }
    if (normalized.monthlyPrice <= 0) {
      showAlert("Precio inválido", "El alquiler mensual debe ser mayor que 0.");
      return;
    }
    onSave(normalized);
  };

  const validateStep = (): boolean => {
    if ((step === "paste" || step === "screenshot") && pasteText.trim().length < 8) {
      showAlert("Falta texto", "Necesitamos título, precio o zona del anuncio para detectar datos.");
      return false;
    }
    if (step === "basics") {
      if (form.title.trim().length < 3) {
        showAlert("Falta título", "Pon un nombre corto para reconocer esta opción.");
        return false;
      }
      if (form.locationLabel.trim().length < 2) {
        showAlert("Falta zona", "Indica barrio o zona aunque sea aproximada.");
        return false;
      }
    }
    if (step === "costs" && form.monthlyPrice <= 0) {
      showAlert("Precio inválido", "El alquiler mensual debe ser mayor que 0.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    goNext();
  };

  const save = () => {
    const normalized: RentalFormValues = {
      ...form,
      commuteMinutes:
        form.commuteMinutes !== undefined && !Number.isFinite(form.commuteMinutes) ? undefined : form.commuteMinutes,
      size: form.size !== undefined && !Number.isFinite(form.size) ? undefined : form.size,
    };
    const error = getRentalFormValidationError(normalized);
    if (error) {
      showAlert("Datos incompletos", error);
      return;
    }
    onSave(normalized);
  };

  return (
    <View style={styles.wrap} testID="intake-wizard">
      {step !== "start" ? (
        <View style={styles.progress}>
          <Text variant="caption">
            Paso {stepIndex + 1} de {steps.length} · {STEP_LABELS[step]}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      ) : null}

      {step === "start" ? (
        <Card testID="intake-start-card">
          <Text variant="subtitle">¿Cómo quieres añadir esta opción?</Text>
          <Text variant="caption">
            Captura el anuncio en el portal, pega el texto o responde preguntas. El asistente te guía en menos de 2 minutos.
          </Text>
          <View style={styles.actions}>
            <Button
              label="Pegar del anuncio"
              icon="clipboard-outline"
              onPress={() => startMode("paste")}
              testID="intake-paste-mode"
            />
            <Button label="Preguntas guiadas" variant="secondary" icon="chatbubble-ellipses-outline" onPress={() => startMode("guided")} />
            <Button
              label="Captura de pantalla"
              icon="image-outline"
              variant="secondary"
              onPress={() => startMode("screenshot")}
              disabled={!ocrSupport.available}
            />
          </View>
          {!ocrSupport.available ? (
            <Text variant="caption" style={styles.hint}>
              La lectura de capturas requiere la app compilada (no Expo Go). Usa pegar texto o el formulario.
            </Text>
          ) : (
            <Text variant="caption" style={styles.hint}>
              La captura se procesa en tu móvil; no subimos la imagen a ningún servidor.
            </Text>
          )}
          <Pressable onPress={() => router.push("/rental/quick" as Href)} testID="intake-quick-link">
            <Text variant="caption" style={styles.link}>
              Solo título, precio y zona (rápido)
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/rental/form" as Href)}>
            <Text variant="caption" style={styles.link}>
              Prefiero el formulario completo
            </Text>
          </Pressable>
        </Card>
      ) : null}

      {step === "screenshot" ? (
        <Card>
          <Text variant="subtitle">Importar desde captura</Text>
          <Text variant="caption">1. Haz captura en Idealista, Fotocasa, Badi… 2. Vuelve aquí y elige la imagen. 3. Revisa el texto leído.</Text>
          <View style={styles.privacyBadge}>
            <Text variant="caption" style={styles.privacyText}>
              Procesado en tu dispositivo
            </Text>
          </View>
          {screenshotUri ? (
            <Image source={{ uri: screenshotUri }} style={styles.preview} resizeMode="cover" accessibilityLabel="Vista previa de la captura" />
          ) : null}
          {ocrLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.accent} />
              <Text variant="caption">Leyendo texto de la captura…</Text>
            </View>
          ) : null}
          {detectedSummary ? <Text variant="caption">{detectedSummary}</Text> : null}
          <Text variant="caption">Texto detectado (editable)</Text>
          <TextInput
            value={pasteText}
            onChangeText={setPasteText}
            placeholder="El texto aparecerá aquí tras elegir la captura…"
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.input, styles.multiline]}
          />
          <View style={styles.row}>
            <Button label="Atrás" variant="secondary" onPress={goBack} />
            <Button label="Elegir captura" variant="secondary" icon="images-outline" onPress={pickScreenshot} disabled={ocrLoading} />
            <Button label="Analizar" icon="sparkles-outline" onPress={analyzePaste} disabled={ocrLoading} />
          </View>
        </Card>
      ) : null}

      {step === "paste" ? (
        <Card testID="intake-paste-card">
          <Text variant="subtitle">Pega el anuncio</Text>
          <Text variant="caption">
            {expressPaste
              ? "Abre el portal, copia título + precio + zona y pégalo aquí. No hace falta ordenarlo."
              : "Copia título, precio, zona y condiciones desde Idealista, Fotocasa, Badi, etc."}
          </Text>
          {expressPaste && !pasteText.trim() ? (
            <Button
              label="Probar con ejemplo"
              variant="secondary"
              icon="document-text-outline"
              onPress={() => setPasteText(EXAMPLE_LISTING)}
              testID="intake-paste-example"
            />
          ) : null}
          <Text variant="caption">URL del anuncio (opcional)</Text>
          <TextInput
            value={pasteUrl}
            onChangeText={setPasteUrl}
            placeholder="https://..."
            placeholderTextColor={colors.muted}
            keyboardType="url"
            autoCapitalize="none"
            style={styles.input}
            testID="intake-paste-url"
          />
          <Text variant="caption">Texto del anuncio</Text>
          <TextInput
            value={pasteText}
            onChangeText={setPasteText}
            placeholder="Pega aquí lo que ves en el portal..."
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.input, styles.multiline]}
            testID="intake-paste-text"
          />
          <View style={styles.row}>
            {!expressPaste ? <Button label="Atrás" variant="secondary" onPress={goBack} /> : null}
            <Button label="Analizar" icon="sparkles-outline" onPress={analyzePaste} testID="intake-paste-analyze" />
          </View>
        </Card>
      ) : null}

      {step === "confirm" ? (
        <Card testID="intake-confirm-card">
          <Text variant="subtitle">¿Guardamos esta opción?</Text>
          {parseMessage ? <Text variant="caption">{parseMessage}</Text> : null}
          {lastParsed?.detectedLabels.length ? (
            <View style={styles.detectedRow}>
              {lastParsed.detectedLabels.map((label) => (
                <Badge key={label} label={label} tone="good" />
              ))}
            </View>
          ) : null}
          <Field label="Título" value={form.title} onChange={(title) => patch({ title })} />
          <Field label="Zona o barrio" value={form.locationLabel} onChange={(locationLabel) => patch({ locationLabel })} />
          <View style={styles.twoCols}>
            <Field
              label="Alquiler €/mes"
              value={String(form.monthlyPrice)}
              onChange={(raw) => patch({ monthlyPrice: Number(raw) || 0 })}
              keyboardType="numeric"
            />
            <Field
              label="Fianza"
              value={String(form.deposit)}
              onChange={(raw) => patch({ deposit: Number(raw) || 0 })}
              keyboardType="numeric"
            />
          </View>
          <Field
            label="Trayecto (min, opcional)"
            value={form.commuteMinutes === undefined ? "" : String(form.commuteMinutes)}
            onChange={(raw) => {
              if (raw === "") {
                patch({ commuteMinutes: undefined });
                return;
              }
              const value = Number(raw);
              patch({ commuteMinutes: Number.isFinite(value) ? value : undefined });
            }}
            keyboardType="numeric"
          />
          <Text variant="caption">Valoración neutral hasta que la visites. Puedes afinar después en el detalle.</Text>
          <View style={styles.row}>
            <Button label="Atrás" variant="secondary" onPress={goBack} />
            <Button label="Guardar opción" icon="save-outline" onPress={saveExpress} testID="intake-confirm-save" />
          </View>
          <Pressable onPress={expandToFullFlow}>
            <Text variant="caption" style={styles.link}>
              Completar todos los campos (tipo, gastos, valoración…)
            </Text>
          </Pressable>
        </Card>
      ) : null}

      {step === "basics" ? (
        <Card>
          <Text variant="subtitle">Identifica la opción</Text>
          {detectedSummary ? <Text variant="caption">{detectedSummary}</Text> : null}
          <Field label="Título" value={form.title} onChange={(title) => patch({ title })} />
          <Field label="Zona o barrio" value={form.locationLabel} onChange={(locationLabel) => patch({ locationLabel })} />
          <Field label="URL (opcional)" value={form.sourceUrl ?? ""} onChange={(sourceUrl) => patch({ sourceUrl })} keyboardType="url" />
          <Text variant="caption">Tipo de vivienda</Text>
          <View style={styles.chips}>
            {rentalTypes.map((type) => (
              <Chip
                key={type}
                label={rentalTypeLabels[type]}
                active={form.rentalType === type}
                onPress={() => patch({ rentalType: type })}
              />
            ))}
          </View>
          <View style={styles.row}>
            <Button label="Atrás" variant="secondary" onPress={goBack} />
            <Button label="Siguiente" icon="arrow-forward-outline" onPress={handleNext} />
          </View>
        </Card>
      ) : null}

      {step === "costs" ? (
        <Card>
          <Text variant="subtitle">Costes mensuales</Text>
          <Text variant="caption">Usa el precio publicado. Si hay gastos aparte, indícalos abajo.</Text>
          <View style={styles.twoCols}>
            <Field
              label="Alquiler €/mes"
              value={String(form.monthlyPrice)}
              onChange={(raw) => patch({ monthlyPrice: Number(raw) || 0 })}
              keyboardType="numeric"
            />
            <Field
              label="Gastos estimados"
              value={String(form.estimatedBills)}
              onChange={(raw) => patch({ estimatedBills: Number(raw) || 0 })}
              keyboardType="numeric"
              disabled={form.billsIncluded}
            />
            <Field
              label="Fianza"
              value={String(form.deposit)}
              onChange={(raw) => patch({ deposit: Number(raw) || 0 })}
              keyboardType="numeric"
            />
            <Field
              label="Agencia"
              value={String(form.agencyFee)}
              onChange={(raw) => patch({ agencyFee: Number(raw) || 0 })}
              keyboardType="numeric"
            />
          </View>
          <Toggle
            label="Gastos incluidos en el precio"
            value={form.billsIncluded}
            onChange={(billsIncluded) => patch({ billsIncluded, estimatedBills: billsIncluded ? 0 : form.estimatedBills || 80 })}
          />
          <View style={styles.row}>
            <Button label="Atrás" variant="secondary" onPress={goBack} />
            <Button label="Siguiente" icon="arrow-forward-outline" onPress={handleNext} />
          </View>
        </Card>
      ) : null}

      {step === "fit" ? (
        <Card>
          <Text variant="subtitle">Encaje con tu búsqueda</Text>
          <Text variant="caption">El trayecto al destino pesa mucho en el ranking. Si no lo sabes, déjalo vacío por ahora.</Text>
          <View style={styles.twoCols}>
            <Field
              label="Trayecto (min)"
              value={form.commuteMinutes === undefined ? "" : String(form.commuteMinutes)}
              onChange={(raw) => {
                if (raw === "") {
                  patch({ commuteMinutes: undefined });
                  return;
                }
                const value = Number(raw);
                patch({ commuteMinutes: Number.isFinite(value) ? value : undefined });
              }}
              keyboardType="numeric"
            />
            <Field
              label="Tamaño m²"
              value={form.size === undefined ? "" : String(form.size)}
              onChange={(raw) => {
                if (raw === "") {
                  patch({ size: undefined });
                  return;
                }
                const value = Number(raw);
                patch({ size: Number.isFinite(value) ? value : undefined });
              }}
              keyboardType="numeric"
            />
          </View>
          <Toggle label="Amueblado" value={form.furnished} onChange={(furnished) => patch({ furnished })} />
          <Toggle label="Contrato disponible" value={form.contractAvailable} onChange={(contractAvailable) => patch({ contractAvailable })} />
          <Text variant="caption">Baño</Text>
          <View style={styles.chips}>
            {bathrooms.map((type) => (
              <Chip
                key={type}
                label={type === "private" ? "Privado" : type === "shared" ? "Compartido" : "Sin dato"}
                active={form.bathroomType === type}
                onPress={() => patch({ bathroomType: type })}
              />
            ))}
          </View>
          <View style={styles.row}>
            <Button label="Atrás" variant="secondary" onPress={goBack} />
            <Button label="Siguiente" icon="arrow-forward-outline" onPress={handleNext} />
          </View>
        </Card>
      ) : null}

      {step === "feel" ? (
        <Card>
          <Text variant="subtitle">Valoración rápida</Text>
          <Text variant="caption">Si aún no la has visitado, deja «Medio» o pulsa «Sin visitar».</Text>
          <RatingRow
            label="Zona"
            value={form.locationRating}
            onPick={(level) => patch({ locationRating: quickRating(level) })}
          />
          <RatingRow
            label="Calidad del piso"
            value={form.roomQualityRating}
            onPick={(level) => patch({ roomQualityRating: quickRating(level) })}
          />
          <RatingRow
            label="Sensación personal"
            value={form.personalFeelingRating}
            onPick={(level) => patch({ personalFeelingRating: quickRating(level) })}
          />
          <Button
            label="Sin visitar aún (neutral)"
            variant="secondary"
            onPress={() => patch({ locationRating: 7, roomQualityRating: 7, personalFeelingRating: 7 })}
          />
          <View style={styles.row}>
            <Button label="Atrás" variant="secondary" onPress={goBack} />
            <Button label="Revisar" icon="arrow-forward-outline" onPress={handleNext} />
          </View>
        </Card>
      ) : null}

      {step === "review" ? (
        <Card>
          <Text variant="subtitle">Revisar y guardar</Text>
          <ReviewLine label="Título" value={form.title} />
          <ReviewLine label="Zona" value={form.locationLabel} />
          <ReviewLine label="Tipo" value={rentalTypeLabels[form.rentalType]} />
          <ReviewLine label="Precio" value={`${form.monthlyPrice} €/mes`} />
          <ReviewLine
            label="Coste total est."
            value={`${form.monthlyPrice + (form.billsIncluded ? 0 : form.estimatedBills)} €/mes`}
          />
          {form.commuteMinutes ? <ReviewLine label="Trayecto" value={`${form.commuteMinutes} min`} /> : null}
          <ReviewLine label="Valoración" value={`${form.locationRating}/10 · ${form.roomQualityRating}/10 · ${form.personalFeelingRating}/10`} />
          <View style={styles.row}>
            <Button label="Atrás" variant="secondary" onPress={goBack} />
            <Button label="Guardar opción" icon="save-outline" onPress={save} />
          </View>
        </Card>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  keyboardType?: "default" | "numeric" | "url";
  disabled?: boolean;
}) {
  const { colors } = useThemeColors();
  const styles = useWizardStyles();

  return (
    <View style={styles.field}>
      <Text variant="caption">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        editable={!disabled}
        placeholderTextColor={colors.muted}
        style={[styles.input, disabled && styles.inputDisabled]}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useWizardStyles();

  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text variant="caption" style={active ? styles.chipTextActive : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const styles = useWizardStyles();

  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggle}>
      <Text>{label}</Text>
      <View style={[styles.switchTrack, value && styles.switchTrackActive]}>
        <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
      </View>
    </Pressable>
  );
}

function RatingRow({
  label,
  value,
  onPick,
}: {
  label: string;
  value: number;
  onPick: (level: "low" | "mid" | "high") => void;
}) {
  const styles = useWizardStyles();
  const active = value <= 5 ? "low" : value >= 8 ? "high" : "mid";

  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.chips}>
        <Chip label="Bajo" active={active === "low"} onPress={() => onPick("low")} />
        <Chip label="Medio" active={active === "mid"} onPress={() => onPick("mid")} />
        <Chip label="Alto" active={active === "high"} onPress={() => onPick("high")} />
      </View>
    </View>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  const styles = useWizardStyles();

  return (
    <View style={styles.reviewLine}>
      <Text variant="caption">{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

function useWizardStyles() {
  const { colors } = useThemeColors();
  return useMemo(() => createWizardStyles(colors), [colors]);
}

function createWizardStyles(colors: ColorPalette) {
  return StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  progress: {
    gap: spacing.xs,
  },
  progressBar: {
    backgroundColor: colors.inkSoft,
    borderRadius: radius.sm,
    height: 6,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.accent,
    height: "100%",
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  link: {
    color: colors.accent,
    marginTop: spacing.md,
    textAlign: "center",
  },
  hint: {
    marginTop: spacing.md,
    textAlign: "center",
  },
  privacyBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.inkSoft,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  privacyText: {
    color: colors.accent,
    fontWeight: "600",
  },
  preview: {
    borderRadius: radius.md,
    height: 160,
    marginTop: spacing.md,
    width: "100%",
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  field: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 130,
  },
  input: {
    backgroundColor: colors.inkSoft,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  multiline: {
    minHeight: 140,
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
  toggle: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: spacing.xs,
  },
  switchTrack: {
    backgroundColor: colors.inkSoft,
    borderRadius: 16,
    height: 28,
    padding: 3,
    width: 52,
  },
  switchTrackActive: {
    backgroundColor: colors.accent,
  },
  switchThumb: {
    backgroundColor: colors.surface,
    borderRadius: 11,
    height: 22,
    width: 22,
  },
  switchThumbActive: {
    transform: [{ translateX: 24 }],
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  ratingRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ratingLabel: {
    fontWeight: "600",
  },
  reviewLine: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  detectedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  });
}
