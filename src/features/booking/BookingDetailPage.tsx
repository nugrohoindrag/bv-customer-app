// Figma STATUS - PAYMENT "Booking Details": foto + countdown deadline (UNPAID) + "Status Booking : UNPAID/PAID/CHECK IN/
// CHECK OUT/CANCELLED"; Booking ID + salin; tamu; tipe x n; Check In/Out; Arahkan / Hubungi Hotel; Policies; Manage Your
// Booking (Cancel, Modify Guest Data); Beri Rating (CHECK OUT); footer Total Tagihan + Bayar Sekarang / Booking Lagi.
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Copy, Navigation, Phone, Star } from "lucide-react";
import { api } from "@/api";
import type { Booking } from "@/api/types";
import { useAuth } from "@/app/auth";
import { Photo } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { Divider, OfflineCard, Skeleton, Stars, statusColor } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { StickyFooter, TopBar } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { countdownParts, dateLong, deadlineText, rupiah } from "@/lib/format";
import { callPhone, openDirections, openWhatsApp } from "@/lib/geo";
import { useCountdown } from "@/lib/hooks";
import { STAR_LABELS } from "@/lib/rating";
import { copyText, initials } from "@/lib/utils";
import { statusDef } from "@/lib/status-map";

export function useBooking(code: string) {
  return useQuery({ queryKey: ["booking", code], queryFn: () => api.booking(code), refetchInterval: (q) => (q.state.data?.status === "UNPAID" ? 30_000 : false) });
}

