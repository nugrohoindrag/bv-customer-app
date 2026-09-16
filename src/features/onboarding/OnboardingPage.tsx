// Figma SPLASH SCREEN - LANDING PAGE - WELCOME PAGE: splash (logo) → 2 slide (Lewati / Lanjut) → welcome
// (peta, judul & teks dari app-config, Masuk / Daftar, syarat, Masuk Sebagai Guest, toggle bahasa ID).
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAppConfig } from "@/app/app-config";
import { useAuth } from "@/app/auth";
import { BrandLogo, PersonArt, WorldMapArt, Wordmark } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SLIDES = [
  { title: "Aman & Nyaman", body: "Semua keamanan dan kenyamanan property terjamin, karena itu adalah komitmen kami", variant: 1 as const },
  { title: "Dimanapun & Kapanpun", body: "Mendapatkan penginapan yang kamu inginkan sekarang juga? Pilihanmu tepat, let's go!", variant: 2 as const },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<number>(-1); // -1 splash, 0..1 slide, 2 welcome
  useEffect(() => {
    const t = setTimeout(() => setStep(0), 1200);
    return () => clearTimeout(t);
  }, []);

  if (step < 0) {
    return (
      <div className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4">
        <BrandLogo size={110} />
        <Wordmark />
      </div>
    );
  }
  if (step < SLIDES.length) return <Slide index={step} onNext={() => setStep(step + 1)} onSkip={() => setStep(SLIDES.length)} />;
  return <Welcome />;
}

function Slide({ index, onNext, onSkip }: { index: number; onNext: () => void; onSkip: () => void }) {
  const s = SLIDES[index]!;
  return (
    <div className="app-shell flex min-h-dvh flex-col px-6 pb-[calc(var(--safe-bottom)+20px)] pt-safe">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <PersonArt variant={s.variant} className="fade-up h-56 w-48" key={index} />
        <h1 className="mt-8 text-[17px] font-extrabold">{s.title}</h1>
        <p className="mt-3 max-w-[260px] text-[12px] leading-5 text-neutral-500">{s.body}</p>
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onSkip} className={cn("text-[11px] text-neutral-400", index === SLIDES.length - 1 && "invisible")}>
          Lewati
        </button>
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-neutral-300" : "w-1.5 bg-neutral-200")} />
          ))}
        </div>
        <Button size="sm" className="px-5" onClick={onNext}>
          Lanjut
        </Button>
      </div>
    </div>
  );
}

function Welcome() {
  const nav = useNavigate();
  const { config } = useAppConfig();
  const { continueAsGuest, setOnboarded } = useAuth();
  return (
    <div className="app-shell flex min-h-dvh flex-col pb-[calc(var(--safe-bottom)+16px)] pt-safe">
      <div className="flex justify-end px-4 pt-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-[9px] font-extrabold text-white">ID</span>
      </div>
      <div className="flex flex-1 items-center justify-center px-2">
        <WorldMapArt className="w-full" />
      </div>
      <div className="px-4">
        <h1 className="text-[16px] font-extrabold">{config.organization.welcome_title}</h1>
        <p className="mt-1 text-[10px] leading-4 text-neutral-500">{config.organization.welcome_body}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            onClick={() => {
              setOnboarded();
              nav("/login");
            }}
          >
            Masuk
          </Button>
          <Button
            onClick={() => {
              setOnboarded();
              nav("/register");
            }}
          >
            Daftar
          </Button>
        </div>
        <p className="mt-3 text-[9px] leading-4 text-neutral-500">
          Dengan masuk atau mendaftar, kamu menyetujui{" "}
          <Link to="/terms" className="text-brand-500">
            Ketentuan Layanan
          </Link>{" "}
          dan{" "}
          <Link to="/privacy" className="text-brand-500">
            Kebijakan Privasi
          </Link>
          .
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              continueAsGuest();
              nav(config.single_property_slug ? `/property/${config.single_property_slug}` : "/home", { replace: true });
            }}
            className="tap flex items-center gap-1 text-[11px] font-bold text-brand-600"
          >
            Masuk Sebagai Guest <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
