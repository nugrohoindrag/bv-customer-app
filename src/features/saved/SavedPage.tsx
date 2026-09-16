// Figma SAVED SECTION: judul "Saved", search "Cari Hotel, Kota, atau Lokasi", grid 2 kolom kartu properti (♥ merah).
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { PropertyCardGrid } from "@/components/property-card";
import { SearchBar } from "@/components/search-widget";
import { Button } from "@/components/ui/button";
import { EmptyState, OfflineCard, Skeleton } from "@/components/ui/misc";
import { Page, TabTitle } from "@/components/ui/shell";
import { useDebounce } from "@/lib/hooks";

export default function SavedPage() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 300);
  const query = useQuery({ queryKey: ["wishlist", dq], queryFn: () => api.wishlist(dq || undefined) });
  const items = (query.data?.data ?? []).map((p) => ({ ...p, is_wishlisted: true }));
  const networkFail = query.isError && !query.data && query.error instanceof TypeError;

  return (
    <Page bottomNav bg="bg-surface">
      <TabTitle title="Saved">
        <div className="px-4 pb-3">
          <SearchBar value={q} onChange={setQ} />
        </div>
      </TabTitle>
      {networkFail ? (
        <div className="py-10">
          <OfflineCard onRetry={() => query.refetch()} />
        </div>
      ) : query.isLoading ? (
        <div className="grid grid-cols-2 gap-3 p-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={dq ? "Property tidak ditemukan…" : "Belum ada yang disimpan"} body={dq ? "Coba kata kunci lain." : "Tap ♥ pada property favoritmu agar mudah ditemukan di sini."} action={!dq ? <Button onClick={() => nav("/home")}>Jelajahi Property</Button> : undefined} />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {items.map((p) => (
            <PropertyCardGrid key={p.id} p={p} />
          ))}
        </div>
      )}
    </Page>
  );
}