export default function BookingDetailPage() {
  const { code = "" } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const { customer } = useAuth();
  const q = useBooking(code);
  const [policySheet, setPolicySheet] = useState(false);
  const toasted = useRef(false);

  useEffect(() => {
    const t = (loc.state as { toast?: string } | null)?.toast;
    if (t && !toasted.current) {
      toasted.current = true;
      toast.success(t);
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const b = q.data;
  if (q.isError && !b) {
    return (
      <div className="app-shell flex min-h-dvh flex-col">
        <TopBar title="Booking Details" />
        <div className="py-10">
          <OfflineCard onRetry={() => q.refetch()} />
        </div>
      </div>
    );
  }

  const isHistory = b && ["CHECK OUT", "CANCELLED", "EXPIRED"].includes(b.status);
  const roomsLine = b ? summarizeRooms(b) : "";
  const showPay = b?.status === "UNPAID";
  const proofPending = b?.payment?.status === "proof_submitted";

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-surface">
      <TopBar title="Booking Details" onBack={() => nav("/bookings", { state: { scope: isHistory ? "history" : "upcoming" } })} />
      {!b ? (
        <div className="space-y-3 p-4">
          <Skeleton className="aspect-[16/9]" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          <div className="relative aspect-[16/9] bg-neutral-800">
            <Photo src={b.property.cover_photo_url} className="h-full w-full opacity-80" />
            {showPay && b.payment_deadline_at && !proofPending && <Countdown until={b.payment_deadline_at} />}
            {proofPending && (
              <div className="absolute left-4 right-4 top-4 rounded-sm bg-black/60 p-2 text-center text-white">
                <div className="text-[10px]">Bukti transfer sedang diverifikasi</div>
                <div className="text-[9px] opacity-80">Status berubah PAID setelah dikonfirmasi pihak hotel.</div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-4 py-2 text-white">
              <span className="text-[12px] font-bold">Status Booking {showPay && ":"}</span>
              <span className={`text-[12px] font-extrabold ${statusColor(b.status)}`}>
                {b.status === "EXPIRED" ? "CANCELLED" : b.status}
                {b.status === "EXPIRED" && <span className="ml-1 text-[9px] font-semibold opacity-80">({statusDef("bvrooms_booking_customer", "EXPIRED")?.label_id ?? "Hangus"})</span>}
              </span>
            </div>
          </div>

          <div className="mx-4 mt-3 rounded-md bg-card p-4 shadow-card">
            <div className="text-[13px] font-extrabold">{b.property.display_name}</div>
            <div className="mt-0.5 text-[9px] text-neutral-400">{[b.property.address_line, b.property.city].filter(Boolean).join(", ")}</div>
            <Divider dashed className="my-3" />
            <div className="flex items-center justify-between">
              <div className="text-[11px]">
                <span className="font-bold">Booking ID : </span>
                <span className="font-semibold">{b.booking_code}</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (await copyText(b.booking_code)) toast.success("Booking ID disalin");
                }}
                className="flex items-center gap-1 text-[9px] text-brand-500"
              >
                salin booking id <Copy size={12} />
              </button>
            </div>
            <div className="mt-2 text-[11px] font-bold">{b.guest.full_name}</div>
            <div className="text-[10px] text-neutral-500">{roomsLine}</div>
            <Divider className="my-3" />
            <div className="grid grid-cols-2 divide-x divide-border">
              <div>
                <div className="text-[9px] text-neutral-400">Check In</div>
                <div className="text-[11px] font-bold">{dateLong(b.check_in_date)}</div>
              </div>
              <div className="pl-3">
                <div className="text-[9px] text-neutral-400">Check Out</div>
                <div className="text-[11px] font-bold">{dateLong(b.check_out_date)}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button size="sm" onClick={() => openDirections(b.property.lat, b.property.lng)}>
                <Navigation size={12} /> Arahkan
              </Button>
              <Button size="sm" onClick={() => (b.property.whatsapp ? openWhatsApp(b.property.whatsapp, `Halo, saya ${b.guest.full_name}, Booking ID ${b.booking_code}`) : b.property.phone ? callPhone(b.property.phone) : toast.error("Kontak hotel belum tersedia"))}>
                <Phone size={12} /> Hubungi Hotel
              </Button>
            </div>
          </div>

          <Card title="Policies">
            <ul className="space-y-0.5 text-[10px] leading-4 text-neutral-600">
              {b.property.policies.slice(0, 3).map((x, i) => (
                <li key={i}>- {x}</li>
              ))}
            </ul>
            <div className="mt-2 text-right">
              <button type="button" onClick={() => setPolicySheet(true)} className="text-[9px] font-semibold text-brand-500">
                Selengkapnya
              </button>
            </div>
          </Card>

          {(b.can_cancel || b.can_modify_guest) && (
            <Card title="Manage Your Booking">
              {b.can_cancel && <MenuRow label="Cancel Booking" onClick={() => nav(`/bookings/${code}/cancel`)} />}
              {b.can_modify_guest && <MenuRow label="Modify Guest Data" onClick={() => nav(`/bookings/${code}/guest`)} />}
            </Card>
          )}

          {b.status === "CHECK OUT" && (b.can_review || b.review) && (
            <Card title="Beri Rating Hotelmu">
              <p className="text-[9px] text-neutral-400">Gimana malam kamu tadi ?</p>
              {b.review ? (
                <div className="mt-3 rounded-md border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-star text-[10px] font-extrabold text-white">{initials(b.review.display_name || customer?.full_name || "T")}</span>
                    <span className="text-[11px] font-bold">{b.review.display_name || customer?.full_name}</span>
                  </div>
                  <Stars value={b.review.stars} size={22} className="mt-3 justify-center" />
                  <div className="mt-2 text-center text-[10px] font-semibold">{STAR_LABELS[b.review.stars]?.label}</div>
                </div>
              ) : (
                <Button block className="mt-3" onClick={() => nav(`/bookings/${code}/review`)}>
                  <Star size={14} fill="currentColor" className="text-star" /> Beri Rating
                </Button>
              )}
            </Card>
          )}

          {b.payment && b.payment.status === "pending" && b.payment.method_code === "cash_on_site" && (
            <Card title="Pembayaran">
              <p className="text-[10px] text-neutral-600">Bayar di tempat saat check-in. {b.payment.note}</p>
            </Card>
          )}

          {b.status === "CANCELLED" && b.payment_status === "refund_pending" && (
            <Card title="Refund">
              <p className="text-[10px] text-neutral-600">Pengembalian dana sedang diproses oleh pihak hotel sesuai kebijakan pembatalan.</p>
            </Card>
          )}

          <div className="h-4" />
          <StickyFooter className="mt-auto flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-neutral-400">Total Tagihan</div>
              <div className="text-[13px] font-extrabold text-danger">{rupiah(b.totals.total)}</div>
            </div>
            {showPay ? (
              <Button className="px-6" onClick={() => nav(b.payment && b.payment.status !== "cancelled" && b.payment.method_code !== "cash_on_site" ? `/bookings/${code}/payment` : `/bookings/${code}/pay`)}>
                Bayar Sekarang
              </Button>
            ) : isHistory ? (
              <Button className="px-6" onClick={() => nav(`/property/${b.property.slug}`)}>
                Booking Lagi
              </Button>
            ) : null}
          </StickyFooter>

          <Sheet open={policySheet} onClose={() => setPolicySheet(false)} title="Policies" className="max-h-[85dvh] overflow-y-auto">
            <ul className="space-y-1 px-4 pb-4 text-[11px] leading-5 text-neutral-600">
              {b.property.policies.map((x, i) => (
                <li key={i}>- {x}</li>
              ))}
            </ul>
          </Sheet>
        </>
      )}
    </div>
  );
}

export function summarizeRooms(b: Booking): string {
  const byType = new Map<string, number>();
  for (const r of b.rooms) byType.set(r.type_name, (byType.get(r.type_name) ?? 0) + 1);
  return [...byType.entries()].map(([n, c]) => `${n} x ${c}`).join(", ");
}

function Countdown({ until }: { until: string }) {
  const left = useCountdown(until);
  const { h, m, s } = countdownParts(left);
  return (
    <div className="absolute left-4 right-4 top-4 rounded-sm bg-black/60 p-2 text-center text-white">
      <div className="text-[9px]">Selesaikan Pembayaran dalam</div>
      <div className="text-[14px] font-extrabold">
        {h} Jam : {m} Menit : {s} Detik
      </div>
      <div className="text-[8px] opacity-80">( sebelum {deadlineText(until)} )</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 mt-3 rounded-md bg-card p-4 shadow-card">
      <div className="mb-2 text-[12px] font-bold">{title}</div>
      {children}
    </div>
  );
}

function MenuRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="tap flex w-full items-center justify-between py-2 text-[11px]">
      {label} <ChevronRight size={14} className="text-brand-500" />
    </button>
  );
}
