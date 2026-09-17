# BVRooms — Customer Booking App: Backend Requirements v0.2

**Menggantikan v0.1** (16 Sep 2026) setelah keputusan PM atas D1–D5 dan §10.
**Sumber UI:** 14 artboard Figma di `customer-booking-app/Figma UI/` (brand Figma "Premirooms" → resmi **BVRooms**).
**Target backend:** monorepo `buildingvision/api` (Go, Postgres 17, goose, chi) — modul baru `internal/bvrooms/`, prefix route `/api/v1/bvrooms/*`.
**Client:** PWA React di repo `customer-booking-app` (pola sama Tenant PWA: `VITE_API_MODE=http`, `VITE_ORG_SLUG`, proxy `/api` → :8080).

---

## 0. Keputusan produk yang mengikat dokumen ini

| # | Keputusan (PM, 16 Sep 2026) | Konsekuensi teknis |
|---|-----------------------------|--------------------|
| D1 | BVRooms adalah **app white-label per organisasi** (brand hotel atau pengelola gedung apartemen) untuk booking/sewa kamar & unit milik org itu sendiri. **Bukan** marketplace lintas kota/lintas org. | Semua data **org-scoped** memakai RLS existing (`app_current_org()`); tidak ada tabel platform-level, tidak ada bypass RLS. Fitur Figma yang dihapus: chip kota, "All Provinsi", "Popular Place at Jakarta". Guardrail PRD #18/#21 tetap dipatuhi tanpa revisi. |
| D2 | Layar Virtual Account (BCA/Mandiri/BNI/BRIVA) **hanya mockup** di UI. Gateway tetap **ON HOLD**. | Alur pembayaran provider-agnostic lewat `billing.Provider`. Fase 1: `manual_transfer` (instruksi rekening + upload bukti + verifikasi Finance) dan `pay_at_property`. Webhook gateway disiapkan sebagai interface, tidak diaktifkan. |
| D3 | OTP SMS: **backend disiapkan**, integrasi vendor **di-hold**. | Tabel OTP, endpoint, interface `SMSProvider` dengan implementasi `mock` (kode ditulis ke log / dikembalikan di respons saat `BV_ENV=dev`). Adapter vendor menyusul tanpa mengubah kontrak. |
| D4 | **Bedakan** properti apartemen dan hotel. | `listing_category ∈ hotel\|apartment` di profil listing. Hotel memakai `hotel_room_types`/`hotel_rooms` (Kamar); apartemen memakai **`bvrooms_unit_types`** yang memetakan ke `units` residential (Unit). Terminologi (Kamar/Unit, Tamu/Penghuni) mengikuti kategori dan `property_profiles.terminology`. |
| D5 | Extra bed & sarapan = **package/add-on** yang aturan dan harganya **diinput di dashboard** hotel management. | Tabel `bvrooms_addons` per properti/room type (jenis, satuan harga, harga, maksimum). Client merender add-on secara dinamis; tidak ada harga hard-coded. |
| §10 | Tidak ada aturan anak gratis; tidak ada mesin promo code; **diskon & banner promo diatur di dashboard**; review **bintang saja**. | `children` hanya informasi. Tabel `bvrooms_promotions` (diskon persen/nominal, periode, properti/room type, tampil sebagai banner) + `bvrooms_banners` (informasi). `bvrooms_reviews` tanpa kolom komentar. |

---

## 1. Inventaris layar → kebutuhan backend (sudah disesuaikan D1–D5)

