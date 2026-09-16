// Figma OTP: "Kode OTP Anda sudah dikirim!", 4 kotak, countdown 1:39 → "Kirim Ulang", error "Harap isi kode OTP terlebih dahulu!".
// Dipakai untuk login (→ token), register (→ otp_token → register), change_phone (→ otp_token → PATCH customers/me).
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Timer } from "lucide-react";
import { api } from "@/api";
import type { OTPPurpose, OTPRequestResult } from "@/api/types";
import { useAuth } from "@/app/auth";
import { PhoneLockArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { TopBar } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { mmss } from "@/lib/format";
import { useSecondsCountdown } from "@/lib/hooks";
import { errorMessage, isApiError } from "@/lib/http";
import { cn } from "@/lib/utils";

export interface OtpState extends Partial<OTPRequestResult> {
  phone: string;
  purpose: OTPPurpose;
  full_name?: string;
  email?: string;
  from?: string;
}

export default function OtpPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const st = loc.state as OtpState | null;
  const auth = useAuth();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(0);
  const [meta, setMeta] = useState<Partial<OTPRequestResult>>(st ?? {});
  const expires = useSecondsCountdown(meta.expires_in ?? 100, round);
  const resendIn = useSecondsCountdown(meta.resend_after ?? 60, round);

  useEffect(() => {
    setError(null);
  }, [code]);

  if (!st) return <Navigate to="/login" replace />;

  async function resend() {
    try {
      const r = await api.otpRequest(st!.phone, st!.purpose);
      setMeta(r);
      setRound((x) => x + 1);
      setCode("");
      toast.success("Kode OTP dikirim ulang");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function submit() {
    if (code.length < 4) return setError("Harap isi kode OTP terlebih dahulu!");
    setLoading(true);
    setError(null);
    try {
      const v = await api.otpVerify(st!.phone, code, st!.purpose);
      if (st!.purpose === "login") {
        auth.signIn(v);
        nav(st!.from || "/", { replace: true });
      } else if (st!.purpose === "register") {
        const r = await api.register(v.otp_token!, st!.full_name!, st!.email!);
        auth.signIn(r);
        nav("/", { replace: true });
      } else {
        const me = await api.updateMe({ full_name: st!.full_name, email: st!.email, phone: st!.phone, otp_token: v.otp_token });
        auth.setCustomer(me);
        toast.success("Data Berhasil di Ubah");
        nav("/account", { replace: true });
      }
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === "OTP_INVALID") setError("Kode OTP tidak valid");
        else if (err.code === "OTP_EXPIRED") setError("Kode OTP kedaluwarsa; minta kode baru");
        else if (err.code === "OTP_LOCKED") setError("Terlalu banyak percobaan; minta kode baru");
        else setError(errorMessage(err));
      } else setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar transparent />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-1 flex-col px-5 pb-[calc(var(--safe-bottom)+16px)]"
      >
        <PhoneLockArt className="h-16 w-16" />
        <h1 className="mt-4 text-[15px] font-extrabold">Kode OTP Anda sudah dikirim!</h1>
        <p className="mt-1 text-[9px] leading-4 text-neutral-400">
          Masukkan kode OTP yang Kami kirim lewat SMS ke nomor HP Anda yang terdaftar <span className="font-bold text-foreground">{meta.masked_phone ?? st.phone}</span>
        </p>
        <div className="mt-5 flex items-center justify-between">
          <OtpInput value={code} onChange={setCode} error={!!error} disabled={loading} />
          {resendIn > 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500">
              <Timer size={12} className="text-brand-500" /> {mmss(expires)}
            </span>
          ) : (
            <button type="button" onClick={resend} className="text-[10px] font-bold text-brand-500">
              Kirim Ulang
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-[9px] text-danger">{error}</p>}
        {meta.dev_code && (
          <p className={cn("mt-3 rounded-sm bg-star-soft px-3 py-2 text-[10px] text-neutral-700")}>
            Mode dev (SMS mock): kode OTP <b>{meta.dev_code}</b>
          </p>
        )}
        <div className="flex-1" />
        <Button type="submit" block loading={loading} className="mt-8">
          {st.purpose === "login" ? "Masuk" : st.purpose === "register" ? "Masuk" : "Simpan"}
        </Button>
      </form>
    </div>
  );
}
