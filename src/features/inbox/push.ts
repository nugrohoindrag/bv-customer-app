// Web Push VAPID (§5.5): subscribe pushManager dengan vapid_public_key dari app-config → POST customers/me/push-subscriptions.
// Hanya web/PWA (di native Capacitor perlu FCM/APNs — belum; inbox tetap polling 30 s).
import { useCallback, useEffect, useState } from "react";
import { api } from "@/api";
import { useAppConfig } from "@/app/app-config";
import { isNative } from "@/lib/native";
import { loadJSON, saveJSON } from "@/lib/storage";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function usePushSubscription() {
  const { config } = useAppConfig();
  const key = config.features.vapid_public_key;
  const available = !isNative && !!key && typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const [subscribed, setSubscribed] = useState<boolean>(() => loadJSON<boolean>("push-subscribed", false));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!available) return;
    navigator.serviceWorker.getRegistration().then((reg) => (reg ? reg.pushManager.getSubscription() : null)).then((s) => setSubscribed(!!s)).catch(() => {});
  }, [available]);

  const subscribe = useCallback(async () => {
    if (!available || !key) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
      const j = sub.toJSON();
      await api.subscribePush({ endpoint: sub.endpoint, keys: { p256dh: j.keys?.p256dh ?? "", auth: j.keys?.auth ?? "" } });
      setSubscribed(true);
      saveJSON("push-subscribed", true);
    } catch {
      // izin ditolak / gagal subscribe: tetap polling
    } finally {
      setBusy(false);
    }
  }, [available, key]);

  return { available, subscribed, busy, subscribe };
}

/** Saat logout: lepas subscription di browser (server merevoke sesi + subscription device). */
export async function unsubscribePushLocal() {
  try {
    if (isNative || !("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      await api.unsubscribePush(sub.endpoint).catch(() => {});
      await sub.unsubscribe();
    }
  } catch {
    // abaikan
  } finally {
    saveJSON("push-subscribed", false);
  }
}
