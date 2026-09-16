// Figma halaman instruksi bayar: ringkasan booking, countdown "Selesaikan Pembayaran dalam Waktu", rekening + salin,
// "Jumlah yang Harus dibayarkan" + salin nominal, unggah bukti transfer (manual_transfer fase hold), Ganti Metode, Kembali.
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Upload } from "lucide-react";
import { uploadProof } from "@/api";
import { Photo } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { Divider, Skeleton } from "@/components/ui/misc";
import { TopBar } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { countdownParts, deadlineText, rupiah, stayRange } from "@/lib/format";
import { useCountdown } from "@/lib/hooks";
import { errorMessage } from "@/lib/http";
import { copyText } from "@/lib/utils";
import { summarizeRooms, useBooking } from "./BookingDetailPage";

export default function PaymentPage() {
  const { code = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const bq = useBooking(code);
  const b = bq.data;
  const pay = b?.payment ?? null;
  const left = useCountdown(pay?.expires_at ?? b?.payment_deadline_at);
  const { h, m, s } = countdownParts(left);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 5 << 20) return toast.error("Ukuran file maksimal 5 MB");
    setUploading(true);
    try {
      const blob = f.type.startsWith("image/") && f.type !== "image/webp" ? await compress(f) : f;
      const updated = await uploadProof(code, blob);
      qc.setQueryData(["booking", code], updated);
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Bukti transfer terkirim");
      nav(`/bookings/${code}`, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  const inst = pay?.instructions ?? null;
  const submitted = pay?.status === "proof_submitted";

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar title="Pembayaran" onBack={() => nav(`/bookings/${code}`)} />
      {!b ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-60" />
        </div>
      ) : !pay || pay.status === "cancelled" ? (
        <div className="p-6 text-center text-[12px] text-neutral-500">
          Belum ada metode pembayaran dipilih.
          <Button block className="mt-4" onClick={() => nav(`/bookings/${code}/pay`, { replace: true })}>
            Pilih Metode Pembayaran
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-4 pb-[calc(var(--safe-bottom)+16px)]">
          <div className="mt-3 flex overflow-hidden rounded-md bg-card shadow-card ring-1 ring-border">
            <Photo src={b.property.cover_photo_url} className="w-24 shrink-0" />
            <div className="min-w-0 flex-1 p-3">
              <div className="truncate text-[11px] font-bold">{b.property.display_name}</div>
              <div className="text-[9px] text-neutral-500">{summarizeRooms(b)}</div>
              <div className="mt-1 text-[9px] text-neutral-500">
                {stayRange(b.check_in_at, b.check_out_at)} for {b.guests_total} Guest
              </div>
              <div className="mt-2 text-[9px] text-neutral-400">Total Tagihan</div>
              <div className="text-[12px] font-extrabold text-danger">{rupiah(pay.amount)}</div>
            </div>
          </div>

          {b.status === "UNPAID" && !submitted && (
            <div className="mt-4 rounded-md border border-border p-3 text-center">
              <div className="text-[10px] text-neutral-500">Selesaikan Pembayaran dalam Waktu</div>
              <div className="mt-1 text-[16px] font-extrabold text-brand-500">
                {h} Jam : {m} Menit : {s} Detik
              </div>
              <div className="text-[9px] text-neutral-400">( sebelum {deadlineText(pay.expires_at ?? b.payment_deadline_at)} )</div>
            </div>
          )}
          {submitted && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-brand-50 p-3 text-[11px] text-brand-700">
              <CheckCircle2 size={18} className="shrink-0" /> Bukti transfer sudah dikirim dan sedang diverifikasi oleh pihak hotel.
            </div>
          )}

          <div className="mt-4 text-[11px] text-neutral-600">Rekening {inst?.bank ? "Transfer" : "Tujuan"} :</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="rounded-sm bg-info-soft px-2 py-0.5 text-[11px] font-extrabold text-info">{inst?.bank ?? pay.method_code}</span>
            <span className="text-[16px] font-extrabold tracking-wide">{inst?.account_number ?? "-"}</span>
          </div>
          {inst?.account_name && <div className="mt-1 text-[10px] text-neutral-500">a.n. {inst.account_name}</div>}
          <CopyLink text={inst?.account_number ?? ""} label="salin rekening" onDone={() => toast.success("Nomor rekening disalin")} />
          <Divider className="my-4" />
          <div className="text-[11px] text-neutral-600">Jumlah yang Harus dibayarkan</div>
          <div className="mt-1 text-[18px] font-extrabold text-danger">{rupiah(pay.amount)}</div>
          <CopyLink text={String(pay.amount)} label="salin nominal" onDone={() => toast.success("Nominal disalin")} />
          {inst?.note && <p className="mt-3 text-[10px] leading-4 text-neutral-500">{inst.note}</p>}

          <div className="flex-1" />
          <div className="mt-6 space-y-3">
            {pay.proof_upload_required && !submitted && b.status === "UNPAID" && (
              <>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                <Button block onClick={() => fileRef.current?.click()} loading={uploading}>
                  <Upload size={16} /> Unggah Bukti Transfer
                </Button>
              </>
            )}
            {b.status === "UNPAID" && !submitted && (
              <Button block variant={pay.proof_upload_required ? "outline" : "primary"} onClick={() => nav(`/bookings/${code}/pay`)}>
                Ganti Metode Pembayaran
              </Button>
            )}
            <Button block variant={b.status === "UNPAID" && !submitted ? "muted" : "primary"} onClick={() => nav(`/bookings/${code}`)}>
              Kembali
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyLink({ text, label, onDone }: { text: string; label: string; onDone: () => void }) {
  return (
    <button
      type="button"
      disabled={!text}
      onClick={async () => {
        if (await copyText(text)) onDone();
      }}
      className="mt-1 text-[10px] font-semibold text-brand-500"
    >
      {label}
    </button>
  );
}

/** Kompres foto bukti ≤1600px JPEG q0.8 (pola Tenant PWA). */
async function compress(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("compress"))), "image/jpeg", 0.8));
  } catch {
    return file;
  }
}
