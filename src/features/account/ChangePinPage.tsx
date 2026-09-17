// Ubah PIN (Akun → Ubah PIN): PIN saat ini (PIN default 1234 bila belum pernah diganti), PIN baru, konfirmasi → auth/pin/change.
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { PhoneLockArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { PinField } from "@/components/ui/field";
import { TopBar } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { errorMessage, isApiError } from "@/lib/http";

export default function ChangePinPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.current.length !== 4) errs.current = "PIN saat ini harus 4 digit";
    if (form.next.length !== 4) errs.next = "PIN baru harus 4 digit angka";
    else if (form.next === form.current) errs.next = "PIN baru harus berbeda dari PIN lama";
    if (form.confirm !== form.next) errs.confirm = "Konfirmasi PIN tidak sama";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await api.pinChange(form.current, form.next);
      toast.success("PIN berhasil diubah");
      nav("/account", { replace: true });
    } catch (err) {
      if (isApiError(err) && err.code === "PIN_INVALID") setErrors({ current: "PIN saat ini salah" });
      else if (isApiError(err) && err.code === "PIN_LOCKED") setErrors({ current: "Terlalu banyak percobaan; coba lagi dalam 15 menit" });
      else toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar transparent />
      <form onSubmit={submit} className="flex flex-1 flex-col px-5 pb-[calc(var(--safe-bottom)+16px)]">
        <PhoneLockArt className="h-16 w-16" />
        <h1 className="mt-4 text-[15px] font-extrabold">Ubah PIN akun kamu.</h1>
        <p className="mt-1 text-[9px] leading-4 text-neutral-400">PIN 4 digit dipakai untuk masuk ke aplikasi. Jika belum pernah mengubah PIN, PIN saat ini adalah PIN awal dari pengelola.</p>
        <div className="mt-5 space-y-4">
          <PinField label="PIN saat ini" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} error={errors.current} autoFocus />
          <PinField label="PIN baru" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} error={errors.next} />
          <PinField label="Konfirmasi PIN baru" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
        </div>
        <div className="flex-1" />
        <Button type="submit" block loading={loading} className="mt-8">
          Simpan PIN
        </Button>
      </form>
    </div>
  );
}
