// Kartu booking Figma (Booking Section): foto kiri dengan badge status, nama, kota, rentang tanggal "for N Guest",
// aksi utama: Bayar (UNPAID) / Arahkan (PAID, CHECK IN) / Booking Lagi (history).
import { Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { BookingCard as Card } from "@/api/types";
import { Photo } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/misc";
import { stayRange } from "@/lib/format";
import { openDirections } from "@/lib/geo";

export function BookingCard({ b }: { b: Card }) {
  const nav = useNavigate();
  const open = () => nav(`/bookings/${b.booking_code}`);
  return (
    <div className="flex overflow-hidden rounded-md bg-card shadow-card">
      <button type="button" onClick={open} className="relative w-[104px] shrink-0">
        <Photo src={b.property.cover_photo_url} className="h-full w-full" />
        <StatusBadge status={b.status} className="absolute left-0 top-2" />
      </button>
      <div className="min-w-0 flex-1 p-2.5">
        <button type="button" onClick={open} className="block w-full text-left">
          <div className="truncate text-[11px] font-bold">{b.property.display_name}</div>
          <div className="mt-0.5 truncate text-[9px] text-brand-500">{b.property.city}</div>
          <div className="mt-1 text-[9px] text-neutral-500">
            {stayRange(b.check_in_at, b.check_out_at)} for {b.guests_total} Guest
          </div>
        </button>
        <div className="mt-2">
          {b.primary_action === "pay" && (
            <Button size="sm" block onClick={() => nav(`/bookings/${b.booking_code}/pay`)}>
              Bayar
            </Button>
          )}
          {b.primary_action === "direct" && (
            <Button size="sm" block onClick={() => openDirections(b.property.lat, b.property.lng)}>
              <Navigation size={12} /> Arahkan
            </Button>
          )}
          {(b.primary_action === "rebook" || b.primary_action === "none") && (
            <Button size="sm" block onClick={() => nav(`/property/${b.property.slug}`)}>
              Booking Lagi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
