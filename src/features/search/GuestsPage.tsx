// Figma "Select number of rooms and guests": Tambah Room, per kamar (accordion): Jumlah Tamu (≥5 th), Jumlah Tamu Anak
// (<5 th), Extra bed (harga sesuai kebijakan hotel — add-on D5), hapus kamar, Simpan.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Plus, XCircle } from "lucide-react";
import { useSearch, type RoomSetup } from "@/app/search";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/misc";
import { StickyFooter, TopBar } from "@/components/ui/shell";
import { dateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_ROOMS = 5;

export default function GuestsPage() {
  const nav = useNavigate();
  const s = useSearch();
  const [rooms, setRooms] = useState<RoomSetup[]>(s.rooms.map((r) => ({ ...r })));
  const [open, setOpen] = useState(0);

  function patch(i: number, p: Partial<RoomSetup>) {
    setRooms((rs) => rs.map((r, k) => (k === i ? { ...r, ...p } : r)));
  }
  function remove(i: number) {
    setRooms((rs) => rs.filter((_, k) => k !== i));
    setOpen(0);
  }
  const guests = rooms.reduce((a, r) => a + r.adults + r.children, 0);

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-surface">
      <TopBar title="Select number of rooms and guests" />
      <div className="grid grid-cols-3 border-b border-border bg-card text-center">
        <Tab label="Check In" value={dateShort(s.checkIn)} />
        <Tab label="Check Out" value={dateShort(s.checkOut)} />
        <Tab label={`${rooms.length} Room`} value={`${guests} Guest`} active />
      </div>
      <div className="flex-1 space-y-3 p-4">
        <Button block disabled={rooms.length >= MAX_ROOMS} onClick={() => setRooms((rs) => [...rs, { adults: 2, children: 0, extraBeds: 0 }])}>
          Tambah Room <Plus size={16} strokeWidth={3} />
        </Button>
        {rooms.map((r, i) => (
          <div key={i} className="overflow-hidden rounded-md bg-card shadow-card">
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center gap-2 px-3 py-3 text-left">
              {rooms.length > 1 ? (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Hapus kamar"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(i);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && remove(i)}
                  className="text-danger"
                >
                  <XCircle size={16} fill="currentColor" className="text-danger [&>circle]:fill-danger" stroke="#fff" />
                </span>
              ) : null}
              <span className="text-[12px] font-bold">Room {i + 1}</span>
              <span className="flex-1 text-[10px] text-neutral-500">
                for {r.adults + r.children} Guest{r.extraBeds > 0 && ` + ${r.extraBeds} Extra Bed`}
              </span>
              {open === i ? <ChevronUp size={16} className="text-brand-500" /> : <ChevronDown size={16} className="text-brand-500" />}
            </button>
            {open === i && (
              <div className="space-y-4 border-t border-border px-3 py-3">
                <Line label="Jumlah Guest ( Berumur lebih dari 5 Tahun )" value={`${r.adults} Orang`}>
                  <Stepper value={r.adults} min={1} max={10} onChange={(v) => patch(i, { adults: v })} />
                </Line>
                <Line label="Jumlah Guest Anak ( Berumur dibawah dari 5 Tahun )" value={`${r.children} Anak`}>
                  <Stepper value={r.children} min={0} max={6} onChange={(v) => patch(i, { children: v })} />
                </Line>
                <Line label="Extra Bed" value={`${r.extraBeds} bed`}>
                  <Stepper value={r.extraBeds} min={0} max={3} onChange={(v) => patch(i, { extraBeds: v })} />
                </Line>
                <p className="text-[9px] text-danger">Harga Extra Bed sesuai kebijakan hotel masing-masing.</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <StickyFooter>
        <Button
          block
          onClick={() => {
            s.setRooms(rooms);
            nav(-1);
          }}
        >
          Simpan
        </Button>
      </StickyFooter>
    </div>
  );
}

function Line({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] text-neutral-400">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[12px] font-bold">{value}</span>
        {children}
      </div>
    </div>
  );
}

function Tab({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className={cn("border-b-2 py-2", active ? "border-brand-500" : "border-transparent")}>
      <div className={cn("text-[9px]", active ? "text-brand-500" : "text-neutral-400")}>{label}</div>
      <div className={cn("text-[11px] font-bold", active ? "text-brand-500" : "text-neutral-500")}>{value}</div>
    </div>
  );
}
