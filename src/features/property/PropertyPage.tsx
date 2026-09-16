// Figma DETAIL PROPERTY: header foto (♥, share, "N Photos", Arahkan), nama/alamat/rating/jarak, tab anchor
// (Hotel Details | Description | Amenities | Travel Date | Room Category | Ratings | Guest Details | Policies),
// Description + sheet, Amenities + sheet, widget tanggal, carousel Room Category (Terpilih/Pilih/Penuh) + add-on
// (Breakfast per tamu, Extra Bed per bed — dari dashboard D5), Ratings histogram, Guest Details prefilled, Policies + sheet,
// footer Total + Booking Sekarang → /booking/new (draft di sessionStorage).
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft, Heart, MapPin, Navigation, Share2, Square, SquareCheck, Users } from "lucide-react";
import { api } from "@/api";
import type { AddonOffer, PropertyDetail, TypeOffer } from "@/api/types";
import { useAuth } from "@/app/auth";
import { useSearch } from "@/app/search";
import { Photo } from "@/components/illustrations";
import { useWishlistToggle } from "@/components/property-card";
import { SearchWidget } from "@/components/search-widget";
import { Button } from "@/components/ui/button";
import { Field, PhoneField } from "@/components/ui/field";
import { Divider, OfflineCard, RatingPill, Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { StickyFooter } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { amenity, BED_LABEL } from "@/lib/amenities";
import { e164, km, localPhone, rupiah } from "@/lib/format";
import { cachedGeo, openDirections, requestGeo } from "@/lib/geo";
import { saveSession } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { ratingText } from "@/lib/rating";

export interface BookingDraft {
  property_id: string;
  slug: string;
  check_in: string;
  check_out: string;
  guest: { full_name: string; email: string; phone: string };
  rooms: { type_id: string; kind: "room_type" | "unit_type"; adults: number; children: number; addons: { addon_id: string; qty: number }[] }[];
  estimated_total: number;
}

const TABS = [
  ["details", "Hotel Details"],
  ["description", "Description"],
  ["amenities", "Amenities"],
  ["dates", "Travel Date"],
  ["rooms", "Room Category"],
  ["ratings", "Ratings"],
  ["guest", "Guest Details"],
  ["policies", "Policies"],
] as const;

export default function PropertyPage() {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const s = useSearch();
  const { customer } = useAuth();
  const toast = useToast();
  const toggleWish = useWishlistToggle();
  const [geo, setGeo] = useState(cachedGeo());
  useEffect(() => {
    if (!geo) requestGeo().then(setGeo);
  }, [geo]);

  const prop = useQuery({ queryKey: ["property", slug, geo?.lat, geo?.lng, !!customer], queryFn: () => api.property(slug, geo ?? undefined) });
  const stay = { check_in: s.checkIn, check_out: s.checkOut, rooms: s.rooms.length, adults: s.adults, children: s.children };
  const types = useQuery({ queryKey: ["room-types", slug, stay], queryFn: () => api.roomTypes(slug, stay), enabled: !!prop.data });

  const [typeId, setTypeId] = useState<string | null>(null);
  const [breakfast, setBreakfast] = useState(false);
  const [sheet, setSheet] = useState<"description" | "policies" | "amenities" | null>(null);
  const [guest, setGuest] = useState({ full_name: "", email: "", phone: "" });
  const [guestErr, setGuestErr] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<string>("details");
  const sections = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (customer) setGuest({ full_name: customer.full_name, email: customer.email ?? "", phone: localPhone(customer.phone) });
  }, [customer]);

  const offers = types.data?.data ?? [];
  const selected = offers.find((t) => t.id === typeId) ?? null;
  useEffect(() => {
    if (!offers.length) return;
    if (!typeId || !offers.some((t) => t.id === typeId && bookable(t, s))) {
      const first = offers.find((t) => bookable(t, s));
      setTypeId(first?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]);

  const p = prop.data;
  const isApt = p?.listing_category === "apartment";
  const unitLabel = p?.terminology?.unit_label ?? (isApt ? "Unit" : "Kamar");
  const breakfastAddon = selected?.addons.find((a) => a.kind === "breakfast") ?? null;
  const extraBedAddon = selected?.addons.find((a) => a.kind === "extra_bed") ?? null;
  const extraBedsTotal = s.rooms.reduce((a, r) => a + r.extraBeds, 0);

  const estimate = useMemo(() => {
    if (!selected) return 0;
    let total = 0;
    for (const r of s.rooms) {
      total += selected.line_total;
      if (breakfast && breakfastAddon) total += addonLine(breakfastAddon, r.adults + r.children, selected.nights);
      if (extraBedAddon && r.extraBeds > 0) total += addonLine(extraBedAddon, Math.min(r.extraBeds, extraBedAddon.max_qty), selected.nights);
    }
    return total;
  }, [selected, s.rooms, breakfast, breakfastAddon, extraBedAddon]);

  function scrollTo(key: string) {
    setTab(key);
    sections.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function share() {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: p?.display_name, url }).catch(() => {});
    else navigator.clipboard?.writeText(url).then(() => toast.success("Tautan disalin"));
  }

  function book() {
    if (!p || !selected) return;
    if (!customer) {
      nav("/login", { state: { from: `/property/${slug}` } });
      return;
    }
    const errs: Record<string, string> = {};
    if (!guest.full_name.trim()) errs.full_name = "Nama tidak boleh kosong!";
    if (!guest.email.trim()) errs.email = "Email tidak boleh kosong!";
    if (!guest.phone.replace(/\D/g, "")) errs.phone = "No telepon tidak boleh kosong!";
    setGuestErr(errs);
    if (Object.keys(errs).length) {
      scrollTo("guest");
      return;
    }
    const draft: BookingDraft = {
      property_id: p.id,
      slug,
      check_in: s.checkIn,
      check_out: s.checkOut,
      guest: { full_name: guest.full_name.trim(), email: guest.email.trim(), phone: e164(guest.phone) },
      rooms: s.rooms.map((r) => ({
        type_id: selected.id,
        kind: selected.kind,
        adults: r.adults,
        children: r.children,
        addons: [
          ...(breakfast && breakfastAddon ? [{ addon_id: breakfastAddon.id, qty: Math.min(r.adults + r.children, breakfastAddon.max_qty) }] : []),
          ...(extraBedAddon && r.extraBeds > 0 ? [{ addon_id: extraBedAddon.id, qty: Math.min(r.extraBeds, extraBedAddon.max_qty) }] : []),
        ],
      })),
      estimated_total: estimate,
    };
    saveSession("booking-draft", draft);
    nav("/booking/new");
  }

  if (prop.isError && !prop.data) {
    return (
      <div className="app-shell flex min-h-dvh flex-col">
        <Header onBack={() => nav(-1)} />
        <div className="py-10">
          <OfflineCard onRetry={() => prop.refetch()} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-surface">
      {/* header foto */}
      <div ref={(el) => {
        sections.current.details = el;
      }} className="relative aspect-[4/3] bg-neutral-200">
        <Photo src={p?.cover_photo_url ?? p?.photos_preview?.[0]?.url} kind={p?.listing_category} className="h-full w-full" />
        <Header
          onBack={() => nav(-1)}
          right={
            <>
              <IconBtn label="Simpan" onClick={() => p && toggleWish(p)}>
                <Heart size={18} className={p?.is_wishlisted ? "text-danger" : "text-white"} fill={p?.is_wishlisted ? "currentColor" : "none"} />
              </IconBtn>
              <IconBtn label="Bagikan" onClick={share}>
                <Share2 size={18} className="text-white" />
              </IconBtn>
            </>
          }
        />
        {!!p?.photo_count && (
          <button type="button" onClick={() => nav(`/property/${slug}/photos`)} className="absolute bottom-3 left-3 rounded-sm bg-black/50 px-2 py-1 text-[10px] font-bold text-white">
            {p.photo_count} Photos
          </button>
        )}
        <button type="button" onClick={() => openDirections(p?.lat, p?.lng)} className="tap absolute bottom-3 right-3 flex items-center gap-1 rounded-sm bg-brand-500 px-3 py-1.5 text-[10px] font-bold text-white">
          <Navigation size={11} /> Arahkan
        </button>
      </div>

      {/* judul */}
      <div className="bg-card px-4 pb-3 pt-3">
        {prop.isLoading ? (
          <>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </>
        ) : (
          <>
            <h1 className="text-[14px] font-extrabold">{p?.display_name}</h1>
            <p className="mt-0.5 text-[9px] text-neutral-400">{[p?.address_line, p?.district, p?.city].filter(Boolean).join(", ")}</p>
            <div className="mt-2 flex items-center justify-between">
              <RatingPill avg={p?.rating_avg ?? 0} count={p?.rating_count} />
              {p?.distance_km !== undefined && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-500">
                  <MapPin size={12} /> {km(p.distance_km)}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* tab anchor */}
      <div className="no-scrollbar sticky top-0 z-20 flex gap-5 overflow-x-auto border-b border-border bg-card px-4 pt-safe">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" onClick={() => scrollTo(k)} className={cn("shrink-0 border-b-2 pb-2 pt-3 text-[10px] font-semibold", tab === k ? "border-brand-500 text-brand-500" : "border-transparent text-neutral-400")}>
            {label}
          </button>
        ))}
      </div>

      {/* Description */}
      <Section id="description" refs={sections} title="Description" onMore={() => setSheet("description")}>
        {prop.isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="line-clamp-4 text-[10px] leading-4 text-neutral-600">
            {p?.description_sections?.slice(0, 1).map((d) => (
              <p key={d.key}>
                <b className="text-foreground">{d.title}:</b>
                <br />
                {d.body}
              </p>
            ))}
            {!p?.description_sections?.length && p?.tagline}
          </div>
        )}
      </Section>

      {/* Amenities */}
      <Section id="amenities" refs={sections} title="Amenities" onMore={() => setSheet("amenities")}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {(p?.facilities ?? []).slice(0, 6).map((code) => (
            <AmenityRow key={code} code={code} />
          ))}
        </div>
      </Section>

      {/* Travel dates */}
      <Section id="dates" refs={sections} title="Travel Dates and Guest">
        <SearchWidget returnTo={`/property/${slug}`} />
      </Section>

      {/* Room Category */}
      <Section id="rooms" refs={sections} title={`${isApt ? "Unit" : "Room"} Category`} noPadX>
        <div className="no-scrollbar snap-row flex gap-3 overflow-x-auto px-4">
          {types.isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-64 w-[170px] shrink-0" />)}
          {offers.map((t) => (
            <TypeCard key={t.id} t={t} selected={t.id === typeId} available={bookable(t, s)} onSelect={() => setTypeId(t.id)} breakfast={breakfast} onBreakfast={setBreakfast} unitLabel={unitLabel} />
          ))}
          {!types.isLoading && offers.length === 0 && <p className="px-1 py-4 text-[11px] text-neutral-500">Belum ada tipe {unitLabel.toLowerCase()} yang tersedia untuk tanggal ini.</p>}
        </div>
        {extraBedAddon && (
          <div className="mx-4 mt-4 rounded-md bg-card p-3 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold">Extra Beds</span>
              <button type="button" onClick={() => nav("/search/guests", { state: { returnTo: `/property/${slug}` } })} className="text-[9px] font-semibold text-brand-500">
                Pilih Jumlah
              </button>
            </div>
            <Divider className="my-2" />
            <div className="flex items-center justify-between text-[10px]">
              <span>
                <b>+ {extraBedAddon.name}</b> <span className="ml-1 text-danger">{rupiah(extraBedAddon.price)}/bed</span>
              </span>
              <span className="font-bold">x{extraBedsTotal} beds</span>
            </div>
            {extraBedsTotal > extraBedAddon.max_qty * s.rooms.length && <p className="mt-1 text-[9px] text-danger">Maksimal {extraBedAddon.max_qty} extra bed per {unitLabel.toLowerCase()}.</p>}
          </div>
        )}
      </Section>

      {/* Ratings */}
      <Section id="ratings" refs={sections} title="Ratings">
        <RatingsBlock p={p} />
      </Section>

      {/* Guest Details */}
      <Section id="guest" refs={sections} title="Guest Details" subtitle="Informasi ini akan digunakan sebagai detail booking Anda">
        {customer ? (
          <div className="space-y-3">
            <Field label="Nama" value={guest.full_name} onChange={(e) => setGuest({ ...guest, full_name: e.target.value })} error={guestErr.full_name} />
            <Field label="Email" type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} error={guestErr.email} />
            <PhoneField label="No Telepon" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value.replace(/\D/g, "") })} error={guestErr.phone} />
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-md bg-brand-50 p-3">
            <span className="text-[11px] text-neutral-700">Masuk untuk mengisi data tamu & booking.</span>
            <Button size="sm" onClick={() => nav("/login", { state: { from: `/property/${slug}` } })}>
              Masuk
            </Button>
          </div>
        )}
      </Section>

      {/* Policies */}
      <Section id="policies" refs={sections} title="Policies" onMore={() => setSheet("policies")} className="mb-4">
        <ul className="space-y-0.5 text-[10px] leading-4 text-neutral-600">
          {(p?.policies ?? []).slice(0, 3).map((x, i) => (
            <li key={i}>- {x}</li>
          ))}
        </ul>
      </Section>

      <StickyFooter className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] text-neutral-400">Total</div>
          <div className="text-[13px] font-extrabold text-danger">
            {selected ? rupiah(estimate) : "-"}
            <span className="text-[10px] font-semibold text-neutral-500">/Nett</span>
          </div>
        </div>
        <Button onClick={book} disabled={!selected || !p} className="px-6">
          Booking Sekarang
        </Button>
      </StickyFooter>

      <Sheet open={sheet === "description"} onClose={() => setSheet(null)} title="Deskripsi" className="max-h-[85dvh] overflow-y-auto">
        <div className="space-y-4 px-4 pb-4 text-[11px] leading-5 text-neutral-600">
          {p?.description_sections?.map((d) => (
            <div key={d.key}>
              <div className="font-bold text-foreground">{d.title}</div>
              <p className="whitespace-pre-line">{d.body}</p>
            </div>
          ))}
        </div>
      </Sheet>
      <Sheet open={sheet === "policies"} onClose={() => setSheet(null)} title="Policies" className="max-h-[85dvh] overflow-y-auto">
        <ul className="space-y-1 px-4 pb-4 text-[11px] leading-5 text-neutral-600">
          {p?.policies?.map((x, i) => (
            <li key={i}>- {x}</li>
          ))}
        </ul>
      </Sheet>
      <Sheet open={sheet === "amenities"} onClose={() => setSheet(null)} title="Amenities" className="max-h-[85dvh] overflow-y-auto">
        <div className="px-4 pb-4">
          <div className="mb-2 text-[11px] font-bold">{isApt ? "Unit" : "Hotel"} Facilities</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {p?.facilities?.map((c) => (
              <AmenityRow key={c} code={c} />
            ))}
          </div>
          {selected && (
            <>
              <div className="mb-2 mt-5 text-[11px] font-bold">
                {selected.name} Facilities
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {selected.amenities.map((c) => (
                  <AmenityRow key={c} code={c} />
                ))}
              </div>
            </>
          )}
        </div>
      </Sheet>
    </div>
  );
}

