// Figma LOGIN: "Masukkan nomor telepon Anda yang terdaftar." → OTP. Error nomor kosong / belum terdaftar (404 PHONE_NOT_REGISTERED).
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "@/api";
import { PhoneCheckArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { PhoneField } from "@/components/ui/field";
import { TopBar } from "@/components/ui/shell";
import { e164 } from "@/lib/format";
import { errorMessage, isApiError } from "@/lib/http";
import type { OtpState } from "./OtpPage";

export default function PhonePage() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from;
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (!digits) return setError("Harap isi nomor Anda terlebih dahulu!");
    if (digits.length < 8) return setError("Nomor telepon tidak valid");
    setLoading(true);
    setError(null);
    try {
      const full = e164(digits);
      const res = await api.otpRequest(full, "login");
      const state: OtpState = { phone: full, purpose: "login", ...res, from };
      nav("/login/otp", { state });
    } catch (err) {
      if (isApiError(err) && err.code === "PHONE_NOT_REGISTERED") setError("Nomor belum terdaftar. Silakan daftar terlebih dahulu.");
      else setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar transparent onBack={() => nav("/welcome")} />
      <form onSubmit={submit} className="flex flex-1 flex-col px-5 pb-[calc(var(--safe-bottom)+16px)]">
        <PhoneCheckArt className="h-14 w-16" />
        <h1 className="mt-4 text-[15px] font-extrabold leading-5">
          Masukkan nomor telepon Anda
          <br />
          yang terdaftar.
        </h1>
        <p className="mt-1 text-[9px] text-neutral-400">kode otp akan di kirim ke nomor telepon Anda</p>
        <PhoneField containerClassName="mt-6" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} error={error} autoFocus />
        <div className="flex-1" />
        <p className="mb-3 text-center text-[9px] text-neutral-500">
          Belum punya akun ?{" "}
          <Link to="/register" className="font-bold text-brand-500">
            Daftar di sini
          </Link>
        </p>
        <Button type="submit" block loading={loading}>
          Lanjutkan
        </Button>
      </form>
    </div>
  );
}
