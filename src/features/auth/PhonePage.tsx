// Figma LOGIN: "Masukkan nomor telepon Anda yang terdaftar." Mode PIN (default, vendor SMS di-hold): nomor HP + PIN 4 digit
// → langsung masuk. Mode OTP (app-config features.auth_method = "otp"): nomor → kirim OTP → halaman OTP.
// Error nomor kosong / belum terdaftar (404 PHONE_NOT_REGISTERED) / PIN salah (401 PIN_INVALID) / terkunci (423 PIN_LOCKED).
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useAppConfig } from "@/app/app-config";
import { useAuth } from "@/app/auth";
import { PhoneCheckArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { PhoneField, PinField } from "@/components/ui/field";
import { TopBar } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { e164 } from "@/lib/format";
import { errorMessage, isApiError } from "@/lib/http";
import type { OtpState } from "./OtpPage";

export default function PhonePage() {
  const nav = useNavigate();
  const loc = useLocation();
  const auth = useAuth();
  const toast = useToast();
  const { config } = useAppConfig();
  const usePin = config.features.auth_method !== "otp";
  const from = (loc.state as { from?: string } | null)?.from;
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (!digits) return setError("Harap isi nomor Anda terlebih dahulu!");
    if (digits.length < 8) return setError("Nomor telepon tidak valid");
    if (usePin && pin.length !== 4) return setPinError("Harap isi PIN 4 digit!");
    setLoading(true);
    setError(null);
    setPinError(null);
    try {
      const full = e164(digits);
      if (usePin) {
        const res = await api.pinLogin(full, pin);
        auth.signIn(res);
        if (res.pin_is_default) toast.show("Kamu masih memakai PIN default. Ubah PIN di menu Akun.", "info");
        nav(from || "/", { replace: true });
        return;
      }
      const res = await api.otpRequest(full, "login");
      const state: OtpState = { phone: full, purpose: "login", ...res, from };
      nav("/login/otp", { state });
    } catch (err) {
      if (isApiError(err) && err.code === "PHONE_NOT_REGISTERED") setError("Nomor belum terdaftar. Silakan daftar terlebih dahulu.");
      else if (isApiError(err) && err.code === "PIN_INVALID") setPinError("PIN salah");
      else if (isApiError(err) && err.code === "PIN_LOCKED") setPinError("Terlalu banyak percobaan; coba lagi dalam 15 menit");
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
        <p className="mt-1 text-[9px] text-neutral-400">{usePin ? "masuk dengan nomor telepon dan PIN 4 digit Anda" : "kode otp akan di kirim ke nomor telepon Anda"}</p>
        <PhoneField containerClassName="mt-6" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} error={error} autoFocus />
        {usePin && (
          <PinField
            label="PIN"
            containerClassName="mt-4"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setPinError(null);
            }}
            error={pinError}
          />
        )}
        <div className="flex-1" />
        <p className="mb-3 text-center text-[9px] text-neutral-500">
          Belum punya akun ?{" "}
          <Link to="/register" className="font-bold text-brand-500">
            Daftar di sini
          </Link>
        </p>
        <Button type="submit" block loading={loading}>
          {usePin ? "Masuk" : "Lanjutkan"}
        </Button>
      </form>
    </div>
  );
}
