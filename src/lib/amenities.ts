// Kode amenity (§6 requirements) → label ID + ikon lucide.
import {
  AirVent,
  Bath,
  Bed,
  BedDouble,
  BedSingle,
  Building2,
  Car,
  Cigarette,
  CigaretteOff,
  Coffee,
  CreditCard,
  Croissant,
  Dumbbell,
  Flower2,
  Landmark,
  Microwave,
  Presentation,
  Refrigerator,
  Sofa,
  Trees,
  Tv,
  UtensilsCrossed,
  Video,
  WashingMachine,
  Waves,
  Wifi,
  Wind,
  type LucideIcon,
} from "lucide-react";

export interface Amenity {
  id: string;
  en: string;
  icon: LucideIcon;
}

export const AMENITIES: Record<string, Amenity> = {
  wifi: { id: "Wifi Gratis", en: "Free Wifi", icon: Wifi },
  parking: { id: "Fasilitas Parkir", en: "Parking", icon: Car },
  ac: { id: "AC", en: "Air Conditioner", icon: AirVent },
  gym: { id: "Gym", en: "Gym", icon: Dumbbell },
  spa: { id: "SPA", en: "SPA", icon: Flower2 },
  mini_fridge: { id: "Kulkas Kecil", en: "Mini Fridge", icon: Refrigerator },
  card_payment: { id: "Pembayaran Kartu", en: "Card Payment", icon: CreditCard },
  party_room: { id: "Ruang Pesta", en: "Party Room", icon: Landmark },
  backyard: { id: "Kebun Belakang", en: "Backyard", icon: Trees },
  double_bed: { id: "Double Bed", en: "Double Bed", icon: BedDouble },
  king_bed: { id: "King Sized Bed", en: "King Sized Bed", icon: BedDouble },
  single_bed: { id: "Single Bed", en: "Single Bed", icon: BedSingle },
  queen_bed: { id: "Queen Sized Bed", en: "Queen Sized Bed", icon: Bed },
  smoking_allowed: { id: "Smoking Allowed", en: "Smoking Allowed", icon: Cigarette },
  no_smoking: { id: "No Smoking", en: "No Smoking", icon: CigaretteOff },
  restaurant: { id: "Restaurant", en: "Restaurant", icon: UtensilsCrossed },
  coffee_shop: { id: "Coffee Shop", en: "Coffee Shop", icon: Coffee },
  pool: { id: "Swimming Pool", en: "Swimming Pool", icon: Waves },
  tv: { id: "TV", en: "TV", icon: Tv },
  seating_area: { id: "Area Tempat Duduk", en: "Seating Area", icon: Sofa },
  washing_machine: { id: "Mesin Cuci Otomatis", en: "Washing Machine", icon: WashingMachine },
  meeting_room: { id: "Ruang Meeting", en: "Meeting Room", icon: Presentation },
  bathtub: { id: "Bathtub", en: "Bathtub", icon: Bath },
  small_stove: { id: "Kompor Kecil", en: "Small Stove", icon: Microwave },
  breakfast: { id: "Sarapan", en: "Breakfast", icon: Croissant },
  kitchen: { id: "Dapur", en: "Kitchen", icon: Microwave },
  balcony: { id: "Balkon", en: "Balcony", icon: Wind },
  elevator: { id: "Lift", en: "Elevator", icon: Building2 },
  cctv: { id: "CCTV", en: "CCTV", icon: Video },
};

export function amenity(code: string): Amenity {
  return AMENITIES[code] ?? { id: code.replace(/_/g, " "), en: code.replace(/_/g, " "), icon: Building2 };
}

export const BED_LABEL: Record<string, string> = { single: "Single Bed", double: "Double Bed", queen: "Queen Bed", king: "King Bed", twin: "Twin Bed" };
