// Figma Edit Data Akun: "Ubah data dirimu di bawah ini, ya." Nama, Email, Nomor HP → Lanjutkan.
// Nomor tetap → PATCH customers/me; nomor berubah → OTP change_phone ke nomor baru → OTP page → PATCH dengan otp_token.
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/app/auth";
import { PhoneCheckArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { Field, PhoneField } from "@/components/ui/field";
import { TopBar } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { e164, localPhone } from "@/lib/format";
import { errorMessage, isApiError } from "@/lib/http";
import type { OtpState } from "@/features/auth/OtpPage";

export default function EditAccountPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { customer, setCustomer } = useAuth();
  const [form, setForm] = useState({ full_name: customer?.full_name ?? "", email: customer?.email ?? "", phone: localPhone(customer?.phone) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Nama lengkap tidak boleh kosong!";
    if (!form.email.trim()) errs.email = "Email tidak boleh kosong!";
    if (!form.phone.replace(/\D/g, "")) errs.phone = "Nomor hp tidak boleh kosong!";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const newPhone = e164(form.phone);
      if (newPhone !== customer?.phone) {
        const res = await api.otpRequest(newPhone, "change_phone");
        const state: OtpState = { phone: newPhone, purpose: "change_phone", full_name: form.full_name.trim(), email: form.email.trim(), ...res };
        nav("/account/otp", { state });
        return;
      }
      const me = await api.updateMe({ full_name: form.full_name.trim(), email: form.email.trim() });
      setCustomer(me);
      toast.success("Data Berhasil di Ubah");
      nav("/account", { replace: true });
    } catch (err) {
      if (isApiError(err) && err.code === "PHONE_EXISTS") setErrors({ phone: "Nomor sudah terdaftar di akun lain." });
      else toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar transparent />
      <form onSubmit={submit} className="flex flex-1 flex-col px-5 pb-[calc(var(--safe-bottom)+16px)]">
        <PhoneCheckArt className="h-14 w-16" />
        <h1 className="mt-4 text-[15px] font-extrabold">Ubah data dirimu di bawah ini, ya.</h1>
        <div className="mt-5 space-y-4">
          <Field label="Nama Lengkap" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} error={errors.full_name} />
          <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          <PhoneField label="Nomor HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} error={errors.phone} hint="Mengubah nomor HP memerlukan verifikasi OTP ke nomor baru." />
        </div>
        <div className="flex-1" />
        <Button type="submit" block loading={loading} className="mt-8">
          {e164(form.phone) !== customer?.phone && form.phone ? "Lanjutkan" : "Simpan"}
        </Button>
      </form>
    </div>
  );
}
