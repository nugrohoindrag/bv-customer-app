// Ketentuan Layanan & Kebijakan Privasi (statis, §8). Nama brand mengikuti org white-label.
import { useAppConfig } from "@/app/app-config";
import { TopBar } from "@/components/ui/shell";

export default function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { brandName } = useAppConfig();
  const terms = kind === "terms";
  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <TopBar title={terms ? "Ketentuan Layanan" : "Kebijakan Privasi"} />
      <div className="space-y-4 px-5 py-4 text-[11px] leading-5 text-neutral-600">
        {terms ? (
          <>
            <Sec t="1. Akun">Akun dibuat dengan nomor telepon yang diverifikasi melalui kode OTP. Anda bertanggung jawab menjaga kerahasiaan perangkat dan kode OTP Anda.</Sec>
            <Sec t="2. Pemesanan">Pemesanan kamar/unit dianggap sah setelah pembayaran diterima dan diverifikasi oleh {brandName}, atau setelah konfirmasi untuk metode bayar di tempat. Pemesanan yang belum dibayar hingga batas waktu akan hangus otomatis.</Sec>
            <Sec t="3. Pembatalan">Pembatalan mengikuti kebijakan pembatalan masing-masing properti yang ditampilkan sebelum Anda membatalkan. Pengembalian dana (bila ada) diproses oleh {brandName}.</Sec>
            <Sec t="4. Kewajiban Tamu">Tamu wajib mematuhi peraturan properti (Policies) yang tercantum pada halaman detail dan saat check-in, termasuk membawa identitas yang sah.</Sec>
            <Sec t="5. Perubahan">{brandName} dapat mengubah ketentuan ini sewaktu-waktu; versi terbaru berlaku sejak dipublikasikan di aplikasi.</Sec>
          </>
        ) : (
          <>
            <Sec t="1. Data yang dikumpulkan">Nama, email, nomor telepon, data pemesanan, serta lokasi perangkat (hanya bila Anda mengizinkan, untuk fitur Terdekat dan jarak).</Sec>
            <Sec t="2. Penggunaan">Data digunakan untuk memproses pemesanan, pembayaran, notifikasi status, dan layanan pelanggan {brandName}. Data tidak dijual kepada pihak ketiga.</Sec>
            <Sec t="3. Penyimpanan">Data disimpan pada server BuildingVision yang dikelola untuk {brandName} dengan pemisahan per organisasi. Sesi login disimpan di perangkat Anda dan dapat dihapus dengan Log Out.</Sec>
            <Sec t="4. Notifikasi">Notifikasi push hanya dikirim bila Anda mengaktifkannya dan dapat dimatikan kapan saja dari pengaturan perangkat.</Sec>
            <Sec t="5. Hak Anda">Anda dapat mengubah data akun dari menu Akun atau meminta penghapusan akun melalui kontak {brandName}.</Sec>
          </>
        )}
      </div>
    </div>
  );
}

function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-bold text-foreground">{t}</div>
      <p>{children}</p>
    </div>
  );
}
