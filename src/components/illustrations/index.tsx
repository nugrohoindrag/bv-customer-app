// Ilustrasi inline SVG (ringan, tanpa aset eksternal) mengikuti komposisi Figma: logo kotak hijau, orang di kotak berwarna
// (onboarding), peta dunia dengan pin (welcome), telepon-centang (login), ponsel-gembok (OTP), menara tanpa sinyal (offline), UFO (kosong).
import { useAppConfig } from "@/app/app-config";
import { cn } from "@/lib/utils";

/** Mark BuildingVision (default bila org belum mengunggah logo) — geometri sama dengan buildingvision/design-tokens/logo. */
export function LogoMark({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="112" fill="#0442B9" />
      <g transform="translate(72 126) scale(1.017)">
        <path d="M6 130H62 M302 130H356 M62 130C110 -35 254 -35 302 130 M62 130C110 6 254 6 302 130 M62 130C110 46 254 46 302 130 M62 130C110 86 254 86 302 130 M62 130C110 295 254 295 302 130 M62 130C110 254 254 254 302 130 M62 130C110 214 254 214 302 130 M62 130C110 174 254 174 302 130" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Logo org (white-label) atau logo BVRooms. */
export function BrandLogo({ size = 96, className }: { size?: number; className?: string }) {
  const { config } = useAppConfig();
  const url = config.organization.logo_url;
  if (url) return <img src={url} alt={config.organization.name} width={size} height={size} className={cn("rounded-[22%] object-cover", className)} style={{ width: size, height: size }} />;
  return <LogoMark size={size} className={className} />;
}

export function Wordmark({ className }: { className?: string }) {
  const { brandName } = useAppConfig();
  return <div className={cn("text-[22px] font-extrabold tracking-tight text-brand-500", className)}>{brandName.toLowerCase().replace(/\s+/g, "")}<sup className="ml-0.5 text-[9px]">®</sup></div>;
}

/** Orang di kotak berwarna (Figma onboarding). variant 1 = oranye/pria, 2 = kuning/wanita. */
export function PersonArt({ variant = 1, className }: { variant?: 1 | 2; className?: string }) {
  const bg = variant === 1 ? "#E9795A" : "#F6B94B";
  const skin = "#F5C7A8";
  const hair = variant === 1 ? "#1F2937" : "#2B2E4A";
  const shirt = variant === 1 ? "#1F2A44" : "#FFFFFF";
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden>
      <rect x="20" y="0" width="160" height="200" fill={bg} />
      {variant === 1 ? (
        <>
          <ellipse cx="100" cy="72" rx="34" ry="40" fill={skin} />
          <path d="M62 70c0-30 18-50 40-50s42 18 40 50c-8-16-24-20-40-18-16-2-32 2-40 18z" fill={hair} />
          <path d="M40 200c0-45 27-70 60-70s60 25 60 70z" fill={shirt} />
          <path d="M40 200l-30 8h180l-30-8z" fill={skin} />
          <circle cx="88" cy="76" r="3" fill="#333" />
          <circle cx="112" cy="76" r="3" fill="#333" />
          <path d="M90 92q10 8 20 0" stroke="#c0392b" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M55 150c-10-60 0-100 45-100s55 40 45 100z" fill={hair} />
          <ellipse cx="100" cy="82" rx="30" ry="36" fill={skin} />
          <path d="M70 68c10-22 50-22 60 0-12-6-48-6-60 0z" fill={hair} />
          <path d="M45 200c0-40 25-60 55-60s55 20 55 60z" fill={shirt} />
          <path d="M45 200l-30 8h180l-30-8z" fill={skin} />
          <circle cx="90" cy="84" r="3" fill="#333" />
          <circle cx="112" cy="84" r="3" fill="#333" />
          <path d="M92 100q8 6 16 0" stroke="#c0392b" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="128" y="120" width="18" height="26" rx="3" fill="#fff" stroke="#ddd" />
        </>
      )}
      <rect x="0" y="200" width="200" height="8" fill="#1F2A44" />
    </svg>
  );
}

/** Peta dunia abu muda dengan pin brand & avatar (Figma welcome). */
export function WorldMapArt({ className }: { className?: string }) {
  const pins = [
    [70, 70],
    [230, 60],
    [150, 120],
    [95, 160],
  ];
  const users = [
    [175, 40],
    [135, 80],
    [235, 125],
    [260, 175],
  ];
  return (
    <svg viewBox="0 0 320 220" className={className} aria-hidden>
      <g fill="#E5E9F0">
        <path d="M20 60c20-25 60-30 80-20 15 8 10 30 25 35s30-15 45-5c10 8 5 25 20 30s35-10 50 0 10 25 25 30 35 0 45 15-5 35-25 40-45-5-60 10-30 25-55 20-30-25-50-20-40 15-60 5-30-35-25-55 10-30 0-45-30-35-15-40z" />
        <path d="M225 40c15-10 40-8 55 5s20 35 5 45-45 0-60-10-15-30 0-40z" />
        <path d="M245 165c10-8 30-8 40 2s10 25-2 32-32 3-40-7-8-20 2-27z" />
      </g>
      {pins.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect x="-14" y="-14" width="28" height="28" rx="7" fill="var(--bvr-brand-500)" />
          <path d="M-5 -8v14" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="1" cy="2" r="5" fill="none" stroke="#fff" strokeWidth="3.5" />
          <path d="M0 14l-5 -4h10z" fill="var(--bvr-brand-500)" />
        </g>
      ))}
      {users.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r="12" fill="#fff" stroke="#D5DBE5" strokeWidth="2" />
          <circle cy="-3" r="4" fill="#C9D1DE" />
          <path d="M-7 8c1-6 13-6 14 0" fill="#C9D1DE" />
        </g>
      ))}
    </svg>
  );
}

