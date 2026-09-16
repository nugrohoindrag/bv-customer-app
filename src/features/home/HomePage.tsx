// Figma HOME: header nama user, widget Check In/Out/Room, search, chip "Terdekat" + properti org (D1: menggantikan chip kota;
// disembunyikan bila org hanya 1 properti) + "Lihat Lebih", banner promo/info, "Jelajahi" horizontal, offline state.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronRight, LocateFixed } from "lucide-react";
import { api } from "@/api";
import type { Banner } from "@/api/types";
import { useAppConfig } from "@/app/app-config";
import { useAuth } from "@/app/auth";
import { useSearch } from "@/app/search";
import { Photo } from "@/components/illustrations";
import { PropertyCardGrid } from "@/components/property-card";
import { SearchBar, SearchWidget } from "@/components/search-widget";
import { OfflineCard, Skeleton } from "@/components/ui/misc";
import { Page } from "@/components/ui/shell";
import { requestGeo } from "@/lib/geo";
import { cn, initials } from "@/lib/utils";

export default function HomePage() {
  const nav = useNavigate();
  const { customer } = useAuth();
  const { config, brandName } = useAppConfig();
  const s = useSearch();
  const [q, setQ] = useState("");

  const props = useQuery({
    queryKey: ["catalog", "home", s.checkIn, s.checkOut, s.rooms.length, s.adults, s.children, !!customer],
    queryFn: () => api.properties({ check_in: s.checkIn, check_out: s.checkOut, rooms: s.rooms.length, adults: s.adults, children: s.children, sort: "popular", limit: 10 }),
  });
  const banners = useQuery({ queryKey: ["banners"], queryFn: () => api.banners(), staleTime: 5 * 60_000 });
  const listed = props.data?.data ?? [];
  const showChips = (config.listed_count || listed.length) > 1;

  const networkFail = props.isError && !props.data && props.error instanceof TypeError;

  return (
    <Page bottomNav bg="bg-surface">
      <header className="pt-safe bg-card px-4 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-star text-[12px] font-extrabold text-white">{customer ? initials(customer.full_name) : "G"}</span>
          {customer ? (
            <span className="text-[13px] font-bold">{customer.full_name}</span>
          ) : (
            <button type="button" onClick={() => nav("/login")} className="text-[13px] font-bold">
              Tamu · <span className="text-brand-500">Masuk</span>
            </button>
          )}
        </div>
        <SearchWidget className="mt-3" returnTo="/home" />
        <SearchBar
          className="mt-3"
          value={q}
          onChange={setQ}
          onSubmit={() => {
            s.setQ(q);
            nav("/catalog");
          }}
        />
      </header>

      {networkFail ? (
        <div className="py-10">
          <OfflineCard onRetry={() => props.refetch()} />
        </div>
      ) : (
        <>
          {showChips && (
            <div className="no-scrollbar flex gap-4 overflow-x-auto bg-card px-4 pb-4 pt-1">
              <Chip
                label="Terdekat"
                onClick={async () => {
                  await requestGeo();
                  s.setSort("distance");
                  nav("/catalog");
                }}
                icon={<LocateFixed size={20} className="text-white" />}
                green
              />
              {listed.slice(0, 6).map((p) => (
                <Chip key={p.id} label={p.display_name} photo={p.cover_photo_url} kind={p.listing_category} onClick={() => nav(`/property/${p.slug}`)} />
              ))}
              <Chip label="Lihat Lebih" icon={<ChevronRight size={22} className="text-white" strokeWidth={2.5} />} green onClick={() => nav("/catalog")} />
            </div>
          )}

          <BannerCarousel items={banners.data?.data ?? []} loading={banners.isLoading} />

          <section className="mt-4 pb-4">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-[13px] font-bold">Jelajahi {brandName}</h2>
              <button type="button" onClick={() => nav("/catalog")} className="text-[10px] font-semibold text-brand-500">
                Lihat Semua
              </button>
            </div>
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4">
              {props.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 w-[150px] shrink-0" />)}
              {listed.map((p) => (
                <PropertyCardGrid key={p.id} p={p} className="w-[150px] shrink-0" />
              ))}
              {!props.isLoading && listed.length === 0 && <p className="px-1 py-6 text-[12px] text-neutral-500">Belum ada properti yang dipublikasikan.</p>}
            </div>
          </section>
        </>
      )}
    </Page>
  );
}

function Chip({ label, photo, icon, green, kind, onClick }: { label: string; photo?: string | null; icon?: React.ReactNode; green?: boolean; kind?: "hotel" | "apartment"; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="tap flex w-14 shrink-0 flex-col items-center gap-1">
      <span className={cn("flex h-11 w-11 items-center justify-center overflow-hidden rounded-full", green ? "bg-brand-500" : "bg-neutral-200")}>{icon ?? <Photo src={photo} kind={kind} className="h-full w-full" />}</span>
      <span className="w-full truncate text-center text-[9px] font-semibold text-neutral-600">{label}</span>
    </button>
  );
}

function BannerCarousel({ items, loading }: { items: Banner[]; loading: boolean }) {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);
  if (loading) return <Skeleton className="mx-4 mt-4 h-24" />;
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <div className="no-scrollbar snap-row flex gap-3 overflow-x-auto px-4">
        {items.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => (b.deep_link ? nav(b.deep_link.startsWith("/") ? b.deep_link : "/catalog") : nav("/catalog"))}
            className={cn("snap-item tap relative h-24 w-[82%] shrink-0 overflow-hidden rounded-md text-left text-white", b.kind === "promotion" ? "bg-brand-600" : "bg-brand-500", i === idx && "ring-2 ring-brand-200")}
          >
            {b.image_url && <img src={b.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
            <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15" />
            <div className="absolute right-6 bottom-0 h-10 w-10 rounded-full bg-white/10" />
            <div className="relative flex h-full flex-col justify-between p-3">
              <div>
                <div className="max-w-[70%] text-[13px] font-extrabold leading-4">{b.title}</div>
                {b.subtitle && <div className="mt-1 max-w-[75%] text-[9px] leading-3 opacity-90">{b.subtitle}</div>}
              </div>
              {b.cta_label && <span className="w-max rounded-sm bg-white/25 px-2 py-0.5 text-[9px] font-bold">{b.cta_label}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
