// Figma BERI RATING SAAT STATUS CHECK OUT: kartu properti, "Bagaimana malam Kamu tadi ?", 5 bintang + emoji + label
// (Buruk! … Luar Biasa Indah!), Simpan → POST /bookings/{code}/review (bintang saja, §10).
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { api } from "@/api";
import { Photo } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { RatingPill, Skeleton, Stars } from "@/components/ui/misc";
import { TopBar } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { errorMessage, isApiError } from "@/lib/http";
import { STAR_LABELS } from "@/lib/rating";
import { useBooking } from "./BookingDetailPage";

export default function ReviewPage() {
  const { code = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const bq = useBooking(code);
  const b = bq.data;
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState(false);
  const lbl = STAR_LABELS[stars]!;

  async function submit() {
    if (!stars) return toast.error("Yuk pilih bintangnya dulu!");
    setLoading(true);
    try {
      await api.review(code, stars);
      qc.invalidateQueries({ queryKey: ["booking", code] });
      qc.invalidateQueries({ queryKey: ["property"] });
      nav(`/bookings/${code}`, { replace: true, state: { toast: "Terima kasih atas ratingmu!" } });
    } catch (err) {
      if (isApiError(err) && err.code === "ALREADY_REVIEWED") toast.error("Booking ini sudah diberi rating");
      else if (isApiError(err) && err.code === "NOT_CHECKED_OUT") toast.error("Rating dapat diberikan setelah check out");
      else toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar title="Beri Rating" close />
      <div className="flex flex-1 flex-col px-5 pb-[calc(var(--safe-bottom)+16px)]">
        <div className="mt-2 text-[11px] font-semibold text-neutral-700">Beri rating untuk property :</div>
        {!b ? (
          <Skeleton className="mt-3 aspect-[16/9]" />
        ) : (
          <div className="mt-3">
            <div className="relative aspect-[16/9] overflow-hidden rounded-md">
              <Photo src={b.property.cover_photo_url} className="h-full w-full" />
              <RatingPill avg={0} count={0} compact className="absolute bottom-2 left-2" />
              <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80">
                <Heart size={15} className="text-danger" fill="currentColor" />
              </span>
            </div>
            <div className="mt-2 text-[12px] font-bold">{b.property.display_name}</div>
            <div className="text-[9px] text-neutral-400">{[b.property.address_line, b.property.city].filter(Boolean).join(", ")}</div>
          </div>
        )}
        <div className="my-4 h-px bg-border" />
        <div className="text-[12px] font-bold">Bagaimana malam Kamu tadi ?</div>
        <Stars value={stars} onChange={setStars} size={34} className="mt-4 justify-between px-2" />
        <div className="mt-6 text-center">
          <div className="text-[44px] leading-none">{lbl.emoji}</div>
          <div className="mt-3 text-[16px] font-extrabold">{lbl.label}</div>
        </div>
        <div className="flex-1" />
        <Button block className="mt-8" onClick={submit} loading={loading} disabled={!b?.can_review}>
          Simpan
        </Button>
      </div>
    </div>
  );
}
