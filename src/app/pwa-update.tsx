// Prompt pembaruan service worker (registerType: prompt) + indikator offline. Di native Capacitor SW tidak didaftarkan.
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflineBanner } from "@/components/ui/misc";
import { useOnline } from "@/lib/hooks";
import { isNative } from "@/lib/native";

export function PwaUpdatePrompt() {
  const online = useOnline();
  return (
    <>
      {!online && (
        <div className="fixed left-1/2 top-[calc(var(--safe-top)+8px)] z-[60] -translate-x-1/2">
          <OfflineBanner className="whitespace-nowrap rounded-full px-3" />
        </div>
      )}
      {!isNative && <UpdatePrompt />}
    </>
  );
}

function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });
  if (!needRefresh) return null;
  return (
    <div className="fade-up fixed inset-x-4 bottom-[calc(var(--safe-bottom)+72px)] z-[60] mx-auto max-w-[448px] rounded-lg bg-card p-3 shadow-float ring-1 ring-border">
      <div className="flex items-center gap-3">
        <RefreshCw className="text-brand-500" size={20} />
        <div className="flex-1 text-sm">
          <div className="font-bold">Versi baru tersedia</div>
          <div className="text-neutral-500">Muat ulang untuk memperbarui aplikasi.</div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
          Nanti
        </Button>
        <Button size="sm" onClick={() => updateServiceWorker(true)}>
          Perbarui
        </Button>
      </div>
    </div>
  );
}
