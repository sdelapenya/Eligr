export function daysUntilMoveIn(moveInDate: string): number | null {
  const match = moveInDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatMoveInCountdown(moveInDate: string): string | null {
  const days = daysUntilMoveIn(moveInDate);
  if (days === null) return null;
  if (days < 0) return `Entrada hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Entrada hoy";
  if (days === 1) return "Entrada mañana";
  return `Entrada en ${days} días`;
}
