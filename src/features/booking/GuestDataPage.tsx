// Figma MODIFY DATA BOOKING: "Ubah data Anda di bawah ini, ya." Nama Lengkap, Email, Nomor HP → Kembali / Simpan
// → PATCH /bookings/{code}/guest → toast "Data Berhasil di Ubah".
import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Field, PhoneField } from "@/components/ui/field";
import { TopBar } from "@/components/ui/shell";
import { useToast } from "@/components/ui/toast";
import { e164, localPhone } from "@/lib/format";
import { errorMessage, isApiError } from "@/lib/http";
import { useBooking } from "./BookingDetailPage";

export default function GuestDataPage() {
  const { code = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const bq = useBooking(code);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bq.data) setForm({ full_name: bq.data.guest.full_name, email: bq.data.guest.email, phone: localPhone(bq.data.guest.phone) });
  }, [bq.data]);

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
      const updated = await api.modifyGuest(code, { full_name: form.full_name.trim(), email: form.email.trim(), phone: e164(form.phone) });
      qc.setQueryData(["booking", code], updated);
      nav(`/bookings/${code}`, { replace: true, state: { toast: "Data Berhasil di Ubah" } });
    } catch (err) {
      if (isApiError(err) && err.code === "GUEST_LOCKED") toast.error("Data tamu tidak dapat diubah setelah check-in");
      else toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar title="Modify Guest Data" close />
      <form onSubmit={submit} className="flex flex-1 flex-col px-5 pb-[calc(var(--safe-bottom)+16px)]">
        <h1 className="mt-2 text-[13px] font-extrabold">Ubah data Anda di bawah ini, ya.</h1>
        <div className="mt-5 space-y-4">
          <Field label="Nama Lengkap" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} error={errors.full_name} />
          <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          <PhoneField label="Nomor HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} error={errors.phone} />
        </div>
        <div className="flex-1" />
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Button type="button" variant="muted" onClick={() => nav(-1)}>
            Kembali
          </Button>
          <Button type="submit" loading={loading} disabled={!bq.data?.can_modify_guest}>
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
