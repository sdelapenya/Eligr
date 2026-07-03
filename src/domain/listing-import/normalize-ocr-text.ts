/** Limpia texto crudo de OCR antes de parsear el anuncio. */
export function normalizeOcrText(raw: string): string {
  const lines = raw
    .replace(/\r/g, "")
    .replace(/[|]/g, "l")
    .replace(/€/g, " €")
    .replace(/\s+€/g, " €")
    .replace(/(\d)[oO](?=\s*€)/g, "$10")
    .replace(/(\d)\s*,\s*(\d{2})\s*€/g, "$1,$2 €")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return lines.join("\n");
}
