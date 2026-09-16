// Figma "Pilih Metode Pembayaran": ringkasan booking + daftar metode. Fase hold (D2): Transfer Bank & Bayar di Tempat aktif,
// Virtual Account (BCA/Mandiri/BNI/BRIVA) tampil disabled + "Segera hadir".
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Banknote, ChevronRight, Landmark, Loader2 } from "lucide-react";
import { api } from "@/api";
import type { PaymentOption } from "@/api/types";
import { Photo } from "@/components/illustrations";
import { Skeleton } from "@/components/ui/misc";
import { TopBar } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { rupiah, stayRange } from "@/lib/format";
import { errorMessage } from "@/lib/http";
import { cn } from "@/lib/utils";
import { summarizeRooms, useBooking } from "./BookingDetailPage";

const GROUPS: { key: PaymentOption["group"]; label: string }[] = [
  { key: "transfer", label: "Transfer Bank" },
  { key: "on_site", label: "Bayar di Tempat" },
  { key: "virtual_account", label: "Virtual Account" },
];

export default function PaymentMethodPage() {
  const { code = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const bq = useBooking(code);
  const b = bq.data;
  const methods = useQuery({ queryKey: ["payment-methods", b?.property.id], queryFn: () => api.paymentMethods(b!.property.id), enabled: !!b });
  const [busy, setBusy] = useState<string | null>(null);

  async function choose(opt: PaymentOption) {
    if (!b || !opt.enabled) return;
    setBusy(opt.method_code);
    try {
      const hasPending = !!b.payment && (b.payment.status === "pending" || b.payment.status === "proof_submitted");
      const updated = await api.createPayment(code, opt.provider_code, opt.method_code, hasPending);
      qc.setQueryData(["booking", code], updated);
      qc.invalidateQueries({ queryKey: ["bookings"] });
      if (opt.method_code === "cash_on_site") {
        toast.success("Bayar di tempat saat check-in");
        nav(`/bookings/${code}`, { replace: true });
      } else nav(`/bookings/${code}/payment`, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const opts = methods.data?.data ?? [];

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar title="Pilih Metode Pembayaran" />
      {!b ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          <div className="mx-4 mt-3 flex overflow-hidden rounded-md bg-card shadow-card ring-1 ring-border">
            <Photo src={b.property.cover_photo_url} className="w-24 shrink-0" />
            <div className="min-w-0 flex-1 p-3">
              <div className="truncate text-[11px] font-bold">{b.property.display_name}</div>
              <div className="text-[9px] text-neutral-500">{summarizeRooms(b)}</div>
              <div className="mt-1 text-[9px] text-neutral-500">
                {stayRange(b.check_in_at, b.check_out_at)} for {b.guests_total} Guest
              </div>
              <div className="mt-2 text-[9px] text-neutral-400">Total Tagihan</div>
              <div className="text-[12px] font-extrabold text-danger">{rupiah(b.totals.total)}</div>
            </div>
          </div>

          <div className="px-4 pb-6">
            {methods.isLoading && <Skeleton className="mt-4 h-32" />}
            {GROUPS.map((g) => {
              const list = opts.filter((o) => o.group === g.key);
              if (!list.length) return null;
              return (
                <div key={g.key} className="mt-5">
                  <div className="text-[13px] font-bold">{g.label}</div>
                  <div className="mt-1 divide-y divide-border">
                    {list.map((o) => (
                      <button key={o.method_code} type="button" disabled={!o.enabled || !!busy} onClick={() => choose(o)} className={cn("tap flex w-full items-center gap-3 py-3 text-left", !o.enabled && "opacity-60")}>
                        <span className="text-[11px] font-semibold">{o.label}</span>
                        <span className="flex-1" />
                        {o.coming_soon && <span className="rounded-sm bg-neutral-100 px-2 py-0.5 text-[9px] font-semibold text-neutral-500">Segera hadir</span>}
                        {o.logo_url ? <img src={o.logo_url} alt="" className="h-4" /> : o.group === "on_site" ? <Banknote size={16} className="text-brand-500" /> : <Landmark size={16} className="text-neutral-400" />}
                        {busy === o.method_code ? <Loader2 size={14} className="animate-spin text-brand-500" /> : <ChevronRight size={14} className="text-brand-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
