// Figma INBOX SECTION: "Geser ke Kiri untuk Hapus", item ikon tag hijau (success) / merah (danger), judul, tanggal,
// isi; belum dibaca = latar biru muda; geser kiri → "Tap untuk Hapus" (merah). Tap item → detail booking + tandai dibaca.
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Tag, Trash2 } from "lucide-react";
import { api } from "@/api";
import type { Notification } from "@/api/types";
import { Button } from "@/components/ui/button";
import { EmptyState, OfflineCard, Skeleton } from "@/components/ui/misc";
import { Page, TabTitle } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { dateTimeInbox } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePushSubscription } from "./push";

export default function InboxPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) => api.notifications(pageParam || undefined),
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    refetchInterval: 30_000,
  });
  const items = q.data?.pages.flatMap((p) => p.data) ?? [];
  const [swiped, setSwiped] = useState<string | null>(null);
  const push = usePushSubscription();

  useEffect(() => {
    // buka inbox = tandai semua dibaca (badge nav hilang)
    if (items.some((n) => !n.read_at)) api.readAllNotifications().then(() => qc.invalidateQueries({ queryKey: ["unread"] })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data]);

  const del = useMutation({
    mutationFn: (id: string) => api.deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setSwiped(null);
    },
    onError: () => toast.error("Gagal menghapus"),
  });

  function open(n: Notification) {
    if (n.booking_code) nav(`/bookings/${n.booking_code}`);
  }

  const networkFail = q.isError && !q.data && q.error instanceof TypeError;

  return (
    <Page bottomNav>
      <TabTitle title="Inbox">
        <div className="flex items-center justify-center gap-1 pb-2 text-[9px] text-neutral-400">
          <Trash2 size={11} /> Geser ke Kiri untuk Hapus
        </div>
      </TabTitle>
      {push.available && !push.subscribed && (
        <div className="mx-4 mb-2 flex items-center justify-between rounded-md bg-brand-50 p-3">
          <span className="text-[10px] text-neutral-700">Aktifkan notifikasi agar status booking langsung terkirim.</span>
          <Button size="sm" onClick={push.subscribe} loading={push.busy}>
            Aktifkan
          </Button>
        </div>
      )}
      {networkFail ? (
        <div className="py-10">
          <OfflineCard onRetry={() => q.refetch()} />
        </div>
      ) : q.isLoading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Inbox kosong" body="Notifikasi booking, pembayaran, check in & check out akan tampil di sini." />
      ) : (
        <div>
          {items.map((n) => (
            <SwipeRow key={n.id} open={swiped === n.id} onOpen={() => setSwiped(n.id)} onClose={() => setSwiped((s) => (s === n.id ? null : s))} onDelete={() => del.mutate(n.id)}>
              <button type="button" onClick={() => open(n)} className={cn("flex w-full gap-3 border-b border-border px-4 py-3 text-left", !n.read_at ? "bg-[#EEF5FF]" : "bg-card")}>
                <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white", n.severity === "danger" ? "bg-danger" : "bg-brand-500")}>
                  <Tag size={14} fill="currentColor" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold">{n.title}</span>
                    <span className="shrink-0 text-[8px] text-neutral-400">{dateTimeInbox(n.created_at)}</span>
                  </span>
                  <span className={cn("mt-0.5 block text-[9px] leading-3", n.read_at ? "text-neutral-400" : "text-neutral-600")}>{n.body}</span>
                </span>
              </button>
            </SwipeRow>
          ))}
          {q.hasNextPage && (
            <div className="p-4">
              <Button variant="outline" block onClick={() => q.fetchNextPage()} loading={q.isFetchingNextPage}>
                Muat lebih banyak
              </Button>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}

/** Baris geser-kiri: konten di atas tombol merah "Tap untuk Hapus". */
function SwipeRow({ children, open, onOpen, onClose, onDelete }: { children: React.ReactNode; open: boolean; onOpen: () => void; onClose: () => void; onDelete: () => void }) {
  const startX = useRef<number | null>(null);
  const [dx, setDx] = useState(0);
  const offset = open ? -110 : dx;
  return (
    <div className="relative overflow-hidden">
      <button type="button" onClick={onDelete} className="absolute inset-y-0 right-0 flex w-[110px] items-center justify-center gap-2 bg-danger text-[10px] font-bold text-white">
        <Trash2 size={16} /> Tap untuk Hapus
      </button>
      <div
        className="relative transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={(e) => (startX.current = e.touches[0]!.clientX)}
        onTouchMove={(e) => {
          if (startX.current === null) return;
          const d = e.touches[0]!.clientX - startX.current;
          if (!open && d < 0) setDx(Math.max(-110, d));
        }}
        onTouchEnd={() => {
          if (open) {
            onClose();
          } else if (dx < -50) onOpen();
          setDx(0);
          startX.current = null;
        }}
        onClick={() => open && onClose()}
      >
        {children}
      </div>
    </div>
  );
}
