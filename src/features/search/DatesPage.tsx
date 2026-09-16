// Figma BOOKING SETUP: "Select Check In Date" / "Select Check Out Date" — tab Check In | Check Out | Room, kalender, Simpan.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addDays } from "date-fns";
import { useSearch } from "@/app/search";
import { Button } from "@/components/ui/button";
import { CalendarRange } from "@/components/ui/calendar";
import { StickyFooter, TopBar } from "@/components/ui/shell";
import { dateShort, ymd } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function DatesPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const st = (loc.state as { focus?: "in" | "out"; returnTo?: string } | null) ?? {};
  const s = useSearch();
  const [checkIn, setCheckIn] = useState<string>(s.checkIn);
  const [checkOut, setCheckOut] = useState<string | null>(s.checkOut);
  const [focus, setFocus] = useState<"in" | "out">(st.focus ?? "in");

  function pick(d: string) {
    if (focus === "in" || (checkOut && d <= checkIn)) {
      setCheckIn(d);
      setCheckOut(null);
      setFocus("out");
    } else {
      if (d <= checkIn) {
        setCheckIn(d);
        setCheckOut(null);
        return;
      }
      setCheckOut(d);
    }
  }

  function save() {
    const out = checkOut ?? ymd(addDays(new Date(checkIn + "T00:00:00"), 1));
    s.setDates(checkIn, out);
    nav(-1);
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar title={focus === "in" ? "Select Check In Date" : "Select Check Out Date"} />
      <div className="grid grid-cols-3 border-b border-border bg-card text-center">
        <Tab active={focus === "in"} label="Check In" value={dateShort(checkIn)} onClick={() => setFocus("in")} />
        <Tab active={focus === "out"} label="Check Out" value={checkOut ? dateShort(checkOut) : "-"} onClick={() => setFocus("out")} />
        <Tab active={false} label={`${s.rooms.length} Room`} value={`${s.guests} Guest`} onClick={() => nav("/search/guests", { replace: true, state: st })} />
      </div>
      <div className="flex-1 pb-4">
        <CalendarRange start={checkIn} end={checkOut} onPick={pick} />
      </div>
      <StickyFooter>
        <Button block onClick={save}>
          Simpan
        </Button>
      </StickyFooter>
    </div>
  );
}

function Tab({ active, label, value, onClick }: { active: boolean; label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("border-b-2 py-2", active ? "border-brand-500" : "border-transparent")}>
      <div className={cn("text-[9px]", active ? "text-brand-500" : "text-neutral-400")}>{label}</div>
      <div className={cn("text-[11px] font-bold", active ? "text-brand-500" : "text-neutral-500")}>{value}</div>
    </button>
  );
}
