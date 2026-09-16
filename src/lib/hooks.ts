import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

function calc(until: string | Date | null | undefined): number {
  if (!until) return 0;
  const d = typeof until === "string" ? new Date(until) : until;
  return Math.max(0, d.getTime() - Date.now());
}

/** Sisa milidetik hingga `until` (ISO/Date), diperbarui tiap detik (countdown deadline pembayaran). */
export function useCountdown(until: string | Date | null | undefined): number {
  const [left, setLeft] = useState(() => calc(until));
  useEffect(() => {
    setLeft(calc(until));
    if (!until) return;
    const t = setInterval(() => setLeft(calc(until)), 1000);
    return () => clearInterval(t);
  }, [until]);
  return left;
}

/** Countdown detik menurun (OTP 1:39 / Kirim Ulang); reset saat `key` berubah. */
export function useSecondsCountdown(initial: number, key: unknown): number {
  const [s, setS] = useState(initial);
  useEffect(() => {
    setS(initial);
    if (initial <= 0) return;
    const t = setInterval(() => setS((x) => (x <= 1 ? 0 : x - 1)), 1000);
    return () => clearInterval(t);
  }, [initial, key]);
  return s;
}
