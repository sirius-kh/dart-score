"use client";

import { useEffect } from "react";

/**
 * `active` үед утасны дэлгэц унтрахаас сэргийлнэ (Screen Wake Lock API).
 * Зөвхөн HTTPS эсвэл localhost дээр ажиллана; дэмжихгүй бол юу ч хийхгүй.
 * Tab нуугдахад браузер lock-ийг сулладаг тул буцаж харагдахад дахин авна.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) sentinel.release();
        else lock = sentinel;
      } catch {
        // батарей хэмнэх горим гэх мэтээр татгалзсан — алгасна
      }
    };

    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      lock?.release();
    };
  }, [active]);
}