/** Telepon + centang di kotak hijau muda (Figma login/register). */
export function PhoneCheckArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" className={className} aria-hidden>
      <rect x="0" y="12" width="48" height="40" rx="6" fill="var(--bvr-brand-200)" />
      <path d="M12 26c2 8 10 16 18 18l4-5-6-4-3 2c-3-2-6-5-8-8l2-3-4-6z" fill="#1F2A44" />
      <path d="M40 34c-4-2-6-4-9-8" stroke="#1F2A44" strokeWidth="2" strokeDasharray="3 3" fill="none" />
      <circle cx="46" cy="14" r="12" fill="var(--bvr-brand-500)" />
      <path d="M40 14l4 4 8-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M52 4l4 2-1 5" fill="none" stroke="#1F2A44" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Ponsel + gembok (Figma OTP). */
export function PhoneLockArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 60" className={className} aria-hidden>
      <rect x="18" y="0" width="30" height="52" rx="5" fill="#1F2A44" />
      <rect x="21" y="5" width="24" height="40" rx="2" fill="#8EDBFF" />
      <rect x="0" y="18" width="14" height="4" rx="2" fill="#1F2A44" />
      <rect x="0" y="27" width="14" height="4" rx="2" fill="#1F2A44" />
      <rect x="0" y="36" width="14" height="4" rx="2" fill="#1F2A44" />
      <rect x="26" y="24" width="14" height="12" rx="2" fill="#1F2A44" />
      <path d="M29 24v-4a4 4 0 018 0v4" fill="none" stroke="#1F2A44" strokeWidth="2.5" />
      <circle cx="33" cy="30" r="1.8" fill="#8EDBFF" />
      <rect x="44" y="40" width="20" height="20" rx="4" fill="var(--bvr-brand-200)" />
    </svg>
  );
}

/** Menara sinyal dengan awan & petir (Figma offline). */
export function NoInternetArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <path d="M40 60c-14 0-22-10-18-22 3-9 14-13 22-9 4-12 22-14 28-4 10-6 22 0 22 12s-8 22-20 22z" fill="none" stroke="#3B4C77" strokeWidth="2.5" />
      <path d="M150 50c-12 0-20-8-17-19 3-8 13-12 20-8 4-10 20-12 25-3 9-5 20 0 20 10s-7 20-18 20z" fill="none" stroke="#3B4C77" strokeWidth="2.5" />
      <path d="M62 68l-8 14h10l-6 14" fill="none" stroke="#5B8DEF" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M172 60l-8 14h10l-6 14" fill="none" stroke="#5B8DEF" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M120 40l-24 100h48z" fill="none" stroke="#3B4C77" strokeWidth="2.5" />
      <path d="M104 100h32M110 75h20M100 120h40" stroke="#3B4C77" strokeWidth="2" />
      <path d="M120 40v-12" stroke="#3B4C77" strokeWidth="2.5" />
      <path d="M100 28q20-14 40 0M106 18q14-9 28 0" fill="none" stroke="#5B8DEF" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 4" />
      <path d="M10 140h220" stroke="#D9DEE8" strokeWidth="2" />
      <g fill="#DDE3EE">
        <path d="M20 140l6-18 6 18z" />
        <path d="M40 140l5-14 5 14z" />
        <path d="M200 140l6-18 6 18z" />
        <path d="M218 140l5-14 5 14z" />
      </g>
    </svg>
  );
}