function addonLine(a: AddonOffer, qty: number, nights: number): number {
  const q = Math.min(qty, a.max_qty);
  return a.pricing_unit === "per_booking" ? a.price * q : a.price * q * nights;
}

/** Tersedia bila stok cukup untuk semua kamar dan kapasitas per kamar terpenuhi. */
function bookable(t: TypeOffer, s: { rooms: { adults: number; children: number }[] }): boolean {
  if (t.available_count < s.rooms.length) return false;
  return s.rooms.every((r) => r.adults <= t.max_adults && r.children <= t.max_children);
}

function Header({ onBack, right }: { onBack: () => void; right?: React.ReactNode }) {
  return (
    <div className="pt-safe absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
      <IconBtn label="Kembali" onClick={onBack}>
        <ChevronLeft size={20} className="text-white" strokeWidth={2.5} />
      </IconBtn>
      <div className="flex gap-2">{right}</div>
    </div>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="tap flex h-8 w-8 items-center justify-center rounded-full bg-black/35">
      {children}
    </button>
  );
}

function Section({ id, refs, title, subtitle, children, onMore, noPadX, className }: { id: string; refs: React.MutableRefObject<Record<string, HTMLElement | null>>; title: string; subtitle?: string; children: React.ReactNode; onMore?: () => void; noPadX?: boolean; className?: string }) {
  return (
    <section
      ref={(el) => {
        refs.current[id] = el;
      }}
      className={cn("mt-2 scroll-mt-14 bg-card py-3", !noPadX && "px-4", className)}>
      <div className={cn(noPadX && "px-4")}>
        <h2 className="text-[12px] font-bold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[9px] text-neutral-400">{subtitle}</p>}
      </div>
      <div className="mt-2">{children}</div>
      {onMore && (
        <div className={cn("mt-2 text-right", noPadX && "px-4")}>
          <button type="button" onClick={onMore} className="text-[9px] font-semibold text-brand-500">
            Selengkapnya
          </button>
        </div>
      )}
    </section>
  );
}

