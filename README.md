# BVRooms Customer Booking App (PWA + Android/iOS)

Aplikasi customer white-label per organisasi (brand hotel / pengelola apartemen) untuk booking kamar & unit: onboarding, login/daftar OTP, katalog properti, detail & kategori kamar + add-on, booking multi-kamar, pembayaran manual (transfer + bukti / bayar di tempat), status booking, cancel, ubah data tamu, rating, saved, inbox, akun. UI mengikuti 14 artboard Figma di `Figma UI/` (brand Figma "Premirooms" → BVRooms). Backend: BuildingVision API `/api/v1/bvrooms/*` (repo `buildingvision/api`, modul `internal/bvrooms`) — lihat `BVRooms-Backend-Requirements-v0.2.md`.

Dibangun sebagai **PWA** (installable, offline data terakhir, Web Push) dan dibungkus **Capacitor** untuk build **Android (APK/AAB)** dan **iOS (Xcode)** dari satu codebase.

## Stack

React 19 · Vite 8 · TypeScript · Tailwind v4 · TanStack Query · React Router 7 · date-fns · lucide-react · vite-plugin-pwa (Workbox) · Capacitor 7 (`@capacitor/app`, `status-bar`, `splash-screen`).

## Struktur

```text
src/
├── app/            # router (guard auth/guest), AuthProvider (sesi OTP + refresh), AppConfigProvider (branding org, white-label warna), SearchProvider (tanggal/kamar/tamu), prompt update SW
├── api/            # klien /api/v1/bvrooms/* + tipe respons backend
├── components/     # ui (button, field, shell/bottom-nav, sheet, toast, calendar, otp-input, misc), ilustrasi SVG, kartu properti/booking, widget pencarian
├── features/       # onboarding, auth, home, catalog, property, search, booking (proses/list/detail/bayar/cancel/guest/review), saved, inbox (+ push), account, legal
├── lib/            # http (Bearer + refresh + Idempotency-Key), format ID, geo (Google Maps/WA/tel), native (Capacitor), amenities, rating, status-map (generated)
└── styles/         # theme.css (palet Figma: hijau #2ECC71) + tokens.css (generated dari backend)
public/             # ikon PWA, push-sw.js (handler Web Push untuk service worker)
scripts/            # gen-contracts.mjs, gen-icons.mjs, build-android.mjs
android/ ios/       # proyek native Capacitor (di-commit; hasil build di-ignore)
```

## Menjalankan (web/PWA)

```bash
npm install --legacy-peer-deps
cp .env.example .env            # VITE_ORG_SLUG=graha-pangeran (org demo), BV_API_URL=http://localhost:8080
npm run dev                     # http://localhost:5176 (proxy /api → backend Go)
```

| Variabel | Keterangan |
|---|---|
| `VITE_ORG_SLUG` | slug organization yang dilayani (satu deployment = satu org, D1) |
| `VITE_API_BASE` | base URL API absolut. Kosong = relatif `/api` (dev proxy / reverse-proxy). **Wajib** untuk build native, mis. `https://api.buildingvision.id` |
| `BV_API_URL` | target proxy dev/preview |

Backend dev: `bvctl seed --demo` sudah menyediakan org `graha-pangeran` (2 properti listed: hotel & apartemen, add-on, promo). OTP memakai provider `mock`: kode tampil di layar OTP (`dev_code`, hanya env local/test).

## Perintah

| Area | Perintah |
|---|---|
| Typecheck / test / lint | `npm run typecheck` · `npm test` · `npm run lint` |
| Build PWA + service worker | `npm run build` → `dist/` |
| Preview build (uji install PWA/offline) | `npm run preview` (http://localhost:4176) |
| Sinkron token & status map dari backend | `npm run gen` (mengharapkan `../buildingvision`) |
| Ikon PWA | `npm run icons` |
| Sync ke native (build + salin `dist/`) | `npm run cap:sync` |
| Buka Android Studio / Xcode | `npm run cap:android` · `npm run cap:ios` |
| APK debug tanpa Android Studio | `npm run android:apk` → `android/app/build/outputs/apk/debug/app-debug.apk` |
| APK release (unsigned) | `npm run android:release` (tandatangani dengan keystore Anda) |

## Build Android

Prasyarat: JDK **21** (Capacitor 7/AGP 8.7) dan Android SDK (platform 35). Toolchain portable yang sudah ada di mesin ini: `D:\tools\jdk-21`, `D:\Android\Sdk` — `scripts/build-android.mjs` memakainya otomatis bila `JAVA_HOME`/`ANDROID_HOME` kosong.

```bash
# .env: VITE_API_BASE=https://api.example.com  (di native tidak ada proxy /api)
npm run android:apk
```

Ikon & splash native dibuat dari `assets/` dengan `npx @capacitor/assets generate` (sudah dijalankan; ulangi bila logo berubah). Izin di `AndroidManifest.xml`: INTERNET, lokasi (Terdekat/jarak), POST_NOTIFICATIONS.

## Build iOS

Folder `ios/` sudah dibuat (`npx cap add ios`) dengan ikon, splash, dan `NSLocationWhenInUseUsageDescription`. Build memerlukan macOS + Xcode:

```bash
npm run cap:sync
cd ios/App && pod install
npx cap open ios      # Xcode → Signing & Capabilities (Team) → Product ▸ Archive
```

## Catatan backend untuk native

- App native memanggil API lintas origin (`http://localhost` di Android, `capacitor://localhost` di iOS). Tambahkan keduanya ke `BV_CORS_ORIGINS` backend; header yang dipakai (Authorization, Content-Type, Idempotency-Key) sudah diizinkan.
- Uji ke backend lokal lewat HTTP (bukan HTTPS) di Android perlu `android:usesCleartextTraffic="true"` sementara di manifest (jangan untuk rilis).
- Web Push hanya di web/PWA; di native, inbox memakai polling 30 detik (FCM/APNs belum).
- Pembayaran: gateway/VA **ON HOLD** (D2) — VA tampil "Segera hadir"; transfer manual + unggah bukti (presign ke object storage) diverifikasi Finance di dashboard.

## Alur yang sudah diuji (Edge headless, backend dev)

Onboarding → Daftar (validasi form, OTP mock, salah kode) → Home → Daftar Property (sort, tab, empty state) → tanggal & kamar/tamu → Detail (kategori kamar Terpilih/Penuh, add-on, sheet) → Booking (loading → berhasil) → Detail booking (countdown, salin ID) → Pilih metode → instruksi transfer → Modify Guest → Inbox → Saved → Akun (ubah HP via OTP) → Cancel booking → History → Log Out → Masuk → Guest → offline (SW menampilkan data terakhir).
