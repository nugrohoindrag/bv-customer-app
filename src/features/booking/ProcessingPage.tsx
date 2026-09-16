// Figma BOOKING LOADING: "Request Booking" (kuning) → "Booking Berhasil" (hijau; Kembali / Detail Booking) atau
// "Booking Gagal" (merah; Kembali / Coba Lagi). POST /bvrooms/bookings dengan Idempotency-Key tetap per draft.
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "@/api";
import type { Booking } from "@/api/types";
import { StatusCircle } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { errorMessage, isApiError } from "@/lib/http";
import { loadSession, removeSession } from "@/lib/storage";
import { sleep, uuid } from "@/lib/utils";
import type { BookingDraft } from "@/features/property/PropertyPage";

export default function ProcessingPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const draft = useRef<BookingDraft | null>(loadSession<BookingDraft | null>("booking-draft", null));
  const key = useRef(uuid());
  const [state, setState] = useState<{ kind: "loading" } | { kind: "success"; booking: Booking } | { kind: "error"; message: string }>({ kind: "loading" });

  async function run() {
    const d = draft.current;
    if (!d) return;
    setState({ kind: "loading" });
    try {
      const [b] = await Promise.all([api.createBooking({ property_id: d.property_id, check_in: d.check_in, check_out: d.check_out, guest: d.guest, rooms: d.rooms }, key.current), sleep(1200)]);
      removeSession("booking-draft");
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["unread"] });
      qc.invalidateQueries({ queryKey: ["room-types"] });
      setState({ kind: "success", booking: b });
    } catch (err) {
      let msg = errorMessage(err);
      if (isApiError(err)) {
        if (err.code === "ROOM_UNAVAILABLE") msg = "Kamar/unit yang dipilih sudah penuh untuk tanggal tersebut.";
        else if (err.code === "CAPACITY_EXCEEDED") msg = err.problem.detail || "Jumlah tamu melebihi kapasitas.";
        else if (err.code === "INVALID_DATES") msg = err.problem.detail || "Tanggal tidak valid.";
      }
      key.current = uuid();
      setState({ kind: "error", message: msg });
    }
  }
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!draft.current) return <Navigate to="/home" replace />;

  const back = () => nav(`/property/${draft.current!.slug}`, { replace: true });

  return (
    <div className="app-shell flex min-h-dvh flex-col items-center px-6 pb-[calc(var(--safe-bottom)+16px)] pt-safe">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <StatusCircle kind={state.kind} />
        <h1 className="mt-8 text-[17px] font-extrabold">{state.kind === "loading" ? "Request Booking" : state.kind === "success" ? "Booking Berhasil" : "Booking Gagal"}</h1>
        <p className="mt-2 max-w-[260px] text-[11px] leading-4 text-neutral-500">
          {state.kind === "loading" && "Tunggu sebentar yah, Kami sedang memesan ruangan untuk Anda."}
          {state.kind === "success" && "Pemesanan tempat kamu berhasil, yuk langsung dibayar agar tidak hangus!"}
          {state.kind === "error" && (state.message || "Maaf booking ruangan untuk Anda tidak dapat dilakukan, silahkan coba lagi.")}
        </p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3">
        <Button variant="muted" onClick={back} disabled={state.kind === "loading"}>
          Kembali
        </Button>
        {state.kind === "success" && <Button onClick={() => nav(`/bookings/${state.booking.booking_code}`, { replace: true, state: { toast: "Booking Berhasil" } })}>Detail Booking</Button>}
        {state.kind === "error" && <Button onClick={run}>Coba Lagi</Button>}
        {state.kind === "loading" && <span />}
      </div>
    </div>
  );
}