function AmenityRow({ code }: { code: string }) {
  const a = amenity(code);
  return (
    <div className="flex items-center gap-2 text-[10px] text-neutral-600">
      <a.icon size={13} className="text-neutral-500" />
      {a.id}
    </div>
  );
}

function TypeCard({ t, selected, available, onSelect, breakfast, onBreakfast, unitLabel }: { t: TypeOffer; selected: boolean; available: boolean; onSelect: () => void; breakfast: boolean; onBreakfast: (v: boolean) => void; unitLabel: string }) {
  const bf = t.addons.find((a) => a.kind === "breakfast");
  const shown = t.amenities.slice(0, 3);
  return (
    <div className={cn("snap-item flex w-[170px] shrink-0 flex-col overflow-hidden rounded-md bg-card shadow-card ring-1", selected ? "ring-brand-500" : "ring-border")}>
      <Photo src={t.photo_url} kind="room" className="aspect-[16/10] w-full" />
      <div className="flex flex-1 flex-col p-2.5">
        <div className="text-[11px] font-bold leading-4">
          {t.name}
          {t.size_m2 ? <span className="font-semibold text-neutral-500"> : {t.size_m2} m²</span> : null}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[9px] text-neutral-500">
          <Users size={10} /> Max Guest : {t.max_adults} people
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-neutral-500">
          {shown.map((c) => {
            const a = amenity(c);
            return <a.icon key={c} size={11} />;
          })}
          {t.amenities.length > shown.length && <span className="text-[9px]">+{t.amenities.length - shown.length} more</span>}
        </div>
        {t.bed_type && <div className="mt-1 text-[9px] text-neutral-400">{BED_LABEL[t.bed_type] ?? t.bed_type}</div>}
        <div className="mt-2">
          {t.promo && <div className="text-[9px] text-neutral-400 line-through">{rupiah(t.rate_per_night * t.nights)}</div>}
          <div className="text-[11px] font-bold text-danger">
            {rupiah(t.line_total)}
            <span className="text-[9px] font-semibold text-neutral-500">/Nett</span>
          </div>
          {t.promo && <div className="text-[8px] font-semibold text-brand-600">{t.promo.name}</div>}
        </div>
        <button
          type="button"
          disabled={!available}
          onClick={onSelect}
          className={cn("tap mt-2 flex h-8 w-full items-center justify-center gap-1 rounded-sm text-[11px] font-bold", !available ? "bg-neutral-300 text-white" : selected ? "bg-brand-500 text-white" : "border border-border bg-card text-neutral-500")}
        >
          {!available ? "Penuh" : selected ? (
            <>
              Terpilih <Check size={12} strokeWidth={3} />
            </>
          ) : (
            "Pilih"
          )}
        </button>
        {bf && (
          <button type="button" disabled={!selected} onClick={() => onBreakfast(!breakfast)} className="mt-2 flex w-full items-center justify-between text-[10px] disabled:opacity-50">
            <span className="font-bold">+ {bf.name}</span>
            {selected && breakfast ? <SquareCheck size={14} className="text-brand-500" /> : <Square size={14} className="text-neutral-400" />}
          </button>
        )}
        {bf && (
          <div className="mt-0.5 text-[9px] text-danger">
            {rupiah(bf.price)}
            <span className="text-neutral-500">/{bf.pricing_unit === "per_guest_per_night" ? "Guest" : unitLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingsBlock({ p }: { p: PropertyDetail | undefined }) {
  const r = p?.rating_summary;
  const hist = r?.hist ?? [0, 0, 0, 0, 0];
  const total = hist.reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex gap-4">
      <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-md bg-brand-500 py-3 text-white">
        <div className="flex items-center gap-1 text-[18px] font-extrabold">
          {ratingText(r?.avg ?? 0)} <span className="text-[12px]">★</span>
        </div>
        <div className="text-[9px] font-bold">{r?.label ?? "No Review Yet"}</div>
        <div className="text-[8px] opacity-90">{r?.count ?? 0} Reviews</div>
      </div>
      <div className="flex-1 space-y-1">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = hist[star - 1] ?? 0;
          return (
            <div key={star} className="flex items-center gap-2 text-[9px] text-neutral-500">
              <span className="w-2">{star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-star" style={{ width: `${(n / total) * 100}%` }} />
              </div>
              <span className="w-6 text-right">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