/** UFO menculik ilustrasi (Figma "Property tidak ditemukan"). */
export function NotFoundArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 170" className={className} aria-hidden>
      <path d="M10 160h220" stroke="#D9DEE8" strokeWidth="2" />
      <ellipse cx="140" cy="46" rx="48" ry="14" fill="none" stroke="#3B4C77" strokeWidth="2.5" />
      <path d="M110 40c6-16 54-16 60 0" fill="none" stroke="#3B4C77" strokeWidth="2.5" />
      <path d="M118 58l-24 100h92l-24-100z" fill="#F4D03F" opacity=".35" />
      <circle cx="125" cy="47" r="2.5" fill="#5B8DEF" />
      <circle cx="140" cy="49" r="2.5" fill="#5B8DEF" />
      <circle cx="155" cy="47" r="2.5" fill="#5B8DEF" />
      <g stroke="#3B4C77" strokeWidth="2.5" fill="none">
        <circle cx="140" cy="100" r="10" />
        <path d="M140 110v22M130 122h20M140 132l-8 16M140 132l8 16" strokeLinecap="round" />
      </g>
      <g fill="none" stroke="#3B4C77" strokeWidth="2">
        <rect x="24" y="110" width="30" height="50" />
        <rect x="30" y="118" width="6" height="8" />
        <rect x="42" y="118" width="6" height="8" />
        <rect x="30" y="134" width="6" height="8" />
        <rect x="42" y="134" width="6" height="8" />
        <rect x="190" y="120" width="34" height="40" />
        <rect x="196" y="128" width="6" height="8" />
        <rect x="210" y="128" width="6" height="8" />
      </g>
    </svg>
  );
}

/** Lingkaran status besar Figma (Request Booking kuning/kaca pembesar, Berhasil hijau/centang, Gagal merah/silang). */
export function StatusCircle({ kind, className }: { kind: "loading" | "success" | "error"; className?: string }) {
  const color = kind === "loading" ? "#F4D03F" : kind === "success" ? "#3DCB3F" : "#E74C3C";
  return (
    <div className={cn("relative flex h-40 w-40 items-center justify-center", className)} style={{ color }}>
      <div className={cn("absolute inset-0 rounded-full opacity-15", kind === "loading" && "ring-pulse")} style={{ background: color }} />
      <div className="relative flex h-28 w-28 items-center justify-center rounded-full" style={{ background: color }}>
        {kind === "loading" && (
          <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" className="animate-[spin_3s_linear_infinite]">
            <circle cx="11" cy="11" r="6" />
            <path d="M16 16l4 4" />
          </svg>
        )}
        {kind === "success" && (
          <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        )}
        {kind === "error" && (
          <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        )}
      </div>
    </div>
  );
}

/** Placeholder foto properti/kamar bila belum ada asset (seed demo tanpa foto). */
export function PhotoPlaceholder({ className, kind = "hotel" }: { className?: string; kind?: "hotel" | "apartment" | "room" }) {
  return (
    <div className={cn("flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200", className)}>
      <svg viewBox="0 0 120 80" className="h-2/3 w-2/3 opacity-60" aria-hidden>
        {kind === "room" ? (
          <g fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinejoin="round">
            <rect x="14" y="36" width="92" height="28" rx="4" />
            <path d="M22 36V22h76v14M30 36v-8h24v8M66 36v-8h24v8M14 64v10M106 64v10" />
          </g>
        ) : kind === "apartment" ? (
          <g fill="none" stroke="#6B7280" strokeWidth="2.5">
            <rect x="30" y="10" width="60" height="64" rx="3" />
            <path d="M42 22h8v8h-8zM56 22h8v8h-8zM70 22h8v8h-8zM42 38h8v8h-8zM56 38h8v8h-8zM70 38h8v8h-8zM54 60h12v14H54z" />
          </g>
        ) : (
          <g fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinejoin="round">
            <path d="M20 74V30l40-18 40 18v44" />
            <path d="M36 74V50h16v24M68 50h16v10H68zM10 74h100" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function Photo({ src, alt = "", className, kind }: { src: string | null | undefined; alt?: string; className?: string; kind?: "hotel" | "apartment" | "room" }) {
  if (!src) return <PhotoPlaceholder className={className} kind={kind} />;
  return <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
