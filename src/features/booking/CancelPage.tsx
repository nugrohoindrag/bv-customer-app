// Figma CANCEL BOOKING: sheet "Cancel Booking Policies" (teks dari dashboard: cancellation_policy_md), tombol
// Cancel Booking (merah outline) / Kembali, dialog "Cancel Booking Confirmation", sukses → tab History + toast.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/sheet";
import { TopBar } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/http";
import { useBooking } from "./BookingDetailPage";

export default function CancelPage() {
  const { code = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const bq = useBooking(code);
  const b = bq.data;
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function doCancel() {
    setLoading(true);
    try {
      const updated = await api.cancelBooking(code, "Dibatalkan oleh customer");
      qc.setQueryData(["booking", code], updated);
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["unread"] });
      nav("/bookings", { replace: true, state: { scope: "history", toast: "Cancel Booking Berhasil" } });
    } catch (err) {
      toast.error(errorMessage(err));
      setConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar title="Cancel Booking" close />
      <div className="flex flex-1 flex-col px-5 pb-[calc(var(--safe-bottom)+16px)]">
        <h1 className="mt-2 text-[12px] font-bold">Cancel Booking Policies</h1>
        {!b ? (
          <Skeleton className="mt-3 h-60" />
        ) : (
          <div className="mt-3 flex-1 text-[10px] leading-4 text-neutral-600">
            <SimpleMarkdown text={b.property.cancellation_policy_md || "- Pembatalan mengikuti kebijakan properti. Hubungi pihak hotel untuk informasi lebih lanjut."} />
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="danger-outline" disabled={!b?.can_cancel} onClick={() => setConfirm(true)}>
            Cancel Booking
          </Button>
          <Button onClick={() => nav(-1)}>Kembali</Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Cancel Booking Confirmation"
        body={
          <>
            Anda yakin ingin membatalkan Booking ?<br />
            Pastikan sudah membaca ketentuan Cancel Booking.
          </>
        }
        onConfirm={doCancel}
        onCancel={() => setConfirm(false)}
        loading={loading}
      />
    </div>
  );
}

/** Markdown minimal: paragraf, **bold**, baris "- " → bullet. */
export function SimpleMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3">
      {blocks.map((blk, i) => {
        const lines = blk.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="space-y-1">
              {lines.map((l, k) => (
                <li key={k}>- {inline(l.trim().slice(2))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {lines.map((l, k) => (
              <span key={k}>
                {inline(l)}
                {k < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function inline(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <b key={i} className="text-foreground">{p.slice(2, -2)}</b> : <span key={i}>{p}</span>));
}
