"use client";

import { useEffect, useState } from "react";

/**
 * localStorage-той синк хийдэг useState.
 * SSR-safe: эхний render-д default утга, mount хийсний дараа хадгалсныг уншина.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  // Mount хийсний дараа localStorage-оос унших
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // буруу JSON эсвэл хүрэх боломжгүй — default-аар үлдэнэ
    }
    setHydrated(true);
  }, [key]);

  // Утга өөрчлөгдөх бүрд хадгалах (зөвхөн hydrate хийсний дараа)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // хадгалах боломжгүй (private mode гэх мэт) — алгасна
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated];
}
