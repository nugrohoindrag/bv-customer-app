// State pencarian bersama (Figma widget Check In / Check Out / Room & Guest + Booking Setup): tanggal, daftar kamar
// (dewasa, anak, extra bed per kamar), kata kunci, kategori, sort. Dipersist per sesi agar konsisten Home → Daftar → Detail.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { addDays } from "date-fns";
import { nightsBetween, ymd } from "@/lib/format";
import { loadSession, saveSession } from "@/lib/storage";

export interface RoomSetup {
  adults: number;
  children: number;
  extraBeds: number;
}

export interface SearchState {
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  rooms: RoomSetup[];
  q: string;
  category: "all" | "hotel" | "apartment";
  sort: "popular" | "price_asc" | "distance";
}

interface SearchCtx extends SearchState {
  nights: number;
  adults: number;
  children: number;
  guests: number;
  setDates(checkIn: string, checkOut: string): void;
  setRooms(rooms: RoomSetup[]): void;
  setQ(q: string): void;
  setCategory(c: SearchState["category"]): void;
  setSort(s: SearchState["sort"]): void;
}

const defaultState = (): SearchState => {
  const today = new Date();
  return { checkIn: ymd(today), checkOut: ymd(addDays(today, 1)), rooms: [{ adults: 2, children: 0, extraBeds: 0 }], q: "", category: "all", sort: "popular" };
};

const Ctx = createContext<SearchCtx | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SearchState>(() => {
    const saved = loadSession<SearchState | null>("search", null);
    if (!saved) return defaultState();
    // tanggal lampau (sesi lama) → reset ke default
    if (saved.checkIn < ymd(new Date())) return { ...saved, ...defaultState(), q: saved.q, category: saved.category, sort: saved.sort };
    return saved;
  });

  const update = useCallback((patch: Partial<SearchState>) => {
    setState((s) => {
      const next = { ...s, ...patch };
      saveSession("search", next);
      return next;
    });
  }, []);

  const value = useMemo<SearchCtx>(() => {
    const adults = state.rooms.reduce((a, r) => a + r.adults, 0);
    const children = state.rooms.reduce((a, r) => a + r.children, 0);
    return {
      ...state,
      nights: nightsBetween(state.checkIn, state.checkOut),
      adults,
      children,
      guests: adults + children,
      setDates: (checkIn, checkOut) => update({ checkIn, checkOut }),
      setRooms: (rooms) => update({ rooms: rooms.length ? rooms : [{ adults: 1, children: 0, extraBeds: 0 }] }),
      setQ: (q) => update({ q }),
      setCategory: (category) => update({ category }),
      setSort: (sort) => update({ sort }),
    };
  }, [state, update]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSearch(): SearchCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSearch di luar SearchProvider");
  return v;
}
