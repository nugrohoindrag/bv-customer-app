// Klien API BVRooms (/api/v1/bvrooms/*). Endpoint publik mengirim organization_slug (org: true); endpoint customer
// memakai Bearer token (lib/http). Idempotency-Key UUID untuk POST bookings & payment.
import { http, ORG_SLUG, type ListResponse, type Query } from "@/lib/http";
import { deviceId, uuid } from "@/lib/utils";
import type {
  AppConfig,
  AuthResult,
  Banner,
  Booking,
  BookingCard,
  CalendarDay,
  CreateBookingInput,
  Customer,
  Inbox,
  OTPPurpose,
  OTPRequestResult,
  PaymentOption,
  PhotoGallery,
  PropertyCard,
  PropertyDetail,
  ProofPresignResult,
  RatingSummary,
  Review,
  TypeOffer,
} from "./types";

export interface CatalogQuery extends Query {
  q?: string;
  category?: "all" | "hotel" | "apartment";
  lat?: number;
  lng?: number;
  check_in?: string;
  check_out?: string;
  rooms?: number;
  adults?: number;
  children?: number;
  sort?: "popular" | "price_asc" | "distance";
  cursor?: string;
  limit?: number;
}

export interface StayQuery extends Query {
  check_in: string;
  check_out: string;
  rooms: number;
  adults: number;
  children: number;
}

export const api = {
  // ---- app config & auth ----
  appConfig: () => http<AppConfig>("app-config", { org: true, auth: false }),
  otpRequest: (phone: string, purpose: OTPPurpose) => http<OTPRequestResult>("auth/otp/request", { body: { organization_slug: ORG_SLUG, phone, purpose }, auth: false }),
  otpVerify: (phone: string, code: string, purpose: OTPPurpose) =>
    http<AuthResult>("auth/otp/verify", { body: { organization_slug: ORG_SLUG, phone, code, purpose, device_id: deviceId() }, auth: false }),
  register: (otp_token: string, full_name: string, email: string) =>
    http<AuthResult>("auth/register", { body: { organization_slug: ORG_SLUG, otp_token, full_name, email, device_id: deviceId() }, auth: false }),
  // PIN (vendor SMS di-hold): login/daftar tanpa OTP
  pinLogin: (phone: string, pin: string) => http<AuthResult>("auth/pin/login", { body: { organization_slug: ORG_SLUG, phone, pin, device_id: deviceId() }, auth: false }),
  pinRegister: (input: { phone: string; full_name: string; email: string; pin: string }) =>
    http<AuthResult>("auth/pin/register", { body: { organization_slug: ORG_SLUG, ...input, device_id: deviceId() }, auth: false }),
  pinChange: (current_pin: string, new_pin: string) => http<{ ok: boolean }>("auth/pin/change", { body: { current_pin, new_pin } }),
  logout: () => http<void>("auth/logout", { method: "POST", body: {} }),

  // ---- katalog (publik) ----
  properties: (q: CatalogQuery) => http<ListResponse<PropertyCard>>("catalog/properties", { query: q, org: true }),
  banners: (property_id?: string) => http<ListResponse<Banner>>("catalog/banners", { query: { property_id }, org: true }),
  property: (slug: string, geo?: { lat: number; lng: number }) => http<PropertyDetail>(`catalog/properties/${slug}`, { query: geo, org: true }),
  photos: (slug: string, category?: string) => http<PhotoGallery>(`catalog/properties/${slug}/photos`, { query: { category }, org: true }),
  roomTypes: (slug: string, stay: StayQuery) => http<ListResponse<TypeOffer>>(`catalog/properties/${slug}/room-types`, { query: stay, org: true }),
  calendar: (slug: string, typeId: string, month: string) => http<ListResponse<CalendarDay>>(`catalog/properties/${slug}/room-types/${typeId}/calendar`, { query: { month }, org: true }),
  reviewSummary: (slug: string) => http<RatingSummary>(`catalog/properties/${slug}/reviews/summary`, { org: true }),

  // ---- customer ----
  me: () => http<Customer>("customers/me"),
  updateMe: (input: { full_name?: string; email?: string; phone?: string; otp_token?: string; pin?: string; locale?: string }) => http<Customer>("customers/me", { method: "PATCH", body: input }),
  wishlist: (q?: string) => http<ListResponse<PropertyCard>>("customers/me/wishlist", { query: { q } }),
  addWishlist: (property_id: string) => http<{ property_id: string; is_wishlisted: boolean }>("customers/me/wishlist", { body: { property_id } }),
  removeWishlist: (property_id: string) => http<void>(`customers/me/wishlist/${property_id}`, { method: "DELETE" }),
  notifications: (cursor?: string) => http<Inbox>("customers/me/notifications", { query: { cursor } }),
  readNotification: (id: string) => http<void>(`customers/me/notifications/${id}/read`, { method: "POST", body: {} }),
  readAllNotifications: () => http<void>("customers/me/notifications/read-all", { method: "POST", body: {} }),
  deleteNotification: (id: string) => http<void>(`customers/me/notifications/${id}`, { method: "DELETE" }),
  subscribePush: (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) => http<void>("customers/me/push-subscriptions", { body: sub }),
  unsubscribePush: (endpoint: string) => http<void>("customers/me/push-subscriptions", { method: "DELETE", query: { endpoint } }),

  // ---- booking & pembayaran ----
  paymentMethods: (property_id: string) => http<ListResponse<PaymentOption>>("payment-methods", { query: { property_id } }),
  bookings: (scope: "upcoming" | "history", cursor?: string) => http<ListResponse<BookingCard>>("bookings", { query: { scope, cursor } }),
  createBooking: (input: CreateBookingInput, idempotencyKey = uuid()) => http<Booking>("bookings", { body: input, idempotencyKey }),
  booking: (code: string) => http<Booking>(`bookings/${code}`),
  modifyGuest: (code: string, guest: { full_name: string; email: string; phone: string }) => http<Booking>(`bookings/${code}/guest`, { method: "PATCH", body: guest }),
  cancelBooking: (code: string, reason?: string) => http<Booking>(`bookings/${code}/cancel`, { body: { reason: reason ?? "" } }),
  review: (code: string, stars: number) => http<Review>(`bookings/${code}/review`, { body: { stars } }),
  createPayment: (code: string, provider_code: string, method_code: string, change = false) =>
    http<Booking>(`bookings/${code}/payment${change ? "/change-method" : ""}`, { body: { provider_code, method_code }, idempotencyKey: uuid() }),
  proofPresign: (code: string, content_type: string, size_bytes: number) => http<ProofPresignResult>(`bookings/${code}/payment/proof/presign`, { body: { content_type, size_bytes } }),
  proofConfirm: (code: string) => http<Booking>(`bookings/${code}/payment/proof`, { method: "POST", body: {} }),
};

/** Unggah bukti transfer: presign → PUT ke storage → confirm. */
export async function uploadProof(code: string, file: Blob): Promise<Booking> {
  const pre = await api.proofPresign(code, file.type || "image/jpeg", file.size);
  const res = await fetch(pre.upload_url, { method: pre.method || "PUT", headers: { "Content-Type": file.type || "image/jpeg", ...(pre.headers ?? {}) }, body: file });
  if (!res.ok) throw new Error("Gagal mengunggah bukti transfer (" + res.status + ")");
  return api.proofConfirm(code);
}
