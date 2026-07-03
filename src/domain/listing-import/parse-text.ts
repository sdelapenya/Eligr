import { BathroomType, RentalType } from "../types";
import { ParsedListing } from "./types";

function parseEuroAmount(raw?: string | number | null): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const normalized = String(raw)
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function firstPriceInText(text: string): number | undefined {
  const match = text.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)(?:[.,]\d+)?\s*€/i);
  if (!match) return undefined;
  return parseEuroAmount(match[0]);
}

function extractUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s)]+/i);
  return match?.[0].replace(/[),.]+$/, "");
}

function extractTitle(lines: string[]): string | undefined {
  const candidate = lines.find((line) => line.length >= 8 && !/€|eur|idealista|fotocasa|pisos\.com|badi/i.test(line));
  return candidate?.slice(0, 120);
}

const CITY_NAMES = "Madrid|Barcelona|Valencia|Sevilla|Málaga|Malaga|Bilbao|Zaragoza|Murcia|Alicante";

function extractLocation(text: string): string | undefined {
  const patterns = [
    new RegExp(`(?:en|zona|barrio)\\s+([A-Za-zÀ-ÿ0-9\\s\\-']{3,40})`, "i"),
    new RegExp(`,\\s*([A-Za-zÀ-ÿ\\s\\-']{3,30})\\s*,\\s*(?:${CITY_NAMES})`, "i"),
    new RegExp(`(?:${CITY_NAMES})\\s*,\\s*([A-Za-zÀ-ÿ\\s\\-']{3,30})`, "i"),
    new RegExp(`\\b([A-Za-zÀ-ÿ\\s\\-']{3,30})\\s*,\\s*(?:${CITY_NAMES})\\b`, "i"),
    /Distrito\s+([A-Za-zÀ-ÿ\s\-']{3,30})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value && value.length >= 3) return value;
  }
  return undefined;
}

function extractSize(text: string): number | undefined {
  const match = text.match(/(\d{1,3}(?:[.,]\d+)?)\s*m(?:²|2)\b/i);
  return match ? parseEuroAmount(match[1]) : undefined;
}

function extractDeposit(text: string, monthlyPrice?: number): number | undefined {
  const monthsMatch = text.match(/fianza[^0-9]{0,20}(\d+)\s*mes/i);
  if (monthsMatch && monthlyPrice) return monthlyPrice * Number(monthsMatch[1]);
  const amountMatch = text.match(/fianza[^0-9]{0,12}(\d{2,5})\s*€?/i);
  return amountMatch ? parseEuroAmount(amountMatch[1]) : undefined;
}

function detectRentalType(lower: string): RentalType | undefined {
  if (/habitaci[oó]n|\broom\b/i.test(lower)) return "room";
  if (/estudio|\bstudio\b/i.test(lower)) return "studio";
  if (/piso|[áa]tico|duplex|ático/i.test(lower)) return "flat";
  if (/coliving/i.test(lower)) return "coliving";
  return undefined;
}

const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  monthlyPrice: "Precio",
  locationLabel: "Zona",
  size: "Tamaño",
  deposit: "Fianza",
  rentalType: "Tipo",
  billsIncluded: "Gastos incluidos",
  furnished: "Amueblado",
  contractAvailable: "Contrato",
};

export function parsePastedListingText(rawText: string, optionalUrl?: string): ParsedListing {
  const text = rawText.replace(/\r/g, "").trim();
  if (text.length < 8) {
    return {
      confidence: "low",
      message: "Pega al menos el título, precio o zona del anuncio.",
      detectedLabels: [],
    };
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const lower = text.toLowerCase();
  const sourceUrl = optionalUrl?.trim() || extractUrl(text);
  const monthlyPrice = firstPriceInText(text);
  const title = extractTitle(lines) ?? lines[0];
  const locationLabel = extractLocation(text);
  const size = extractSize(text);
  const deposit = extractDeposit(text, monthlyPrice);
  const rentalType = detectRentalType(lower);
  const bathroomType: BathroomType | undefined = /baño privado|bano privado/i.test(lower)
    ? "private"
    : /baño compartido|bano compartido/i.test(lower)
      ? "shared"
      : undefined;

  const parsed = {
    title,
    sourceUrl,
    monthlyPrice,
    locationLabel,
    size,
    deposit,
    rentalType,
    bathroomType,
    billsIncluded: /gastos incluidos/i.test(text) ? true : /gastos no incluidos|sin gastos incluidos/i.test(text) ? false : undefined,
    furnished: /amueblad/i.test(text) ? true : /sin amueblar/i.test(text) ? false : undefined,
    contractAvailable: /contrato de arrendamiento|contrato disponible/i.test(text) ? true : undefined,
    agencyFee: /honorarios|comisi[oó]n de agencia|agencia/i.test(text)
      ? firstPriceInText(text.split(/agencia|honorarios/i)[1] ?? "")
      : undefined,
    notes: lines.slice(0, 5).join(" · "),
  };

  const detectedLabels = Object.entries(parsed)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key]) => FIELD_LABELS[key] ?? key);

  const confidence =
    parsed.title && parsed.monthlyPrice && parsed.locationLabel ? "high" : parsed.title || parsed.monthlyPrice ? "partial" : "low";

  const message =
    confidence === "high"
      ? `Detecté ${detectedLabels.length} datos. Revisa y completa trayecto y valoración.`
      : confidence === "partial"
        ? "Detecté algunos datos. Completa lo que falte en los siguientes pasos."
        : "No pude extraer mucho. Rellena los pasos con calma.";

  return { ...parsed, confidence, message, detectedLabels };
}