| Artboard | Fitur yang dipakai | Kebutuhan backend |
|----------|--------------------|-------------------|
| SPLASH / LANDING / WELCOME | Onboarding, Masuk / Daftar / Masuk sebagai Guest, toggle bahasa | Branding org (nama, logo, warna, teks welcome) dari `GET /bvrooms/app-config`. Guest = endpoint publik tanpa token. |
| LOGIN - REGISTER | Nomor HP (+62) → OTP 4 digit (countdown 1:39, Kirim Ulang), error "nomor tidak terdaftar"; Register: nama, email, HP → OTP → simpan | `POST /bvrooms/auth/otp/request`, `…/otp/verify`, `…/register`, `…/refresh`, `…/logout`. Provider SMS `mock` (D3). |
| HOME - LIST PROPERTY | Header nama user; widget Check In / Check Out / Room & Guest; search "Cari Hotel, Kota, atau Lokasi"; **chip properti org** (menggantikan chip kota; disembunyikan bila org hanya punya 1 properti) + "Terdekat"; banner promo; "Jelajahi" horizontal; Daftar Property tab All / Apartement / Hotel; kartu (foto, rating, nama, alamat, "Start from Rp …/Nett", jarak); Sort: Terpopuler / Harga Terendah / Lokasi Terdekat; empty & offline state | `GET /bvrooms/catalog/properties` (q, category, tanggal & pax → harga mulai dari, geo → jarak, sort), `GET /bvrooms/catalog/banners`. Bila org hanya 1 properti, client langsung membuka Detail Property sebagai home. |
| DETAIL PROPERTY | Galeri per kategori ("32 Photos"), ♥ wishlist, share, rating badge, jarak, Arahkan; Description (Lokasi / Fitur Khusus / Fasilitas / Terdekat); Amenities (Hotel/Unit Facilities & Room Type Facilities); Travel Dates & Guest; Room Category carousel (foto, nama, ukuran, Max Guest, amenities, harga/Nett, Terpilih/Pilih/Penuh); **add-on** (Breakfast per tamu, Extra Bed per bed, maks) dari dashboard; Ratings (skor, label, jumlah, histogram); Guest Details prefilled; Policies; Total; Booking Sekarang | `GET /bvrooms/catalog/properties/{slug}`, `…/photos`, `…/room-types?check_in&check_out&rooms&adults&children` (availability + harga + add-on), `…/reviews/summary`, wishlist. |
| MAPS DIRECTION - BOOKING SETUP - EXTRA BEDS | Rute peta; kalender Check In / Check Out; Tambah Room; per Room: jumlah tamu, anak, extra bed | Rute = client buka Google Maps dengan `lat,lng`. Multi-kamar → satu booking N baris. `…/room-types/{id}/calendar?month=` untuk menutup tanggal penuh. |
| BOOKING LOADING | Request Booking → Berhasil ("yuk langsung dibayar agar tidak hangus") / Gagal | `POST /bvrooms/bookings` (Idempotency-Key); 409 `room_unavailable`. |
| STATUS - PAYMENT | Booking Details (countdown deadline, status UNPAID/PAID/CHECK IN/CHECK OUT/CANCELLED, Booking ID + salin, tamu, kamar x n, Check In/Out, Arahkan, Hubungi, Policies, Manage Booking, Total, Bayar Sekarang); Pilih Metode Pembayaran; halaman instruksi bayar | `GET /bvrooms/bookings/{code}`, `GET /bvrooms/payment-methods`, `POST …/payment`, `…/payment/change-method`, `…/payment/proof`. Metode VA tampil **disabled + label "Segera hadir"** (D2). |
| BOOKING SECTION | Upcoming / History, aksi Bayar / Arahkan / Booking Lagi | `GET /bvrooms/bookings?scope=` |
| CANCEL BOOKING | Sheet kebijakan pembatalan, konfirmasi, status CANCELLED | `POST /bvrooms/bookings/{code}/cancel`; teks & aturan pembatalan dari dashboard. |
| MODIFY DATA BOOKING | Ubah nama/email/HP tamu utama | `PATCH /bvrooms/bookings/{code}/guest` |
| BERI RATING | 1–5 bintang + label, tampil kembali di detail | `POST /bvrooms/bookings/{code}/review` (bintang saja). |
| SAVED SECTION | Grid properti tersimpan + search | `/bvrooms/customers/me/wishlist` |
| INBOX SECTION | Notifikasi booking (hijau/merah), geser hapus, push OS | `/bvrooms/customers/me/notifications`, `…/push-subscriptions` (Web Push VAPID). |
| AKUN SECTION | Profil, Edit Data Akun (ganti HP → OTP), Log Out | `GET/PATCH /bvrooms/customers/me` |

---

## 2. Arsitektur

1. **Modul `internal/bvrooms/`**: `http.go`, `auth.go` (OTP, sesi), `catalog.go`, `booking.go`, `payment.go`, `review.go`, `notify.go`, `sweep.go`, `sms/` (interface + mock). Admin/dashboard endpoint listing & add-on ikut di modul ini dengan permission org.
2. **Resolusi organisasi tanpa token** (endpoint publik): query `organization_slug` (pola `tenantapp` registration) — client mengirimnya dari `VITE_ORG_SLUG`. Middleware `bvrooms.WithOrg` men-set org context sebelum query, sehingga RLS existing berlaku apa adanya. Endpoint publik hanya mengembalikan properti dengan `bvrooms_listed = true`.
3. **Customer ≠ `users`.** Tabel `bvrooms_customers` org-scoped (unik `organization_id + phone_e164`). JWT customer: issuer `bvrooms`, `aud=bvrooms_customer`, claim `org`, `cid`. Middleware `iam` menolak token ini dan sebaliknya.
4. **Inventori bersama dengan dashboard:**
   - Hotel: `hotel_room_types` / `hotel_rooms` / `hotel_rates` / `hotel_reservations` existing. BVRooms **menulis `hotel_reservations`** (`source='bvrooms'`) sehingga reservasi tampil di Front Office dan dilindungi exclusion constraint anti double-booking.
   - Apartemen (D4): `bvrooms_unit_types` (tipe unit sewa harian/mingguan, harga per malam) memetakan ke `units` residential yang ditandai `rentable_daily`. Reservasi apartemen **juga** disimpan di `hotel_reservations` (kolom `room_type_id` → nullable, tambah `unit_type_id`) agar satu mesin status; staf mengelolanya dari menu "Sewa Unit" (label berbeda, tabel sama). Alternatif tabel reservasi terpisah ditolak karena menggandakan status engine.
5. **Status booking = `hotel_reservations.status`** (dioperasikan staf). BVRooms menambah lapisan pembayaran (`bvrooms_payments`) dan status customer-facing derivasi (§4).
6. **Kontrak:** tambah `bvrooms_booking_customer` di `contracts/status-map.yaml`, path `/bvrooms/*` di `contracts/openapi.yaml`; PWA `npm run gen`.
7. **Idempotency** header `Idempotency-Key` pada `POST /bookings` dan `POST …/payment` (simpan 24 jam). **Audit** semua transisi ke `audit_log` (actor `customer:{id}` / `system:bvrooms_sweep` / user staf).

---

## 3. Skema (migration `000xx_bvrooms.sql`) — semua org-scoped + RLS `org_isolation`

### 3.1 Identitas & sesi customer

```sql
bvrooms_customers
  id uuid PK, organization_id FK,
  phone_e164 text NOT NULL, full_name text NOT NULL, email text,
  status text CHECK (active|blocked) DEFAULT 'active', locale text DEFAULT 'id',
  last_login_at, created_at, updated_at, version,
  UNIQUE (organization_id, phone_e164)

bvrooms_otp_codes
  id, organization_id, phone_e164, purpose CHECK (login|register|change_phone),
  code_hash text, expires_at, attempts int DEFAULT 0, consumed_at, created_at
  -- 4 digit; TTL 100 s (Figma 1:39); maks 5 percobaan; cooldown resend 60 s;
  -- maks 5 request/nomor/jam & 20 request/IP/jam; hash argon2id

bvrooms_sessions
  id, organization_id, customer_id FK, device_id, refresh_hash, user_agent,
  created_at, expires_at, revoked_at

bvrooms_idempotency_keys (organization_id, customer_id, key, request_hash, response_json, created_at)
```

