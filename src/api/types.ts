// Tipe respons backend BVRooms (buildingvision/api/internal/bvrooms — struct dengan tag JSON). Selaraskan bila backend berubah.

export interface AppConfig {
  organization: { id: string; slug: string; name: string; logo_url: string | null; primary_color: string | null; welcome_title: string; welcome_body: string };
  features: { pay_at_property: boolean; online_payment: boolean; web_push: boolean; vapid_public_key?: string; otp_provider: string; auth_method?: "pin" | "otp" };
  listed_count: number;
  single_property_slug: string | null;
  default_category: string;
}

export type OTPPurpose = "login" | "register" | "change_phone";

export interface OTPRequestResult {
  expires_in: number;
  resend_after: number;
  masked_phone: string;
  provider: string;
  dev_code?: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  status: "active" | "blocked";
  locale: string;
  created_at: string;
  last_login_at: string | null;
}

export interface AuthResult {
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  token_type?: string;
  customer?: Customer;
  otp_token?: string;
  pin_is_default?: boolean; // login PIN: akun masih memakai PIN default → ajak ganti PIN
}

export type ListingCategory = "hotel" | "apartment";

export interface PropertyCard {
  id: string;
  slug: string;
  display_name: string;
  listing_category: ListingCategory;
  city: string | null;
  address_short: string;
  cover_photo_url: string | null;
  rating_avg: number;
  rating_count: number;
  rating_label: string;
  min_rate: number | null;
  has_promo: boolean;
  distance_km?: number;
  is_wishlisted?: boolean;
  lat: number | null;
  lng: number | null;
}

export interface DescriptionSection {
  key: string;
  title: string;
  body: string;
}

export interface RatingSummary {
  avg: number;
  count: number;
  label: string;
  hist: number[]; // index 0 = 1★ … 4 = 5★
}

export interface PhotoItem {
  id: string;
  url: string;
  category: string;
  type_name: string | null;
  caption: string | null;
  is_cover: boolean;
}

export interface PhotoCategory {
  key: string;
  label: string;
  count: number;
}

export interface PhotoGallery {
  categories: PhotoCategory[];
  items: PhotoItem[];
}

export interface PaymentOption {
  provider_code: string;
  method_code: string;
  label: string;
  group: "transfer" | "on_site" | "virtual_account";
  logo_url: string | null;
  enabled: boolean;
  coming_soon: boolean;
}

export interface AddonOffer {
  id: string;
  kind: "breakfast" | "extra_bed" | "other";
  name: string;
  pricing_unit: "per_guest_per_night" | "per_item_per_night" | "per_booking";
  price: number;
  max_qty: number;
}

export interface PromoInfo {
  id: string;
  name: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  discount_amount: number;
}

export interface TypeOffer {
  id: string;
  kind: "room_type" | "unit_type";
  name: string;
  description: string | null;
  size_m2: number | null;
  bedrooms?: number;
  max_adults: number;
  max_children: number;
  bed_type: string | null;
  amenities: string[];
  photo_url: string | null;
  rate_per_night: number;
  nights: number;
  line_total: number;
  promo: PromoInfo | null;
  total_units: number;
  available_count: number;
  is_available: boolean;
  addons: AddonOffer[];
}

export interface PropertyDetail extends PropertyCard {
  tagline: string | null;
  terminology: Record<string, string>;
  address_line: string | null;
  district: string | null;
  phone: string | null;
  whatsapp: string | null;
  check_in_time: string;
  check_out_time: string;
  timezone: string;
  description_sections: DescriptionSection[];
  facilities: string[];
  policies: string[];
  cancellation_policy_md: string | null;
  cancellation_rules: { free_until_hours_before_checkin?: number; fee_pct_after?: number } | null;
  payment_window_hours: number;
  photo_count: number;
  photos_preview: PhotoItem[];
  rating_summary: RatingSummary;
  payment_options: PaymentOption[];
  room_types_preview: TypeOffer[];
}

