// Kerangka halaman mobile: TopBar (back + judul), Page (safe area), BottomNav Figma: Home | Booking | Saved | Inbox | Akun,
// StickyFooter (Total + Booking Sekarang).
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, Home, Mail, Tag, User, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/app/auth";
import { cn } from "@/lib/utils";

export function Page({ children, className, bottomNav = false, bg }: { children: ReactNode; className?: string; bottomNav?: boolean; bg?: string }) {
  return (
    <div className={cn("app-shell flex min-h-dvh flex-col", bg)}>
      <div className={cn("flex flex-1 flex-col", bottomNav && "pb-[calc(var(--safe-bottom)+64px)]", className)}>{children}</div>
      {bottomNav && <BottomNav />}
    </div>
  );
}

export function TopBar({
  title,
  onBack,
  right,
  className,
  transparent,
  center = false,
  close,
}: {
  title?: ReactNode;
  onBack?: (() => void) | false;
  right?: ReactNode;
  className?: string;
  transparent?: boolean;
  center?: boolean;
  /** ikon X (Figma sheet: Cancel Booking, Modify Guest Data, Beri Rating) */
  close?: boolean;
}) {
  const nav = useNavigate();
  const back = onBack === false ? null : (onBack ?? (() => nav(-1)));
  return (
    <header className={cn("pt-safe sticky top-0 z-30", !transparent && "border-b border-border bg-card", className)}>
      <div className="flex h-14 items-center px-2">
        {back ? (
          <button type="button" onClick={back} aria-label="Kembali" className="tap flex h-10 w-10 items-center justify-center rounded-full">
            {close ? <X size={22} strokeWidth={2.5} className="text-brand-500" /> : <ChevronLeft size={24} strokeWidth={2.5} className="text-brand-500" />}
          </button>
        ) : (
          <span className="w-10" />
        )}
        <div className={cn("flex-1 truncate text-[15px] font-bold", center ? "text-center" : "text-left")}>{title}</div>
        <div className="flex min-w-10 items-center justify-end gap-1 pr-1">{right}</div>
      </div>
    </header>
  );
}

/** Judul tab di tengah (Figma: "Booking", "Saved", "Inbox", "Akun"). */
export function TabTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="pt-safe sticky top-0 z-30 bg-card">
      <div className="flex h-12 items-center justify-center text-[15px] font-bold">{title}</div>
      {children}
    </header>
  );
}

export function StickyFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("sticky bottom-0 z-20 border-t border-border bg-card px-4 pb-[calc(var(--safe-bottom)+12px)] pt-3", className)}>{children}</div>;
}

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/bookings", label: "Booking", icon: Tag },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/inbox", label: "Inbox", icon: Mail },
  { to: "/account", label: "Akun", icon: User },
];

export function useUnread() {
  const { customer } = useAuth();
  return useQuery({ queryKey: ["unread"], queryFn: async () => (await api.notifications()).unread_count, enabled: !!customer, refetchInterval: 30_000 });
}

export function BottomNav() {
  const { data: unread } = useUnread();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-border bg-card pb-safe">
      <div className="grid h-[60px] grid-cols-5">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => cn("tap relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold", isActive ? "text-brand-500" : "text-neutral-400")}>
            {({ isActive }) => (
              <>
                <t.icon size={20} strokeWidth={isActive ? 2.4 : 2} fill={isActive && t.to !== "/account" ? "currentColor" : "none"} />
                {t.label}
                {t.to === "/inbox" && !!unread && <span className="absolute right-[calc(50%-18px)] top-2 h-2 w-2 rounded-full bg-danger" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** Tab bergaris bawah hijau (Figma: Upcoming/History, All/Apartement/Hotel). */
export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[]; className?: string }) {
  return (
    <div className={cn("flex border-b border-border", className)}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn("tap flex-1 border-b-2 pb-2 pt-3 text-[13px] font-semibold transition", value === it.value ? "border-brand-500 text-brand-500" : "border-transparent text-neutral-400")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
