// Rute peta (Figma MAPS DIRECTION) = buka Google Maps dengan lat,lng (§8 client-side). Geolokasi untuk "Terdekat" & jarak.
import { loadSession, saveSession } from "./storage";
import { openExternal } from "./native";

export interface Geo {
  lat: number;
  lng: number;
}

export function openDirections(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return;
  openExternal(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
}

export function callPhone(phone: string) {
  window.location.href = "tel:" + phone;
}

export function openWhatsApp(phone: string, text?: string) {
  const num = phone.replace(/\D/g, "");
  openExternal(`https://wa.me/${num}${text ? "?text=" + encodeURIComponent(text) : ""}`);
}

export function cachedGeo(): Geo | null {
  return loadSession<Geo | null>("geo", null);
}

/** Minta lokasi perangkat (sekali, di-cache per sesi). Gagal/ditolak → null tanpa error. */
export function requestGeo(timeoutMs = 8000): Promise<Geo | null> {
  const cached = cachedGeo();
  if (cached) return Promise.resolve(cached);
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const g = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) };
        saveSession("geo", g);
        resolve(g);
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60_000 },
    );
  });
}