### 3.2 Listing properti (konten yang dipublikasikan)

```sql
bvrooms_property_listings            -- 1:1 properties
  property_id PK FK properties(location_id), organization_id FK,
  bvrooms_listed boolean DEFAULT false,
  slug text, UNIQUE (organization_id, slug),
  listing_category text NOT NULL CHECK (hotel|apartment),         -- D4
  display_name text, tagline text,
  address_line text, district text, city text, lat numeric(9,6), lng numeric(9,6),
  phone text, whatsapp text,                                       -- "Hubungi Hotel"
  check_in_time time DEFAULT '14:00', check_out_time time DEFAULT '12:00',
  description_sections jsonb DEFAULT '[]',   -- [{key:'lokasi'|'fitur_khusus'|'fasilitas'|'terdekat', title, body}]
  facilities text[] DEFAULT '{}',            -- kode amenity (§6)
  policies text[] DEFAULT '{}',              -- bullet Policies
  cancellation_policy_md text,               -- teks sheet Cancel Booking Policies
  cancellation_rules jsonb DEFAULT '{"free_until_hours_before_checkin":24,"fee_pct_after":100}',
  payment_window_hours int DEFAULT 5,        -- countdown "Selesaikan Pembayaran dalam 5 Jam"
  bank_accounts jsonb DEFAULT '[]',          -- [{bank, account_number, account_name}] untuk manual_transfer (D2)
  allow_pay_at_property boolean DEFAULT false,
  popularity_score numeric DEFAULT 0,        -- sort "Terpopuler" (job: bobot booking 90 hari + rating)
  rating_avg numeric(3,2) DEFAULT 0, rating_count int DEFAULT 0, rating_hist int[] DEFAULT '{0,0,0,0,0}',
  min_rate_cache bigint, min_rate_cached_at timestamptz,          -- "Start from"
  created_at, updated_at, updated_by, version

bvrooms_property_photos
  id, organization_id, property_id FK,
  category text CHECK (facade|room|receptionist|lobby|restaurant|pool|other),
  room_type_id uuid NULL, unit_type_id uuid NULL,
  asset_id FK assets, caption, sort_order int, is_cover boolean DEFAULT false

bvrooms_banners                        -- banner home (informasi) — diatur di dashboard
  id, organization_id, property_id NULL, title, subtitle, image_asset_id, cta_label, deep_link,
  starts_at, ends_at, sort_order, is_active

bvrooms_promotions                     -- diskon — diatur di dashboard (§10)
  id, organization_id, property_id NULL, room_type_id NULL, unit_type_id NULL,
  name text, discount_type CHECK (percent|fixed), discount_value bigint,
  min_nights int DEFAULT 1, stay_from date, stay_until date, book_from timestamptz, book_until timestamptz,
  show_as_banner boolean DEFAULT true, banner_asset_id NULL, is_active boolean,
  created_at, updated_at, version
  -- diterapkan otomatis (tanpa kode) pada harga kamar yang memenuhi syarat; satu promo terbaik per baris kamar

ALTER TABLE properties … CHECK (property_type IN ('office','mall','apartment','mixed','industrial','hotel'));
```

### 3.3 Inventori apartemen (D4) & add-on (D5)

```sql
bvrooms_unit_types                     -- tipe unit apartemen sewa harian ("Studio 25 m²", "2BR")
  id, organization_id, property_id FK, unit_type_code text,      -- UT-2026-000001
  name, description, capacity_adults int, capacity_children int, bedrooms int, size_m2 numeric,
  amenities text[], base_rate bigint, currency_code char(3) DEFAULT 'IDR',
  photo_asset_id, status CHECK (active|archived), created_at, updated_at, version,
  UNIQUE (organization_id, unit_type_code)

ALTER TABLE units ADD COLUMN bvrooms_unit_type_id uuid NULL REFERENCES bvrooms_unit_types(id),
                  ADD COLUMN rentable_daily boolean NOT NULL DEFAULT false;
-- unit residential dengan rentable_daily = true adalah inventori BVRooms apartemen.
-- Availability apartemen: hitung units rentable per unit_type dikurangi reservasi overlap (query sama dengan availabilityTx).

bvrooms_addons                         -- package/add-on, diinput di dashboard (D5)
  id, organization_id, property_id FK,
  room_type_id uuid NULL, unit_type_id uuid NULL,                  -- NULL = berlaku semua tipe di properti
  addon_code text,                                                 -- ADD-2026-000001
  kind text CHECK (breakfast|extra_bed|other), name text,          -- "Breakfast", "Extra Bed"
  pricing_unit text CHECK (per_guest_per_night|per_item_per_night|per_booking),
  price bigint, max_qty int DEFAULT 1,                             -- "x3 beds"
  is_active boolean, sort_order int, created_at, updated_at, version

-- hotel_rates: dipakai apa adanya untuk hotel. Untuk apartemen tambah kolom unit_type_id NULL
ALTER TABLE hotel_rates ALTER COLUMN room_type_id DROP NOT NULL, ADD COLUMN unit_type_id uuid NULL REFERENCES bvrooms_unit_types(id),
  ADD CHECK ((room_type_id IS NULL) <> (unit_type_id IS NULL));
```

### 3.4 Booking multi-kamar, pembayaran, review

