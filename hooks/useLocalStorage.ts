"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Түлхүүр бүрийн сүүлийн мөр (JSON). localStorage хүрэх боломжгүй (private mode гэх мэт)
// үед ч апп санах ойд ажилласаар байх эх сурвалж болно.
const memory = new Map<string, string | null>();
const listeners = new Set<() => void>();

function readRaw(key: string): string | null {
  if (!memory.has(key)) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      // хүрэх боломжгүй — null-оор үлдэнэ
    }
    memory.set(key, raw);
  }
  return memory.get(key) ?? null;
}

function writeRaw(key: string, raw: string) {
  memory.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // хадгалах боломжгүй — санах ойд л үлдэнэ
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Өөр tab-д өөрчлөгдвөл синк хийнэ
  const onStorage = (e: StorageEvent) => {
    if (e.key === null) memory.clear();
    else memory.set(e.key, e.newValue);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback; // буруу JSON — default
  }
}

const noopSubscribe = () => () => {};

/**
 * localStorage-той синк хийдэг useState.
 * SSR-safe: server болон hydration-ы render-д default утга, дараа нь хадгалсныг уншина.
 * Гурав дахь утга (`hydrated`) — клиент дээр localStorage уншигдсан эсэх.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  // defaultValue нь ихэвчлэн render бүрд шинэ объект биш (тогтмол) тул deps-д оруулна
  const value = useMemo(() => parse(raw, defaultValue), [raw, defaultValue]);

  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action) => {
      const prev = parse(readRaw(key), defaultValue);
      const next =
        typeof action === "function" ? (action as (p: T) => T)(prev) : action;
      writeRaw(key, JSON.stringify(next));
    },
    [key, defaultValue],
  );

  return [value, setValue, hydrated];
}
