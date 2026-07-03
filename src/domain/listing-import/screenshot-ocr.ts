import { Platform } from "react-native";

import { normalizeOcrText } from "./normalize-ocr-text";

export type OcrUnavailableReason = "web" | "expo_go" | "device";

export type OcrSupport =
  | { available: true }
  | { available: false; reason: OcrUnavailableReason };

export type ScreenshotOcrResult = {
  text: string;
  lineCount: number;
};

function getOcrModule(): typeof import("expo-mlkit-ocr") | null {
  if (Platform.OS === "web") return null;
  try {
    return require("expo-mlkit-ocr") as typeof import("expo-mlkit-ocr");
  } catch {
    return null;
  }
}

export function getScreenshotOcrSupport(): OcrSupport {
  if (Platform.OS === "web") {
    return { available: false, reason: "web" };
  }
  const mod = getOcrModule();
  if (!mod) {
    return { available: false, reason: "expo_go" };
  }
  if (!mod.isSupported()) {
    return { available: false, reason: "device" };
  }
  return { available: true };
}

export function ocrUnavailableMessage(reason: OcrUnavailableReason): string {
  if (reason === "web") {
    return "La lectura de capturas solo está disponible en la app móvil.";
  }
  if (reason === "device") {
    return "Este dispositivo no admite reconocimiento de texto local.";
  }
  return "Necesitas compilar la app con soporte nativo (no funciona en Expo Go). Usa «Pegar del anuncio» o ejecuta npx expo run:android.";
}

export async function recognizeListingScreenshot(uri: string): Promise<ScreenshotOcrResult> {
  const support = getScreenshotOcrSupport();
  if (!support.available) {
    throw new Error(`OCR_UNAVAILABLE:${support.reason}`);
  }

  const mod = getOcrModule();
  if (!mod) {
    throw new Error("OCR_UNAVAILABLE:expo_go");
  }

  const recognition = await mod.recognizeText(uri);
  const text = normalizeOcrText(recognition.text ?? "");
  const lineCount = text.split("\n").filter(Boolean).length;

  if (text.length < 8) {
    throw new Error("OCR_EMPTY");
  }

  return { text, lineCount };
}
