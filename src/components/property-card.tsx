// Kartu properti Figma: foto + pil rating (kiri bawah) + ♥ (kanan atas); nama, alamat, "Start from Rp …/Nett", jarak.
// Varian: "grid" (Jelajahi Hotel / Saved: kecil, 2 kolom) dan "list" (Daftar Property: lebar penuh).
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import type { PropertyCard as Card } from "@/api/types";
import { useAuth } from "@/app/auth";
import { Photo } from "@/components/illustrations";
import { km, rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RatingPill } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";

/** Toggle wishlist: optimistic pada semua query katalog/wishlist yang memuat properti ini. */
export function useWishlistToggle() {
  const qc = useQueryClient();
  const { customer } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const m = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => (next ? api.addWishlist(id) : api.removeWishlist(id)),
    onMutate: async ({ id, next }) => {
      qc.setQueriesData<unknown>({ predicate: (q) => ["catalog", "property", "wishlist"].includes(String(q.queryKey[0])) }, (old: unknown) => patchWishlisted(old, id, next));
    },
    onSuccess: (_d, { next }) => {
      toast.success(next ? "Disimpan ke Saved" : "Dihapus dari Saved");
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: () => {
      toast.error("Gagal mengubah Saved");
      qc.invalidateQueries({ queryKey: ["catalog"] });
      qc.invalidateQueries({ queryKey: ["property"] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
  return (p: { id: string; is_wishlisted?: boolean }) => {
    if (!customer) {
      nav("/login", { state: { from: window.location.pathname } });
      return;
    }
    m.mutate({ id: p.id, next: !p.is_wishlisted });
  };
}

function patchWishlisted(old: unknown, id: string, next: boolean): unknown {
  if (!old || typeof old !== "object") return old;
  const o = old as Record<string, unknown>;
  if (Array.isArray(o.data)) return { ...o, data: (o.data as Card[]).map((c) => (c.id === id ? { ...c, is_wishlisted: next } : c)) };
  if (o.id === id) return { ...o, is_wishlisted: next };
  return old;
}

export function PropertyCardGrid({ p, className }: { p: Card; className?: string }) {
  const nav = useNavigate();
  const toggle = useWishlistToggle();
  return (
    <button type="button" onClick={() => nav(`/property/${p.slug}`)} className={cn("tap w-full overflow-hidden rounded-md bg-card text-left shadow-card", className)}>
      <div className="relative aspect-[4/3]">
        <Photo src={p.cover_photo_url} kind={p.listing_category} className="h-full w-full" />
        <RatingPill avg={p.rating_avg} count={p.rating_count} className="absolute bottom-2 left-2" />
        <HeartButton active={!!p.is_wishlisted} onClick={() => toggle(p)} />
      </div>
      <div className="p-2">
        <div className="truncate text-[11px] font-bold">{p.display_name}</div>
        <div className="mt-0.5 truncate text-[9px] text-neutral-400">{p.city ?? p.address_short}</div>
        <div className="mt-1 text-[10px] font-bold text-danger">
          {rupiah(p.min_rate)}
          <span className="font-semibold text-neutral-500">/Nett</span>
        </div>
      </div>
    </button>
  );
}

export function PropertyCardList({ p, className }: { p: Card; className?: string }) {
  const nav = useNavigate();
  const toggle = useWishlistToggle();
  return (
    <button type="button" onClick={() => nav(`/property/${p.slug}`)} className={cn("tap w-full overflow-hidden rounded-md bg-card text-left shadow-card", className)}>
      <div className="relative aspect-[16/9]">
        <Photo src={p.cover_photo_url} kind={p.listing_category} className="h-full w-full" />
        <RatingPill avg={p.rating_avg} count={p.rating_count} className="absolute bottom-2 left-2" />
        <HeartButton active={!!p.is_wishlisted} onClick={() => toggle(p)} />
        {p.has_promo && <span className="absolute right-2 bottom-2 rounded-sm bg-danger px-2 py-0.5 text-[9px] font-extrabold text-white">PROMO</span>}
      </div>
      <div className="p-3">
        <div className="truncate text-[13px] font-bold">{p.display_name}</div>
        <div className="mt-0.5 truncate text-[10px] text-neutral-400">{p.address_short}</div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="text-[9px] text-neutral-400">Start from</div>
            <div className="text-[12px] font-bold text-danger">
              {rupiah(p.min_rate)}
              <span className="font-semibold text-neutral-500">/Nett</span>
            </div>
          </div>
          {p.distance_km !== undefined && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-brand-500">
              <MapPin size={12} /> {km(p.distance_km)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function HeartButton({ active, onClick, className, light }: { active: boolean; onClick: () => void; className?: string; light?: boolean }) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={active ? "Hapus dari Saved" : "Simpan"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn("tap absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full", light ? "bg-white/90" : "bg-white/80", className)}
    >
      <Heart size={15} className={active ? "text-danger" : "text-neutral-400"} fill={active ? "currentColor" : "none"} strokeWidth={2.4} />
    </span>
  );
}
