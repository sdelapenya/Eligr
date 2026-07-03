export type VisitImpressionSignals = {
  pros: string[];
  cons: string[];
  warnings: string[];
  feelingBoost: number;
};

function excerpt(text: string, max = 56) {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export function getVisitImpressionSignals(impression: string): VisitImpressionSignals {
  const trimmed = impression.trim();
  if (!trimmed) {
    return { pros: [], cons: [], warnings: [], feelingBoost: 0 };
  }

  const lower = trimmed.toLowerCase();
  const snippet = excerpt(trimmed);

  if (/no convence|descart|peor de lo esperado/.test(lower)) {
    return {
      pros: [],
      cons: [`Tras la visita: «${snippet}».`],
      warnings: [],
      feelingBoost: -12,
    };
  }

  if (/dudas|confirmar|revisar/.test(lower)) {
    return {
      pros: [],
      cons: [],
      warnings: ["Quedan dudas tras la visita; conviene confirmar o repetir visita."],
      feelingBoost: -4,
    };
  }

  if (/me gust|mejor de lo esperado|encaja|luminos|recomend/.test(lower)) {
    return {
      pros: [`Tras la visita: «${snippet}».`],
      cons: [],
      warnings: [],
      feelingBoost: 8,
    };
  }

  return {
    pros: [`Nota de visita: «${snippet}».`],
    cons: [],
    warnings: [],
    feelingBoost: 0,
  };
}
