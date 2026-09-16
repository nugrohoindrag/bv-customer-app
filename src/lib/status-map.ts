// GENERATED — jangan edit manual. Sumber: buildingvision/contracts/status-map.yaml. Jalankan `npm run gen`.
export type Semantic = "success" | "warning" | "critical" | "info" | "neutral";
export type Variant = "solid" | "soft" | "outline";
export interface StatusDef { label_id: string; label_en: string; semantic: Semantic; variant: Variant; icon?: string }
export type ObjectType = "bvrooms_booking_customer" | "bvrooms_payment";
export const statusMap: Record<ObjectType, Record<string, StatusDef>> = {
  "bvrooms_booking_customer": {
    "UNPAID": {
      "label_id": "Belum Dibayar",
      "label_en": "Unpaid",
      "semantic": "critical",
      "variant": "solid"
    },
    "PAID": {
      "label_id": "Sudah Dibayar",
      "label_en": "Paid",
      "semantic": "success",
      "variant": "solid"
    },
    "CHECK IN": {
      "label_id": "Check In",
      "label_en": "Checked In",
      "semantic": "warning",
      "variant": "solid"
    },
    "CHECK OUT": {
      "label_id": "Check Out",
      "label_en": "Checked Out",
      "semantic": "neutral",
      "variant": "solid"
    },
    "CANCELLED": {
      "label_id": "Dibatalkan",
      "label_en": "Cancelled",
      "semantic": "neutral",
      "variant": "solid"
    },
    "EXPIRED": {
      "label_id": "Hangus",
      "label_en": "Expired",
      "semantic": "neutral",
      "variant": "outline"
    }
  },
  "bvrooms_payment": {
    "pending": {
      "label_id": "Menunggu Pembayaran",
      "label_en": "Pending",
      "semantic": "warning",
      "variant": "soft"
    },
    "proof_submitted": {
      "label_id": "Bukti Diverifikasi",
      "label_en": "Proof Submitted",
      "semantic": "info",
      "variant": "soft"
    },
    "paid": {
      "label_id": "Lunas",
      "label_en": "Paid",
      "semantic": "success",
      "variant": "soft"
    },
    "expired": {
      "label_id": "Kedaluwarsa",
      "label_en": "Expired",
      "semantic": "neutral",
      "variant": "outline"
    },
    "failed": {
      "label_id": "Ditolak",
      "label_en": "Rejected",
      "semantic": "critical",
      "variant": "soft"
    },
    "cancelled": {
      "label_id": "Dibatalkan",
      "label_en": "Cancelled",
      "semantic": "neutral",
      "variant": "outline"
    }
  }
} as const;
export function statusDef(objectType: ObjectType, status: string): StatusDef | undefined {
  return statusMap[objectType]?.[status];
}
