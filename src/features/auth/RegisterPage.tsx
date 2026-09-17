// Figma REGISTER: "Lengkapi data dirimu di bawah ini, ya." Nama Lengkap, Email, Nomor HP (+ PIN & konfirmasi pada mode PIN).
// Mode PIN (default, vendor SMS di-hold): Simpan → auth/pin/register → langsung masuk.
// Mode OTP: Simpan → OTP (purpose register) → backend register(otp_token, full_name, email).
// Error per field (409 PHONE_EXISTS: nomor sudah terdaftar).
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useAppConfig } from "@/app/app-config";
import { useAuth } from "@/app/auth";
import { PhoneCheckArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { Field, PhoneField, PinField } from "@/components/ui/field";
import { TopBar } from "@/components/ui/shell";
import { e164 } from "@/lib/format";
import { errorMessage, isApiError } from "@/lib/http";
import type { OtpState } from "./OtpPage";

export default function RegisterPage() {
  const nav = useNavigate();
  const auth = useAuth();
  const { config } = useAppConfig();
  const usePin = config.features.auth_method !== "otp";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; pin?: string; pin2?: string }>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Nama lengkap tidak boleh kosong!";
    if (!email.trim()) errs.email = "Email tidak boleh kosong!";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Email tidak valid";
    const digits = phone.replace(/\D/g, "");
    if (!digits) errs.phone = "Nomor hp tidak boleh kosong!";
    else if (digits.length < 8) errs.phone = "Nomor telepon tidak valid";
    if (usePin) {
      if (pin.length !== 4) errs.pin = "PIN harus 4 digit angka";
      else if (pin2 !== pin) errs.pin2 = "Konfirmasi PIN tidak sama";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const full = e164(digits);
      if (usePin) {
        const res = await api.pinRegister({ phone: full, full_name: name.trim(), email: email.trim(), pin });
        auth.signIn(res);
        nav("/", { replace: true });
        return;
      }
      const res = await api.otpRequest(full, "register");
      const state: OtpState = { phone: full, purpose: "register", full_name: name.trim(), email: email.trim(), ...res };
      nav("/register/otp", { state });
    } catch (err) {
      if (isApiError(err) && err.code === "PHONE_EXISTS") setErrors({ phone: "Nomor sudah terdaftar. Silakan masuk." });
      else setErrors({ phone: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar transparent />
      <form onSubmit={submit} className="flex flex-1 flex-col px-5 pb-[calc(var(--safe-bottom)+16px)]">
        <PhoneCheckArt className="h-14 w-16" />
        <h1 className="mt-4 text-[15px] font-extrabold">Lengkapi data dirimu di bawah ini, ya.</h1>
        <div className="mt-5 space-y-4">
          <Field label="Nama Lengkap" placeholder="cth : Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" autoFocus />
          <Field label="Email" type="email" placeholder="cth : nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
          <PhoneField label="Nomor HP" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} error={errors.phone} />
          {usePin && (
            <>
              <PinField label="Buat PIN" value={pin} onChange={(e) => setPin(e.target.value)} error={errors.pin} hint="PIN 4 digit dipakai untuk masuk ke aplikasi." />
              <PinField label="Konfirmasi PIN" value={pin2} onChange={(e) => setPin2(e.target.value)} error={errors.pin2} />
            </>
          )}
        </div>
        <div className="flex-1" />
        <Button type="submit" block loading={loading} className="mt-8">
          {usePin ? "Daftar" : "Simpan"}
        </Button>
      </form>
    </div>
  );
}
