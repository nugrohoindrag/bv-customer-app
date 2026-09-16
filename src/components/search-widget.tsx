// Widget Figma "Check In | Check Out | Room" + tombol kalender hijau. Tap kolom → halaman pilih tanggal / kamar & tamu.
import { CalendarDays, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/app/search";
import { dateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SearchWidget({ className, returnTo }: { className?: string; returnTo?: string }) {
  const nav = useNavigate();
  const s = useSearch();
  const state = returnTo ? { returnTo } : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const ciLabel = s.checkIn === today ? "Today" : s.checkIn === tomorrow ? "Tomorrow" : dateShort(s.checkIn);
  const coLabel = s.checkOut === tomorrow ? "Tomorrow" : dateShort(s.checkOut);
  return (
    <div className={cn("flex overflow-hidden rounded-md bg-card shadow-card ring-1 ring-border", className)}>
      <button type="button" onClick={() => nav("/search/dates", { state: { ...state, focus: "in" } })} className="tap flex-1 px-3 py-2 text-left">
        <div className="text-[9px] text-neutral-400">Check In</div>
        <div className="text-[11px] font-bold">{ciLabel}</div>
        <div className="text-[9px] text-neutral-400">14:00</div>
      </button>
      <div className="my-2 w-px bg-border" />
      <button type="button" onClick={() => nav("/search/dates", { state: { ...state, focus: "out" } })} className="tap flex-1 px-3 py-2 text-left">
        <div className="text-[9px] text-neutral-400">Check Out</div>
        <div className="text-[11px] font-bold">{coLabel}</div>
        <div className="text-[9px] text-neutral-400">12:00</div>
      </button>
      <div className="my-2 w-px bg-border" />
      <button type="button" onClick={() => nav("/search/guests", { state })} className="tap flex-1 px-3 py-2 text-left">
        <div className="text-[9px] text-neutral-400">Room</div>
        <div className="text-[11px] font-bold">
          {s.rooms.length} Room
        </div>
        <div className="text-[9px] text-neutral-400">{s.guests} Guest</div>
      </button>
      <button type="button" aria-label="Pilih tanggal" onClick={() => nav("/search/dates", { state })} className="tap flex w-12 items-center justify-center bg-brand-500 text-white">
        <CalendarDays size={20} />
      </button>
    </div>
  );
}

export function SearchBar({ value, onChange, onSubmit, placeholder = "Cari Hotel, Kota, atau Lokasi", className, autoFocus }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder?: string; className?: string; autoFocus?: boolean }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn("flex h-10 items-center gap-2 rounded-full bg-card px-4 shadow-card ring-1 ring-border", className)}
    >
      <Search size={16} className="shrink-0 text-brand-500" strokeWidth={2.5} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} enterKeyHint="search" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-neutral-400" />
    </form>
  );
}
