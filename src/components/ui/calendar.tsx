// Kalender Figma "Select Check In Date": header hari (Sun..Sat, Sun & Sat merah), bulan berurutan (scroll vertikal),
// tanggal terpilih lingkaran hijau, rentang hijau muda, tanggal lampau abu.
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isAfter, isBefore, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ymd } from "@/lib/format";

const DOW = ["Sun", "Mon", "Tue", "Wen", "Thu", "Fri", "Sat"];

export function CalendarRange({ start, end, onPick, months = 6, disabledDates }: { start: string | null; end: string | null; onPick: (d: string) => void; months?: number; disabledDates?: Set<string> }) {
  const today = startOfDay(new Date());
  const s = start ? new Date(start + "T00:00:00") : null;
  const e = end ? new Date(end + "T00:00:00") : null;
  return (
    <div>
      <div className="sticky top-14 z-10 grid grid-cols-7 border-b border-border bg-card py-2 text-center text-[11px] font-bold">
        {DOW.map((d, i) => (
          <div key={d} className={cn(i === 0 || i === 6 ? "text-danger" : "text-neutral-700")}>
            {d}
          </div>
        ))}
      </div>
      {Array.from({ length: months }).map((_, i) => {
        const m = addMonths(startOfMonth(today), i);
        const days = eachDayOfInterval({ start: m, end: endOfMonth(m) });
        const offset = getDay(m);
        return (
          <div key={i} className="border-b border-border px-2 pb-3">
            <div className="py-3 text-center text-[12px] font-bold">{format(m, "MMMM yyyy", { locale: localeID })}</div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: offset }).map((_, k) => (
                <div key={"o" + k} />
              ))}
              {days.map((d) => {
                const key = ymd(d);
                const past = isBefore(d, today);
                const disabled = past || disabledDates?.has(key);
                const isStart = !!s && isSameDay(d, s);
                const isEnd = !!e && isSameDay(d, e);
                const inRange = !!s && !!e && isAfter(d, s) && isBefore(d, e);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => onPick(key)}
                    className={cn(
                      "relative mx-auto flex h-9 w-9 items-center justify-center text-[12px] font-semibold",
                      disabled ? "text-neutral-300" : "text-neutral-800",
                      inRange && "bg-brand-100",
                      (isStart || isEnd) && "z-10 rounded-full bg-brand-500 text-white",
                      isStart && e && "rounded-l-full",
                      isEnd && s && "rounded-r-full",
                      !isStart && !isEnd && !inRange && "rounded-full",
                    )}
                  >
                    {format(d, "d")}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
