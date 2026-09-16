// Handler Web Push untuk service worker BVRooms (di-import oleh SW hasil generateSW via workbox.importScripts).
// Payload backend: {title, body, type, booking_code, notification_id}. Klik notifikasi → buka detail booking.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "BVRooms", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "BVRooms";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.notification_id || undefined,
    data: { url: data.booking_code ? "/bookings/" + data.booking_code : "/inbox" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/inbox";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
