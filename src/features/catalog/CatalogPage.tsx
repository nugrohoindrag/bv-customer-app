// Figma "Daftar Property": widget tanggal, search, tab All/Apartement/Hotel, sort sheet (Terpopuler / Harga Terendah /
// Lokasi Terdekat), kartu properti, empty "Property tidak ditemukan…", offline, load more (cursor).
import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowUpDown, ChevronRight, X } from "lucide-react";
import { api } from "@/api";
import { useAuth } from "@/app/auth";
import { useSearch } from "@/app/search";
import { PropertyCardList } from "@/components/property-card";
import { SearchBar, SearchWidget } from "@/components/search-widget";
import { Button } from "@/components/ui/button";
import { EmptyState, OfflineCard, Skeleton } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { Page, Tabs, TopBar } from "@/components/ui/shell";
import { cachedGeo, requestGeo } from "@/lib/geo";
import { useDebounce } from "@/lib/hooks";

const SORTS = [
  { value: "popular", label: "Hotel Terpopuler" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "distance", label: "Lokasi Terdekat" },
] as const;

export default function CatalogPage() {
  const s = useSearch();
  const { customer } = useAuth();
  const [q, setQ] = useState(s.q);
  const dq = useDebounce(q, 350);
  const [sortOpen, setSortOpen] = useState(false);
  const [geo, setGeo] = useState(cachedGeo());

  useEffect(() => {
    s.setQ(dq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);
  useEffect(() => {
    if (s.sort === "distance" && !geo) requestGeo().then(setGeo);
  }, [s.sort, geo]);

  const query = useInfiniteQuery({
    queryKey: ["catalog", "list", dq, s.category, s.sort, s.checkIn, s.checkOut, s.rooms.length, s.adults, s.children, geo?.lat, geo?.lng, !!customer],
    queryFn: ({ pageParam }) =>
      api.properties({
        q: dq || undefined,
        category: s.category,
        sort: s.sort,
        check_in: s.checkIn,
        check_out: s.checkOut,
        rooms: s.rooms.length,
        adults: s.adults,
        children: s.children,
        lat: geo?.lat,
        lng: geo?.lng,
        cursor: pageParam || undefined,
        limit: 20,
      }),
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const networkFail = query.isError && !query.data && query.error instanceof TypeError;

  return (
    <Page bg="bg-surface">
      <TopBar
        title="Daftar Property"
        right={
          <button type="button" aria-label="Urutkan" onClick={() => setSortOpen(true)} className="tap flex h-10 w-10 items-center justify-center text-brand-500">
            <ArrowUpDown size={18} />
          </button>
        }
      />
      <div className="bg-card px-4 pb-3 pt-3">
        <SearchWidget returnTo="/catalog" />
        <SearchBar className="mt-3" value={q} onChange={setQ} autoFocus={!!s.q} />
      </div>
      <Tabs
        className="bg-card"
        value={s.category}
        onChange={s.setCategory}
        items={[
          { value: "all", label: "All" },
          { value: "apartment", label: "Apartement" },
          { value: "hotel", label: "Hotel" },
        ]}
      />

      {networkFail ? (
        <div className="py-10">
          <OfflineCard onRetry={() => query.refetch()} />
        </div>
      ) : query.isLoading ? (
        <div className="space-y-3 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-60" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Property tidak ditemukan…" body="Maaf property yang Anda cari, tidak di temukan silahkan gunakan kata kunci lain." />
      ) : (
        <div className="space-y-3 p-4">
          {items.map((p) => (
            <PropertyCardList key={p.id} p={p} />
          ))}
          {query.hasNextPage && (
            <Button variant="outline" block onClick={() => query.fetchNextPage()} loading={query.isFetchingNextPage}>
              Muat lebih banyak
            </Button>
          )}
        </div>
      )}

      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort by">
        <div className="px-4 pb-2">
          {SORTS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                s.setSort(o.value);
                setSortOpen(false);
              }}
              className="tap flex w-full items-center justify-between border-b border-border py-3 text-[12px] font-semibold last:border-0"
            >
              <span className={s.sort === o.value ? "text-brand-500" : ""}>{o.label}</span>
              {s.sort === o.value ? <X size={14} className="text-brand-500" /> : <ChevronRight size={14} className="text-neutral-400" />}
            </button>
          ))}
        </div>
      </Sheet>
    </Page>
  );
}
