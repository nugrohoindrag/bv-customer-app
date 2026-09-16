// Komponen kecil: badge status, rating pill kuning, skeleton, empty/offline state, stepper, photo placeholder, stars.
import type { ReactNode } from "react";
import { Minus, Plus, Star, WifiOff } from "lucide-react";
import type { BookingStatus } from "@/api/types";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { NoInternetArt, NotFoundArt } from "@/components/illustrations";

/** Badge status booking Figma: UNPAID merah, PAID hijau, CHECK IN kuning, CHECK OUT/CANCELLED abu. */
export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const map: Record<BookingStatus, string> = {
    UNPAID: "bg-danger text-white",
    PAID: "bg-brand-500 text-white",
    "CHECK IN": "bg-star text-neutral-800",
    "CHECK OUT": "bg-neutral-500 text-white",
    CANCELLED: "bg-neutral-500 text-white",
    EXPIRED: "bg-neutral-500 text-white",
  };
  const label = status === "EXPIRED" ? "CANCELLED" : status;
  return (
    <span className={cn("inline-flex items-center rounded-r-full rounded-l-sm px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-wide", map[status], className)}>
      {label}
      {status === "EXPIRED" && <span className="ml-1 font-semibold normal-case opacity-90">· Hangus</span>}
    </span>
  );
}

/** Warna teks status di header Booking Details. */
export function statusColor(status: BookingStatus): string {
  return { UNPAID: "text-danger", PAID: "text-brand-400", "CHECK IN": "text-star", "CHECK OUT": "text-white", CANCELLED: "text-white", EXPIRED: "text-white" }[status];
}

/** Pil rating kuning "4.9 ★ | 112" (Figma kartu properti). */
export function RatingPill({ avg, count, className, compact }: { avg: number; count?: number; className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-r-full rounded-l-sm bg-star px-2 py-0.5 text-[10px] font-extrabold text-neutral-800", className)}>
      {avg > 0 ? avg.toFixed(1) : "Baru"}
      <Star size={10} fill="currentColor" />
      {!compact && count !== undefined && (
        <>
          <span className="opacity-40">|</span>
          {count}
        </>
      )}
    </span>
  );
}

export function Stars({ value, size = 28, onChange, className }: { value: number; size?: number; onChange?: (v: number) => void; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onChange} onClick={() => onChange?.(i)} aria-label={`${i} bintang`} className={cn("tap", onChange ? "cursor-pointer" : "cursor-default")}>
          <Star size={size} className={i <= value ? "text-star" : "text-neutral-300"} fill={i <= value ? "currentColor" : "none"} strokeWidth={1.6} />
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function EmptyState({ art = "notfound", title, body, action, className }: { art?: "notfound" | "offline"; title: string; body?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-8 py-10 text-center", className)}>
      <div className="mb-4 w-full max-w-[260px]">{art === "offline" ? <NoInternetArt /> : <NotFoundArt />}</div>
      <div className="text-[15px] font-bold">{title}</div>
      {body && <p className="mt-2 max-w-[280px] text-[11px] leading-4 text-neutral-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Kartu offline Figma "Yah, gada ada internet…" + Coba Lagi. */
export function OfflineCard({ onRetry, className }: { onRetry: () => void; className?: string }) {
  return (
    <div className={cn("mx-4 rounded-lg bg-card p-6 text-center shadow-float", className)}>
      <div className="mx-auto mb-4 w-full max-w-[220px]">
        <NoInternetArt />
      </div>
      <div className="text-[15px] font-bold">Yah, gada ada internet…</div>
      <p className="mt-2 text-[11px] leading-4 text-neutral-500">Coba cek koneksi WiFi atau kuota internetmu dan coba lagi nanti ya.</p>
      <Button className="mt-4 px-8" onClick={onRetry}>
        Coba Lagi
      </Button>
    </div>
  );
}

export function OfflineBanner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 bg-neutral-800 px-3 py-1.5 text-[11px] font-semibold text-white", className)}>
      <WifiOff size={14} /> Offline, data terakhir ditampilkan
    </div>
  );
}

/** Stepper − 2 + (jumlah tamu / anak / extra bed). */
export function Stepper({ value, min = 0, max = 99, onChange, disabled }: { value: number; min?: number; max?: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex items-center gap-3">
      <button type="button" disabled={disabled || value <= min} onClick={() => onChange(value - 1)} aria-label="Kurangi" className="tap flex h-7 w-7 items-center justify-center rounded-full border border-brand-500 text-brand-500 disabled:border-neutral-200 disabled:text-neutral-300">
        <Minus size={14} strokeWidth={3} />
      </button>
      <span className="min-w-6 text-center text-[14px] font-bold">{value}</span>
      <button type="button" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label="Tambah" className="tap flex h-7 w-7 items-center justify-center rounded-full border border-brand-500 text-brand-500 disabled:border-neutral-200 disabled:text-neutral-300">
        <Plus size={14} strokeWidth={3} />
      </button>
    </div>
  );
}

export function Divider({ className, dashed }: { className?: string; dashed?: boolean }) {
  return <div className={cn(dashed ? "dashed-line" : "h-px bg-border", className)} />;
}

export function Row({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 text-[12px]", className)}>
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