```sql
bvrooms_bookings
  id uuid PK, organization_id, property_id,
  booking_code text, UNIQUE (organization_id, booking_code),        -- 12 char Crockford base32 ("H1H38Q8SMD8P")
  customer_id FK bvrooms_customers,
  guest_full_name, guest_email, guest_phone,                        -- Modify Guest Data
  check_in_date date, check_out_date date, nights int GENERATED,
  rooms_count int, adults_total int, children_total int,
  room_subtotal bigint, addon_subtotal bigint, discount_amount bigint DEFAULT 0, promotion_id uuid NULL,
  total_amount bigint, currency_code char(3) DEFAULT 'IDR',
  payment_status CHECK (unpaid|paid|expired|refund_pending|refunded|pay_at_property),
  payment_deadline_at timestamptz,
  status_override CHECK (cancelled|expired) NULL,
  cancelled_at, cancel_reason, cancelled_by CHECK (customer|property|system),
  reviewed_at, created_at, updated_at, version

bvrooms_booking_rooms                  -- 1 baris = 1 kamar/unit dipesan → 1 hotel_reservations
  id, organization_id, booking_id FK, reservation_id FK hotel_reservations UNIQUE,
  room_type_id NULL, unit_type_id NULL, adults int, children int,
  rate_per_night bigint, nights int, discount_amount bigint DEFAULT 0, line_total bigint

bvrooms_booking_addons                 -- add-on per baris kamar
  id, organization_id, booking_room_id FK, addon_id FK, qty int, unit_price bigint, line_total bigint

bvrooms_payments
  id, organization_id, booking_id FK,
  provider_code text,                  -- manual | mock_gateway | (midtrans|xendit saat hold dicabut) — via billing.Provider
  method_code text,                    -- transfer_bca | transfer_mandiri | … | cash_on_site | bca_va (nonaktif)
  amount bigint, status CHECK (pending|proof_submitted|paid|expired|failed|cancelled),
  instructions jsonb,                  -- {bank, account_number, account_name, note}
  external_ref text, va_number text NULL,
  proof_asset_id uuid NULL, proof_submitted_at, verified_by uuid NULL, verified_at, paid_at, expires_at,
  created_at, updated_at, version

bvrooms_reviews                        -- bintang saja (§10)
  id, organization_id, property_id, booking_id UNIQUE, customer_id,
  stars smallint CHECK (stars BETWEEN 1 AND 5), display_name text, created_at
  -- trigger AFTER INSERT: update rating_avg/rating_count/rating_hist di bvrooms_property_listings

bvrooms_wishlists (organization_id, customer_id, property_id, created_at) PK (customer_id, property_id)

bvrooms_notifications
  id, organization_id, customer_id FK, type text, title, body, booking_id NULL,
  severity CHECK (success|danger|info), created_at, read_at, deleted_at, delivered_push_at

bvrooms_push_subscriptions (id, organization_id, customer_id, endpoint UNIQUE, p256dh, auth, user_agent, created_at, revoked_at)

-- hotel_reservations: perluasan minimal
ALTER TABLE hotel_reservations
  ALTER COLUMN room_type_id DROP NOT NULL,
  ADD COLUMN unit_type_id uuid NULL REFERENCES bvrooms_unit_types(id),
  ADD COLUMN unit_location_id uuid NULL REFERENCES units(location_id),   -- assignment unit apartemen
  ADD COLUMN bvrooms_booking_id uuid NULL REFERENCES bvrooms_bookings(id),
  ADD CHECK ((room_type_id IS NULL) <> (unit_type_id IS NULL)),
  DROP CONSTRAINT hotel_reservations_source_check,
  ADD CONSTRAINT hotel_reservations_source_check CHECK (source IN ('walk_in','phone','email','website','corporate','bvrooms','other'));
-- exclusion constraint tambahan untuk unit apartemen:
ALTER TABLE hotel_reservations ADD CONSTRAINT excl_unit_stay
  EXCLUDE USING gist (unit_location_id WITH =, stay WITH &&)
  WHERE (unit_location_id IS NOT NULL AND status IN ('new','confirmed','checked_in'));
```

Setiap `hotel_reservations` dari BVRooms: `source='bvrooms'`, `status='new'`, `guest_*` dari header, `adults/children` per baris, `special_requests` = ringkasan add-on, `bvrooms_booking_id` terisi, `tenant_user_id` tidak dipakai.

---

## 4. Mesin status

### 4.1 Status customer-facing (masuk `status-map.yaml` → `bvrooms_booking_customer`)

| Status Figma | Kondisi derivasi | Tab |
|---|---|---|
| `UNPAID` | `payment_status=unpaid` ∧ semua reservasi `new` ∧ `now < payment_deadline_at` | Upcoming (aksi **Bayar**) |
| `PAID` | `payment_status ∈ {paid, pay_at_property}` ∧ reservasi `confirmed` | Upcoming (aksi **Arahkan**) |
| `CHECK IN` | ada reservasi `checked_in` | Upcoming (aksi **Arahkan**) |
| `CHECK OUT` | semua reservasi `checked_out` | History (aksi **Booking Lagi**, **Beri Rating** bila belum) |
| `CANCELLED` | `status_override=cancelled` ∨ semua reservasi `cancelled`/`no_show` | History (aksi **Booking Lagi**) |
| `EXPIRED` | `payment_status=expired` (Figma: "Pemesanan Hangus") | History, ditampilkan CANCELLED + sub-label "Hangus" |

### 4.2 Transisi & efek samping

