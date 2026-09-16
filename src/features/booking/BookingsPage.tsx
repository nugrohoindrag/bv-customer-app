// Figma BOOKING SECTION: tab Upcoming Booking / History Booking, kartu dengan aksi Bayar / Arahkan / Booking Lagi.
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/api";
import { BookingCard } from "@/components/booking-card";
import { Button } from "@/components/ui/button";
import { EmptyState, OfflineCard, Skeleton } from "@/components/ui/misc";
import { Page, Tabs, TabTitle } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";

export default function BookingsPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [scope, setScope] = useState<"upcoming" | "history">((loc.state as { scope?: "upcoming" | "history" } | null)?.scope ?? "upcoming");
  const toasted = useRef(false);
  useEffect(() => {
    const t = (loc.state as { toast?: string } | null)?.toast;
    if (t && !toasted.current) {
      toasted.current = true;
      toast.success(t);
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = useInfiniteQuery({
    queryKey: ["bookings", scope],
    queryFn: ({ pageParam }) => api.bookings(scope, pageParam || undefined),
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    refetchInterval: scope === "upcoming" ? 60_000 : false,
  });
  const items = q.data?.pages.flatMap((p) => p.data) ?? [];
  const networkFail = q.isError && !q.data && q.error instanceof TypeError;

  return (
    <Page bottomNav bg="bg-surface">
      <TabTitle title="Booking">
        <Tabs
          value={scope}
          onChange={setScope}
          items={[
            { value: "upcoming", label: "Upcoming Booking" },
            { value: "history", label: "History Booking" },
          ]}
        />
      </TabTitle>
      {networkFail ? (
        <div className="py-10">
          <OfflineCard onRetry={() => q.refetch()} />
        </div>
      ) : q.isLoading ? (
        <div className="space-y-3 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={scope === "upcoming" ? "Belum ada booking" : "Belum ada riwayat"} body={scope === "upcoming" ? "Yuk cari kamar atau unit favoritmu dan booking sekarang." : "Booking yang sudah selesai atau dibatalkan akan tampil di sini."} action={scope === "upcoming" ? <Button onClick={() => nav("/home")}>Cari Property</Button> : undefined} />
      ) : (
        <div className="space-y-3 p-4">
          {items.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
          {q.hasNextPage && (
            <Button variant="outline" block onClick={() => q.fetchNextPage()} loading={q.isFetchingNextPage}>
              Muat lebih banyak
            </Button>
          )}
        </div>
      )}
    </Page>
  );
}
