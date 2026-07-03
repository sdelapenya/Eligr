import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { radius, spacing } from "./theme";
import { useThemeColors } from "./theme-context";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function addMonths(base: Date, months: number) {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarCells(viewMonth: Date) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; iso: string | null }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, iso: null });
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, iso: formatIsoDate(new Date(year, month, day)) });
  }
  return cells;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  testID?: string;
};

export function DateField({ label, value, onChange, error, testID }: DateFieldProps) {
  const { colors } = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const parsed = parseIsoDate(value);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parsed ?? new Date()));

  const presets = useMemo(() => {
    const today = new Date();
    return [
      { label: "1 mes", date: formatIsoDate(addMonths(today, 1)) },
      { label: "2 meses", date: formatIsoDate(addMonths(today, 2)) },
      { label: "3 meses", date: formatIsoDate(addMonths(today, 3)) },
      { label: "6 meses", date: formatIsoDate(addMonths(today, 6)) },
    ];
  }, []);

  const calendarCells = useMemo(() => buildCalendarCells(viewMonth), [viewMonth]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        field: { gap: spacing.xs },
        trigger: {
          alignItems: "center",
          backgroundColor: colors.inkSoft,
          borderColor: colors.border,
          borderRadius: radius.sm,
          borderWidth: StyleSheet.hairlineWidth,
          flexDirection: "row",
          justifyContent: "space-between",
          minHeight: 44,
          paddingHorizontal: spacing.md,
        },
        triggerError: { borderColor: colors.danger },
        triggerText: { color: colors.text, fontSize: 15, fontWeight: "600" },
        presets: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
        preset: {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.borderLight,
          borderRadius: radius.sm,
          borderWidth: StyleSheet.hairlineWidth,
          gap: spacing.xs,
          minWidth: "47%",
          padding: spacing.sm,
        },
        presetActive: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
        presetTextActive: { color: colors.accentDeep, fontWeight: "700" },
        calendar: { gap: spacing.sm },
        monthRow: {
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
        },
        monthNav: {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.sm,
          minWidth: 40,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        weekdayRow: {
          flexDirection: "row",
          justifyContent: "space-between",
        },
        weekday: {
          color: colors.muted,
          flex: 1,
          fontSize: 12,
          fontWeight: "700",
          textAlign: "center",
        },
        dayGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
        },
        dayCell: {
          alignItems: "center",
          aspectRatio: 1,
          justifyContent: "center",
          width: `${100 / 7}%`,
        },
        dayButton: {
          alignItems: "center",
          borderRadius: radius.pill,
          height: 36,
          justifyContent: "center",
          width: 36,
        },
        dayButtonActive: {
          backgroundColor: colors.accent,
        },
        dayTextActive: {
          color: colors.surface,
          fontWeight: "700",
        },
        error: { color: colors.danger },
      }),
    [colors],
  );

  const displayValue = parsed ? formatDisplayDate(parsed) : value || "Sin fecha";

  const shiftMonth = (delta: number) => {
    setViewMonth((current) => startOfMonth(addMonths(current, delta)));
  };

  const selectDate = (iso: string) => {
    onChange(iso);
    setExpanded(false);
  };

  return (
    <View style={styles.field}>
      <Text variant="caption">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayValue}`}
        onPress={() => setExpanded((current) => !current)}
        style={[styles.trigger, error ? styles.triggerError : undefined]}
        testID={testID}
      >
        <Text style={styles.triggerText}>{displayValue}</Text>
        <Text variant="caption">{expanded ? "Ocultar" : "Elegir"}</Text>
      </Pressable>
      {expanded ? (
        <>
          <View style={styles.presets}>
            {presets.map((preset) => {
              const active = value === preset.date;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => selectDate(preset.date)}
                  style={[styles.preset, active && styles.presetActive]}
                >
                  <Text variant="caption" style={active ? styles.presetTextActive : undefined}>
                    {preset.label}
                  </Text>
                  <Text variant="caption">{preset.date}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.calendar}>
            <View style={styles.monthRow}>
              <Pressable accessibilityLabel="Mes anterior" onPress={() => shiftMonth(-1)} style={styles.monthNav}>
                <Text variant="subtitle">‹</Text>
              </Pressable>
              <Text variant="subtitle">
                {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </Text>
              <Pressable accessibilityLabel="Mes siguiente" onPress={() => shiftMonth(1)} style={styles.monthNav}>
                <Text variant="subtitle">›</Text>
              </Pressable>
            </View>
            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label) => (
                <Text key={label} style={styles.weekday}>
                  {label}
                </Text>
              ))}
            </View>
            <View style={styles.dayGrid}>
              {calendarCells.map((cell, index) => {
                if (!cell.day || !cell.iso) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }
                const active = value === cell.iso;
                return (
                  <View key={cell.iso} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={`Día ${cell.day}`}
                      onPress={() => selectDate(cell.iso!)}
                      style={[styles.dayButton, active && styles.dayButtonActive]}
                    >
                      <Text style={active ? styles.dayTextActive : undefined}>{cell.day}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      ) : null}
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function formatDisplayDate(date: Date) {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
  return `${day} ${month} ${date.getFullYear()}`;
}