| Transisi | Pemicu | Efek |
|---|---|---|
| — → UNPAID | `POST /bookings` | 1 transaksi: cek availability tiap tipe (`availabilityTx` / versi unit), terapkan promo aktif, hitung add-on, insert `bvrooms_bookings` + N `hotel_reservations(new)`; `payment_deadline_at = now() + payment_window_hours`; notif **Pemesanan Berhasil** (success) |
| — → PAID (pay_at_property) | `POST /bookings` dengan `payment.method_code=cash_on_site` dan `allow_pay_at_property` | reservasi langsung `confirmed`, `payment_status=pay_at_property`, tanpa deadline; notif Pemesanan Berhasil |
| UNPAID → PAID | Finance **Verify Payment** di dashboard (bukti transfer) — atau webhook gateway bila hold dicabut | payment `paid`, reservasi `confirmed` (`confirmed_at`), notif **Pembayaran Diterima** (success) |
| UNPAID → EXPIRED | job `sweep` tiap 1 menit: `payment_deadline_at < now()` ∧ belum `proof_submitted` | reservasi `cancelled` (`cancel_reason='payment_expired'`), payment `expired`, notif **Pemesanan Hangus!** (danger). Bukti sudah dikirim → deadline diperpanjang 24 jam menunggu verifikasi; Finance menolak → EXPIRED |
| UNPAID/PAID → CANCELLED | customer `POST …/cancel` (diizinkan bila `now < check_in_date + check_in_time`) atau staf membatalkan di dashboard | reservasi `cancelled`; bila `paid` → `payment_status=refund_pending` (refund manual Finance sesuai `cancellation_rules`); notif **Pemesanan Dibatalkan!** (danger) |
| PAID → CHECK IN | staf `check_in` (endpoint hotel existing; hook di `hotel.act`) | notif **Check In Berhasil.** (success) |
| CHECK IN → CHECK OUT | staf `check_out` | notif **Check Out Berhasil.** (success); `can_review=true` |
| PAID → NO SHOW | staf `no_show` | tampil CANCELLED; notif **Tidak Hadir** (danger) |
| Modify guest | `PATCH …/guest` bila UNPAID/PAID | propagasi ke `hotel_reservations.guest_*` semua baris |

Hook ke modul `hotel`: setelah aksi `confirm/check_in/check_out/cancel/no_show` sukses, bila `bvrooms_booking_id` terisi → `bvrooms.OnReservationChanged(reservationID)` (in-process; job tabel `notification_outbox` untuk push).

---

## 5. Endpoint

Base `/api/v1/bvrooms`. Respons `{data}` / `{error:{code,message,fields}}` sesuai konvensi api. Endpoint publik wajib `organization_slug` (query) atau header `X-Org-Slug`. Tanggal `YYYY-MM-DD`; waktu ISO-8601 di zona `properties.timezone`.

### 5.1 App config & auth

| Method | Path | Body / Query | Respons & catatan |
|---|---|---|---|
| GET | `/app-config` | `organization_slug` | `{organization:{name, logo_url, primary_color, welcome_title, welcome_body}, features:{pay_at_property, online_payment:false, web_push}, single_property_slug?}` — untuk splash/welcome white-label; `single_property_slug` bila org hanya punya 1 properti listed |
| POST | `/auth/otp/request` | `{organization_slug, phone, purpose: login\|register\|change_phone}` | `{expires_in:100, resend_after:60, masked_phone, dev_code?}`; `login` → 404 `phone_not_registered`; `register` → 409 `phone_exists`; 429 `otp_rate_limited`. `dev_code` hanya `BV_ENV=dev` + provider `mock` |
| POST | `/auth/otp/verify` | `{organization_slug, phone, code, purpose, device_id}` | login: `{access_token, refresh_token, customer}`; register/change_phone: `{otp_token}` (5 menit). 401 `otp_invalid`, 410 `otp_expired`, 423 `otp_locked` |
| POST | `/auth/register` | `{organization_slug, otp_token, full_name, email}` | `{access_token, refresh_token, customer}` |
| POST | `/auth/refresh` | `{refresh_token}` | rotasi token |
| POST | `/auth/logout` | — | 204; revoke sesi + push subscription device |

JWT access 15 menit, refresh 30 hari, `iss=bvrooms`, `aud=bvrooms_customer`, claim `org`, `cid`, `sid`.

### 5.2 Katalog (publik, `Cache-Control: public, max-age=60`, ETag)

| Method | Path | Query | Respons (inti) |
|---|---|---|---|
| GET | `/catalog/properties` | `q`, `category=all\|hotel\|apartment`, `lat`,`lng`, `check_in`,`check_out`,`rooms`,`adults`,`children`, `sort=popular\|price_asc\|distance`, `cursor`,`limit` | `{items:[{id, slug, display_name, listing_category, city, address_short, cover_photo_url, rating_avg, rating_count, min_rate, has_promo, distance_km?, is_wishlisted?}], next_cursor}` — hanya `bvrooms_listed=true`; `min_rate` per tanggal/pax bila diberikan, else `min_rate_cache`; `q` mencocokkan nama/kota/alamat |
| GET | `/catalog/banners` | `property_id?` | banner aktif + promo `show_as_banner` aktif, terurut `sort_order` |
| GET | `/catalog/properties/{slug}` | `lat`,`lng` | `{…ringkasan, listing_category, terminology:{unit_label:"Kamar"\|"Unit"}, description_sections, facilities[], policies[], cancellation_policy_md, cancellation_rules, lat, lng, phone, whatsapp, check_in_time, check_out_time, photo_count, photos_preview[4], rating_summary{avg,count,label,hist[5]}, payment_options[]}` |
| GET | `/catalog/properties/{slug}/photos` | `category` | `{categories:[{key,label,count}], items:[{id,url,category,type_name,caption}]}` |
| GET | `/catalog/properties/{slug}/room-types` | `check_in`,`check_out`,`rooms`,`adults`,`children` (wajib) | `[{id, kind: room_type\|unit_type, name, size_m2, bedrooms?, max_adults, max_children, bed_type, amenities[], photo_url, rate_per_night, promo?{name, discount_amount}, nights, line_total, available_count, is_available, addons:[{id, kind, name, pricing_unit, price, max_qty}]}]` — hotel → `hotel_room_types`; apartemen → `bvrooms_unit_types` |
| GET | `/catalog/properties/{slug}/room-types/{id}/calendar` | `month=YYYY-MM` | `[{date, is_available, rate_per_night}]` |
| GET | `/catalog/properties/{slug}/reviews/summary` | — | `{avg, count, label, hist[5]}` |

