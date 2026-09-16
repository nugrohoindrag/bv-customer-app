// Figma AKUN SECTION: avatar inisial (biru), nama, HP, email, "Edit Data Akun ✎", Log Out (merah outline) di bawah.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useAuth } from "@/app/auth";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/sheet";
import { Page, TabTitle } from "@/components/ui/shell";
import { initials } from "@/lib/utils";
import { unsubscribePushLocal } from "@/features/inbox/push";

export default function AccountPage() {
  const nav = useNavigate();
  const { customer, logout } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!customer) return null;

  async function doLogout() {
    setBusy(true);
    await unsubscribePushLocal();
    await logout(); // RequireAuth mengarahkan ke /login
  }

  return (
    <Page bottomNav>
      <TabTitle title="Akun" />
      <div className="flex flex-1 flex-col items-center px-5 pb-6 pt-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-info text-[24px] font-extrabold text-white">{initials(customer.full_name)}</span>
        <div className="mt-4 text-[14px] font-extrabold">{customer.full_name}</div>
        <div className="mt-1 text-[10px] text-neutral-600">{customer.phone}</div>
        <div className="mt-1 text-[10px] text-neutral-600">{customer.email}</div>
        <Button block className="mt-4" onClick={() => nav("/account/edit")}>
          Edit Data Akun <Pencil size={13} />
        </Button>
        <div className="flex-1" />
        <Button block variant="danger-outline" className="mt-10" onClick={() => setConfirm(true)}>
          Log Out
        </Button>
        <p className="mt-3 text-[9px] text-neutral-400">
          <a href="/terms" className="text-brand-500">
            Ketentuan Layanan
          </a>{" "}
          ·{" "}
          <a href="/privacy" className="text-brand-500">
            Kebijakan Privasi
          </a>{" "}
          · v{__APP_VERSION__}
        </p>
      </div>
      <ConfirmDialog open={confirm} title="Keluar dari akun?" body="Kamu perlu masuk kembali dengan OTP untuk melihat booking." confirmLabel="Log Out" cancelLabel="Batal" danger onConfirm={doLogout} onCancel={() => setConfirm(false)} loading={busy} />
    </Page>
  );
}
