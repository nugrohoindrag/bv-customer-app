// Figma "32 Photos": tab kategori (Facade, Room, Receptionist, …), grid foto per kategori dengan judul "Facade (12)".
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "@/api";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { TopBar } from "@/components/ui/shell";
import { cn } from "@/lib/utils";

export default function PhotosPage() {
  const { slug = "" } = useParams();
  const q = useQuery({ queryKey: ["photos", slug], queryFn: () => api.photos(slug) });
  const [cat, setCat] = useState<string>("all");
  const [view, setView] = useState<string | null>(null);
  const items = (q.data?.items ?? []).filter((p) => cat === "all" || p.category === cat);
  const cats = q.data?.categories ?? [];
  const grouped = cats.filter((c) => cat === "all" || c.key === cat).map((c) => ({ ...c, items: items.filter((p) => p.category === c.key) }));

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar title={`${q.data?.items.length ?? ""} Photos`} />
      <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-border px-4">
        {[{ key: "all", label: "Semua", count: q.data?.items.length ?? 0 }, ...cats].map((c) => (
          <button key={c.key} type="button" onClick={() => setCat(c.key)} className={cn("shrink-0 border-b-2 pb-2 pt-3 text-[11px] font-semibold", cat === c.key ? "border-brand-500 text-brand-500" : "border-transparent text-neutral-400")}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex-1 p-4">
        {q.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        ) : !items.length ? (
          <EmptyState title="Belum ada foto" body="Properti ini belum mengunggah foto." />
        ) : (
          grouped.map((g) => (
            <div key={g.key} className="mb-5">
              <div className="mb-2 text-[12px] font-bold">
                {g.label} ({g.items.length})
              </div>
              <div className="grid grid-cols-2 gap-3">
                {g.items.map((p, i) => (
                  <button key={p.id} type="button" onClick={() => setView(p.url)} className={cn("overflow-hidden rounded-md", i === 0 && "col-span-2")}>
                    <img src={p.url} alt={p.caption ?? p.type_name ?? ""} loading="lazy" className={cn("w-full object-cover", i === 0 ? "aspect-[16/9]" : "aspect-[4/3]")} />
                    {p.type_name && <div className="mt-1 text-left text-[9px] text-neutral-500">{p.type_name}</div>}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {view && (
        <button type="button" onClick={() => setView(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2">
          <img src={view} alt="" className="max-h-full max-w-full object-contain" />
        </button>
      )}
    </div>
  );
}