Label rating (server): `count=0` → "No Review Yet"; `<2.5 Bad`; `2.5–3.9 Good`; `4.0–4.7 Very Good`; `≥4.8 Awesome`.

### 5.3 Booking (customer token)

| Method | Path | Body | Respons |
|---|---|---|---|
| POST | `/bookings` (Idempotency-Key) | `{property_id, check_in, check_out, guest:{full_name,email,phone}, rooms:[{type_id, kind, adults, children, addons:[{addon_id, qty}]}], payment:{method_code?}}` | 201 `{booking}`; 409 `room_unavailable {type_id, available_count}`; 422 `capacity_exceeded` / `addon_max_exceeded` / `invalid_dates` / `min_nights`; 423 `property_unlisted` |
| GET | `/bookings` | `scope=upcoming\|history`, `cursor` | `{items:[{booking_code, status, property{display_name, city, cover_photo_url}, check_in_at, check_out_at, guests_total, primary_action: pay\|direct\|rebook}], next_cursor}` |
| GET | `/bookings/{code}` | — | `{booking_code, status, payment_status, payment_deadline_at, property{…, lat, lng, phone, whatsapp, policies, cancellation_policy_md}, guest{}, rooms:[{type_name, qty, adults, children, addons:[{name, qty}]}], check_in_date, check_out_date, totals{room, addon, discount, total}, can_cancel, can_modify_guest, can_review, review?{stars, display_name}, payment?{provider_code, method_code, status, instructions, expires_at, proof_submitted_at}}` |
| PATCH | `/bookings/{code}/guest` | `{full_name, email, phone}` | `{booking}`; 409 `guest_locked` bila sudah check-in |
| POST | `/bookings/{code}/cancel` | `{reason?}` | `{booking}`; 409 `cannot_cancel` |
| POST | `/bookings/{code}/review` | `{stars}` | 201 `{review}`; 409 `already_reviewed` / `not_checked_out` |

### 5.4 Pembayaran (customer token) — provider-agnostic, fase hold

| Method | Path | Body | Respons |
|---|---|---|---|
| GET | `/payment-methods` | `property_id` | `[{provider_code, method_code, label, logo_url, group: transfer\|on_site\|virtual_account, enabled, coming_soon}]` — VA dikembalikan `enabled:false, coming_soon:true` agar UI menampilkan mockup (D2) |
| POST | `/bookings/{code}/payment` (Idempotency-Key) | `{provider_code:"manual", method_code:"transfer_bca"}` | `{payment:{status:"pending", amount, expires_at, instructions:{bank, account_number, account_name, note}, proof_upload_required:true}}`; 422 `method_disabled` untuk VA |
| POST | `/bookings/{code}/payment/change-method` | sama | payment lama `cancelled`, buat baru |
| POST | `/attachments/presign`, `/attachments/{id}/confirm` | pola `tenantapp` presign | untuk bukti transfer (jpg/png/pdf ≤ 5 MB) |
| POST | `/bookings/{code}/payment/proof` | `{asset_id}` | payment `proof_submitted`, deadline +24 jam, notif ke Finance (dashboard) |
| POST | `/webhooks/payments/{provider_code}` | payload gateway | HMAC via `billing.Provider.VerifyWebhook` — **404 sampai hold dicabut** |

### 5.5 Profil, wishlist, inbox, push

| Method | Path | Catatan |
|---|---|---|
| GET / PATCH | `/customers/me` | PATCH `{full_name, email}`; ganti HP: `{phone, otp_token}` dari `otp/verify purpose=change_phone` ke nomor baru |
| GET / POST / DELETE | `/customers/me/wishlist`, `…/wishlist/{property_id}` | GET dukung `q` |
| GET | `/customers/me/notifications` | `cursor`; `{items:[{id,type,title,body,severity,booking_code,created_at,read_at}], unread_count}` |
| POST | `/customers/me/notifications/{id}/read`, `…/read-all` | |
| DELETE | `/customers/me/notifications/{id}` | soft delete (geser kiri) |
| POST / DELETE | `/customers/me/push-subscriptions` | Web Push VAPID; implementasi bisa dipakai ulang Tenant PWA |

Tipe notifikasi: `booking_created`, `payment_received`, `payment_expired`, `booking_cancelled`, `checked_in`, `checked_out`, `no_show`, `review_reminder` (H+1 check-out bila belum review).

### 5.6 Dashboard (org, staf) — menu baru "BVRooms" di Hotel Management / Sewa Unit

| Method | Path | Permission | Fungsi |
|---|---|---|---|
| GET / PUT | `/bvrooms/admin/properties/{id}/listing` | `bvrooms.listing.manage` | Toggle listed, profil listing §3.2, rekening transfer, jendela bayar, aturan pembatalan, `allow_pay_at_property` |
| POST / PATCH / DELETE | `/bvrooms/admin/properties/{id}/photos` | `bvrooms.listing.manage` | galeri via `assets` presign |
| GET / POST / PATCH | `/bvrooms/admin/properties/{id}/addons` | `bvrooms.addons.manage` | package add-on (D5) |
| GET / POST / PATCH | `/bvrooms/admin/unit-types`, `PATCH /bvrooms/admin/units/{id}` (`rentable_daily`, `unit_type_id`) | `bvrooms.inventory.manage` | inventori apartemen (D4) |
| GET / POST / PATCH | `/bvrooms/admin/promotions`, `/bvrooms/admin/banners` | `bvrooms.marketing.manage` | diskon & banner (§10) |
| GET | `/bvrooms/admin/bookings` (filter status, payment_status, tanggal) | `hotel.reservations.view` | daftar booking BVRooms + booking_code + payment |
| POST | `/bvrooms/admin/payments/{id}/verify` · `…/reject` | `bvrooms.payments.verify` (Finance) | UNPAID → PAID / → EXPIRED |
| POST | `/bvrooms/admin/bookings/{id}/refund-done` | `bvrooms.payments.verify` | `refund_pending` → `refunded` |
| GET | `/bvrooms/admin/customers` · `POST …/{id}/block` | `bvrooms.customers.manage` | daftar & blokir customer |

