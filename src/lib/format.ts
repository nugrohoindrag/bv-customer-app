// Format Indonesia: rupiah, tanggal (Figma: "Fri, 24 Jul 2020", "02:00, 12 Juni - 12:00, 13 Juni 2020 for 2 Guest"), countdown.
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { id as localeID } from "date-fns/locale";

export function rupiah(n: number | null | undefined, withPrefix = true): string {
  if (n === null || n === undefined) return "-";
  const s = Math.round(n).toLocaleString("id-ID");
  return withPrefix ? "Rp " + s : s;
}

export function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = parseISO(v);
  return isNaN(d.getTime()) ? null : d;
}

export function ymd(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** "Fri, 24 Jul 2020" (Figma Booking Details). */
export function dateLong(v: string | Date | null | undefined): string {
  const d = toDate(v);
  return d ? format(d, "EEE, d MMM yyyy", { locale: localeID }) : "-";
}

/** "Jum, 24 Jul" (Figma Booking Setup tab). */
export function dateShort(v: string | Date | null | undefined): string {
  const d = toDate(v);
  return d ? format(d, "EEE, d MMM", { locale: localeID }) : "-";
}

/** "14:00, 25 Sep - 12:00, 26 Sep 2026" (Figma kartu booking). */
export function stayRange(checkIn: string | Date, checkOut: string | Date): string {
  const a = toDate(checkIn), b = toDate(checkOut);
  if (!a || !b) return "-";
  return `${format(a, "HH:mm, d MMM", { locale: localeID })} - ${format(b, "HH:mm, d MMM yyyy", { locale: localeID })}`;
}

/** "19 Juli, 12:00" (Figma Inbox). */
export function dateTimeInbox(v: string | Date): string {
  const d = toDate(v);
  return d ? format(d, "d MMMM, HH:mm", { locale: localeID }) : "-";
}

/** "( sebelum Rabu, 15 Apr 2020, 14:00 )" (Figma countdown). */
export function deadlineText(v: string | Date | null | undefined): string {
  const d = toDate(v);
  return d ? format(d, "EEEE, d MMM yyyy, HH:mm", { locale: localeID }) : "-";
}

export function nightsBetween(checkIn: string | Date, checkOut: string | Date): number {
  const a = toDate(checkIn), b = toDate(checkOut);
  if (!a || !b) return 0;
  return Math.max(0, differenceInCalendarDays(b, a));
}

/** Countdown "5 Jam : 0 Menit : 0 Detik" */
export function countdownParts(ms: number): { h: number; m: number; s: number } {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}

export function mmss(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Nomor lokal tanpa +62 untuk input Figma ("+62 | 8123456789"). */
export function localPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  return e164.replace(/^\+?62/, "").replace(/^0/, "");
}

export function e164(local: string): string {
  const digits = local.replace(/\D/g, "").replace(/^0/, "").replace(/^62/, "");
  return "+62" + digits;
}

export function km(v: number | null | undefined): string {
  if (v === null || v === undefined) return "";
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} km dari Anda`;
}
