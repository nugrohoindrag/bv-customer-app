// Branding org white-label (D1): GET /bvrooms/app-config → nama, logo, warna utama, teks welcome, fitur.
// primary_color menimpa --bvr-brand-* runtime. Di-cache localStorage agar splash tidak menunggu jaringan.
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type { AppConfig } from "@/api/types";
import { loadJSON, saveJSON } from "@/lib/storage";

const FALLBACK: AppConfig = {
  organization: { id: "", slug: import.meta.env.VITE_ORG_SLUG || "", name: "BVRooms", logo_url: null, primary_color: null, welcome_title: "Selamat datang di BVRooms!", welcome_body: "Mau pesan kamar hotel dengan harga terpercaya, mudah, dan pelayanan terbaik? Di BVRooms semua bisa!" },
  features: { pay_at_property: false, online_payment: false, web_push: false, otp_provider: "mock", auth_method: "pin" },
  listed_count: 0,
  single_property_slug: null,
  default_category: "all",
};

interface Ctx {
  config: AppConfig;
  loaded: boolean;
  brandName: string;
}

const AppConfigCtx = createContext<Ctx | null>(null);

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * t));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

/** Terapkan warna utama org ke token brand (tint/shade dihitung dari satu warna). */
export function applyBrandColor(primary: string | null | undefined) {
  const root = document.documentElement;
  const rgb = primary ? hexToRgb(primary) : null;
  if (!rgb) {
    for (const k of ["50", "100", "200", "400", "500", "600", "700"]) root.style.removeProperty(`--bvr-brand-${k}`);
    return;
  }
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];
  root.style.setProperty("--bvr-brand-50", mix(rgb, white, 0.9));
  root.style.setProperty("--bvr-brand-100", mix(rgb, white, 0.8));
  root.style.setProperty("--bvr-brand-200", mix(rgb, white, 0.6));
  root.style.setProperty("--bvr-brand-400", mix(rgb, white, 0.25));
  root.style.setProperty("--bvr-brand-500", `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`);
  root.style.setProperty("--bvr-brand-600", mix(rgb, black, 0.15));
  root.style.setProperty("--bvr-brand-700", mix(rgb, black, 0.35));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", primary!);
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const cached = useMemo(() => loadJSON<AppConfig | null>("app-config", null), []);
  const q = useQuery({
    queryKey: ["app-config"],
    queryFn: api.appConfig,
    staleTime: 5 * 60_000,
    placeholderData: cached ?? undefined,
    retry: 2,
  });
  const config = q.data ?? cached ?? FALLBACK;

  useEffect(() => {
    if (q.data) saveJSON("app-config", q.data);
  }, [q.data]);
  useEffect(() => {
    applyBrandColor(config.organization.primary_color);
  }, [config.organization.primary_color]);

  const value = useMemo<Ctx>(() => ({ config, loaded: !!q.data || !!cached, brandName: config.organization.name || "BVRooms" }), [config, q.data, cached]);
  return <AppConfigCtx.Provider value={value}>{children}</AppConfigCtx.Provider>;
}

export function useAppConfig(): Ctx {
  const v = useContext(AppConfigCtx);
  if (!v) throw new Error("useAppConfig di luar AppConfigProvider");
  return v;
}