export interface CalendarDay {
  date: string;
  is_available: boolean;
  rate_per_night: number;
}

export interface Banner {
  id: string;
  kind: "banner" | "promotion";
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  deep_link: string | null;
}

export type BookingStatus = "UNPAID" | "PAID" | "CHECK IN" | "CHECK OUT" | "CANCELLED" | "EXPIRED";
export type PaymentStatus = "unpaid" | "paid" | "expired" | "refund_pending" | "refunded" | "pay_at_property";
export type PrimaryAction = "pay" | "direct" | "rebook" | "none";

export interface BookingRoomAddon {
  id: string;
  addon_id: string | null;
  name: string;
  kind: string;
  pricing_unit: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface BookingRoom {
  id: string;
  reservation_id: string;
  reservation_number: string;
  type_id: string;
  kind: "room_type" | "unit_type";
  type_name: string;
  adults: number;
  children: number;
  rate_per_night: number;
  nights: number;
  discount_amount: number;
  line_total: number;
  reservation_status: string;
  assigned_number: string | null;
  addons: BookingRoomAddon[];
}

export interface BookingProperty {
  id: string;
  slug: string;
  display_name: string;
  listing_category: ListingCategory;
  city: string | null;
  address_line: string | null;
  cover_photo_url: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  policies: string[];
  cancellation_policy_md: string | null;
  timezone: string;
}

export interface PaymentInstructions {
  bank?: string;
  account_number?: string;
  account_name?: string;
  amount?: number;
  note?: string;
}

export interface Payment {
  id: string;
  provider_code: string;
  method_code: string;
  amount: number;
  status: "pending" | "proof_submitted" | "paid" | "expired" | "failed" | "cancelled";
  instructions: PaymentInstructions | null;
  va_number: string | null;
  expires_at: string | null;
  proof_upload_required: boolean;
  proof_submitted_at: string | null;
  proof_url?: string;
  paid_at: string | null;
  verified_at: string | null;
  note: string | null;
  created_at: string;
}

export interface Review {
  stars: number;
  display_name: string;
  created_at: string;
}

export interface Guest {
  full_name: string;
  email: string;
  phone: string;
}

export interface BookingTotals {
  room: number;
  addon: number;
  discount: number;
  total: number;
}

export interface Booking {
  id: string;
  booking_code: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_deadline_at: string | null;
  property: BookingProperty;
  guest: Guest;
  check_in_date: string;
  check_out_date: string;
  check_in_at: string;
  check_out_at: string;
  nights: number;
  rooms_count: number;
  guests_total: number;
  rooms: BookingRoom[];
  totals: BookingTotals;
  currency_code: string;
  primary_action: PrimaryAction;
  can_cancel: boolean;
  can_modify_guest: boolean;
  can_review: boolean;
  review: Review | null;
  payment: Payment | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  cancelled_by: string | null;
  created_at: string;
  version: number;
}

export interface BookingCard {
  id: string;
  booking_code: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  property: { slug: string; display_name: string; city: string | null; cover_photo_url: string | null; lat: number | null; lng: number | null };
  check_in_at: string;
  check_out_at: string;
  guests_total: number;
  rooms_count: number;
  total_amount: number;
  primary_action: PrimaryAction;
  payment_deadline_at: string | null;
  created_at: string;
}

export interface CreateBookingInput {
  property_id: string;
  check_in: string;
  check_out: string;
  guest: Guest;
  rooms: { type_id: string; kind: "room_type" | "unit_type"; adults: number; children: number; addons: { addon_id: string; qty: number }[] }[];
  payment?: { method_code: string };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  severity: "success" | "danger" | "info";
  booking_code: string | null;
  created_at: string;
  read_at: string | null;
}

export interface Inbox {
  data: Notification[];
  next_cursor: string | null;
  unread_count: number;
}

export interface ProofPresignResult {
  payment_id: string;
  upload_url: string;
  method: string;
  headers: Record<string, string>;
  expires_at: string;
}