Reservasi BVRooms tetap muncul di `GET /hotel/reservations` (source `bvrooms`) dan aksi front office existing berlaku.

---

## 6. Data referensi

- **Kode amenity** (`facilities[]`, `amenities[]`): `wifi, parking, ac, gym, spa, mini_fridge, card_payment, party_room, backyard, double_bed, king_bed, single_bed, queen_bed, smoking_allowed, no_smoking, restaurant, coffee_shop, pool, tv, seating_area, washing_machine, meeting_room, bathtub, small_stove, breakfast, kitchen, balcony, elevator, cctv`. Label ID/EN di client.
- **Kategori foto**: `facade, room, receptionist, lobby, restaurant, pool, other`.
- **Kode booking**: 12 karakter Crockford base32 (tanpa I/L/O/U), unik per org, generator server.
- **Terminologi per kategori**: hotel → Kamar/Tamu/Check-in; apartment → Unit/Penghuni/Check-in; override via `property_profiles.terminology`.
- **Add-on default** yang di-seed saat listing dibuat (nonaktif sampai diisi harga): `breakfast (per_guest_per_night)`, `extra_bed (per_item_per_night, max 3)`.

---

## 7. Non-fungsional

- **Keamanan**: OTP hash argon2id, rate limit per nomor & IP, kunci 15 menit setelah 5 gagal; JWT customer terpisah issuer/audience dari staf & tenant; endpoint publik hanya baca kolom listing; bukti transfer hanya bisa diakses customer pemilik & staf org.
- **Privasi**: customer hanya melihat booking miliknya; staf melihat data tamu pada reservasi (sudah ada); nomor HP customer tidak muncul di luar booking-nya.
- **Konsistensi inventori**: booking multi-kamar dalam satu transaksi dengan `SELECT … FOR UPDATE` pada tipe kamar/unit + exclusion constraint DB.
- **Performa**: katalog p95 < 300 ms (cache 60 s, `min_rate_cache` diperbarui job 10 menit dan saat rate berubah).
- **Zona waktu**: semua `*_at` yang tampil ke customer dalam `properties.timezone`.
- **Offline/empty state**: client-side; API cukup memberi ETag.
- **Observabilitas**: metrik `bvrooms_otp_sent`, `bvrooms_booking_created`, `bvrooms_payment_expired`, `bvrooms_proof_pending_age`.

---

## 8. Di luar backend (client-side / statis / mockup)

Splash & onboarding, toggle bahasa (i18n client), Ketentuan Layanan & Kebijakan Privasi (statis), rute peta (Google Maps `lat,lng`), label emoji rating, salin booking id / nomor rekening / nominal, offline & empty state, **layar VA (mockup, disabled)**, chip kota & tempat populer (dihapus).

---

## 9. Urutan pengerjaan

1. Migrasi §3 + listing profile + add-on + katalog publik (§5.2) + admin listing/addons (§5.6) — uji dengan seed properti demo (tambahkan properti hotel & apartemen demo di *Demo Seed Database*).
2. Auth OTP customer (§5.1) dengan `SMSProvider=mock`.
3. Booking multi-kamar + status engine + sweep + hook modul hotel + inbox (§3.4, §4, §5.3, §5.5).
4. Pembayaran fase hold: `manual` provider + bukti transfer + Verify/Reject di dashboard + `pay_at_property` (§5.4).
5. Review, wishlist, promo/banner, Web Push (bisa paralel dengan PWA).
6. Kontrak `openapi.yaml`, `status-map.yaml`, `npm run gen` di PWA; dokumentasi `docs/erd.md`.

---

## 10. Asumsi yang dipakai (koreksi bila keliru)

1. Satu deployment PWA BVRooms melayani satu org (`VITE_ORG_SLUG`), sama seperti Tenant PWA; org dengan banyak properti melihat daftar propertinya di Home, org dengan satu properti langsung ke Detail.
2. Apartemen di BVRooms = sewa **harian** unit (rate per malam) dengan mesin reservasi yang sama; sewa bulanan/kontrak tetap di modul Commercial/Tenant (di luar scope BVRooms).
3. Booking wajib login OTP; mode Guest hanya untuk melihat katalog.
4. Anak dihitung sebagai tamu untuk kapasitas `capacity_children` tipe kamar, tanpa aturan harga khusus.
5. Refund pembatalan diproses manual oleh Finance (konsisten dengan hold gateway); backend hanya mencatat `refund_pending → refunded`.

---

## 11. Status implementasi backend (16 Sep 2026)

Diimplementasikan di `buildingvision/api` (commit lokal, belum di-push):

