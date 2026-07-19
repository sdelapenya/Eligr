import { useEffect, useRef, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Local draft state for a text field backed by a persisted store value.
 * Keeps typing responsive while writing to `onCommit` (and therefore to
 * AsyncStorage) only after the user pauses, instead of on every keystroke.
 * Stays in sync if `externalValue` changes from outside (import, reset...).
 */
export function useDebouncedTextField(
  externalValue: string,
  onCommit: (value: string) => void,
  delayMs = 400,
): [string, (value: string) => void] {
  const [draft, setDraft] = useState(externalValue);
  const lastCommitted = useRef(externalValue);

  useEffect(() => {
    if (externalValue !== lastCommitted.current) {
      lastCommitted.current = externalValue;
      setDraft(externalValue);
    }
  }, [externalValue]);

  useEffect(() => {
    if (draft === lastCommitted.current) return;
    const timer = setTimeout(() => {
      lastCommitted.current = draft;
      onCommit(draft);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [draft, delayMs, onCommit]);

  return [draft, setDraft];
}