| Bagian | Status | Catatan |
|---|---|---|
| §3 Skema | ✅ `db/migrations/00017_bvrooms.sql` | 17 tabel `bvrooms_*` + perluasan `hotel_reservations`, `hotel_rates`, `units`; RLS `org_isolation` |
| §5.1 App config & auth OTP | ✅ | `SMSProvider` mock (`dev_code` di env local/test); vendor SMS di-hold (D3). Token customer issuer `bvrooms` — ditolak middleware staf |
| §5.2 Katalog publik | ✅ | `organization_slug` wajib; `Cache-Control: public, max-age=60`; sort popular/price_asc/distance; "Start from" per tanggal |
| §5.3 Booking | ✅ | multi-kamar, lock per tipe + EXCLUDE DB, Idempotency-Key (UUID), status derivasi §4.1, modify guest, cancel, review |
| §5.4 Pembayaran fase hold | ✅ | `manual` transfer + bukti (presign/confirm) + Verify/Reject; `pay_at_property`; VA = mockup (`enabled:false, coming_soon:true`); webhook gateway **belum dibuka** (hold) |
| §5.5 Profil/wishlist/inbox/push | ✅ | Web Push VAPID aktif bila `BV_VAPID_PUBLIC_KEY`/`BV_VAPID_PRIVATE_KEY` diisi (`bvctl vapid-keygen`); `app-config.features.vapid_public_key` |
| §5.6 Dashboard | ✅ endpoint | `/bvrooms/admin/*` + permission `bvrooms.*`; halaman web dashboard belum dibuat |
| §4.2 Sweep & hook | ✅ | worker `bvrooms.sweep` (1 mnt); `hotel.RegisterReservationHook` untuk check-in/out/cancel/no-show dari Front Office |
| §9.6 Kontrak & seed | ✅ | `contracts/openapi/v1.yaml` (57 path), `status-map.yaml` (`bvrooms_booking_customer`, `bvrooms_payment`), `web npm run gen`; seed demo `bvctl seed --demo` / `--bvrooms-demo --slug graha-pangeran` |
| Test | ✅ | `TestBVRoomsHotelFlow`, `TestBVRoomsApartmentFlow` (integration, Postgres nyata) |

Belum: PWA BVRooms (repo ini), halaman dashboard web menu BVRooms, adapter vendor SMS & gateway VA (menunggu hold dicabut).

## 12. Status implementasi client PWA (17 Sep 2026)

Diimplementasikan di repo ini (`customer-booking-app`, React 19 + Vite + Tailwind v4, pola Tenant PWA), terhubung ke `/api/v1/bvrooms/*`:

| Artboard | Route | Status |
|---|---|---|
| SPLASH / LANDING / WELCOME | `/welcome` (splash → 2 slide → welcome; teks & nama dari `app-config`; Masuk / Daftar / Masuk Sebagai Guest) | ✅ |
| LOGIN - REGISTER | `/login` (nomor HP + PIN 4 digit), `/register` (nama, email, HP, buat PIN + konfirmasi) — mode PIN default (`features.auth_method`), akun lama PIN default `1234`; mode OTP: `/login/otp`, `/register/otp` (OTP 4 digit, countdown 1:39, Kirim Ulang, `dev_code` mock) | ✅ |
| HOME - LIST PROPERTY | `/home` (widget tanggal/kamar, search, chip Terdekat + properti org, banner, Jelajahi), `/catalog` (tab All/Apartement/Hotel, sort sheet, empty, offline) | ✅ |
| DETAIL PROPERTY | `/property/:slug` (galeri, ♥, share, Arahkan, tab anchor, deskripsi/amenities/policies + sheet, kategori kamar Terpilih/Pilih/Penuh, add-on Breakfast/Extra Bed dinamis, ratings, guest details, total) · `/property/:slug/photos` | ✅ |
| MAPS DIRECTION - BOOKING SETUP - EXTRA BEDS | Arahkan → Google Maps; `/search/dates` (kalender range), `/search/guests` (Tambah Room, tamu/anak/extra bed per kamar) | ✅ |
| BOOKING LOADING | `/booking/new` (Request → Berhasil / Gagal; Idempotency-Key) | ✅ |
| STATUS - PAYMENT | `/bookings/:code` (countdown, status, salin ID, Arahkan/Hubungi, policies, manage), `/bookings/:code/pay` (Transfer / Bayar di Tempat / VA "Segera hadir"), `/bookings/:code/payment` (rekening + salin, nominal + salin, unggah bukti, ganti metode) | ✅ |
| BOOKING SECTION | `/bookings` (Upcoming / History, Bayar / Arahkan / Booking Lagi) | ✅ |
| CANCEL BOOKING | `/bookings/:code/cancel` (kebijakan dari dashboard, dialog konfirmasi, toast) | ✅ |
| MODIFY DATA BOOKING | `/bookings/:code/guest` | ✅ |
| BERI RATING | `/bookings/:code/review` (bintang + emoji/label; tampil kembali di detail) | ✅ |
| SAVED SECTION | `/saved` (grid + search, toggle ♥ optimistic) | ✅ |
| INBOX SECTION | `/inbox` (geser kiri hapus, tandai dibaca, Web Push VAPID via `public/push-sw.js`) | ✅ |
| AKUN SECTION | `/account`, `/account/edit` (ganti HP → konfirmasi PIN; mode OTP → OTP `change_phone`), `/account/pin` (Ubah PIN), Log Out | ✅ |

Auth PIN (17 Sep 2026, D3 vendor SMS masih di-hold): backend `POST /bvrooms/auth/pin/login | pin/register | pin/change` (argon2id, 5 gagal → kunci 15 menit), kolom `bvrooms_customers.pin_hash` (NULL = PIN default `BV_BVROOMS_DEFAULT_PIN`, bawaan 1234), `PATCH customers/me` menerima `pin` untuk ganti nomor. Saklar `BV_BVROOMS_AUTH=pin|otp` → `app-config.features.auth_method`; client memilih alur tanpa rebuild.

Native: Capacitor 7 — `android/` (APK debug terbangun dengan JDK 21 portable `D:\tools\jdk-21`) dan `ios/` (build di Xcode/macOS). Lihat README.
