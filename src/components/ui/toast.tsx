// Toast Figma: pil hijau di atas ("Booking Berhasil", "Cancel Booking Berhasil", "Data Berhasil di Ubah").
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: Kind;
  text: string;
}
interface ToastCtx {
  show(text: string, kind?: Kind): void;
  success(text: string): void;
  error(text: string): void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const show = useCallback((text: string, kind: Kind = "success") => {
    const id = ++seq.current;
    setItems((s) => [...s, { id, kind, text }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 2600);
  }, []);
  const value = useMemo<ToastCtx>(() => ({ show, success: (t) => show(t, "success"), error: (t) => show(t, "error") }), [show]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-top)+56px)] z-[70] flex flex-col items-center gap-2">
        {items.map((t) => (
          <div key={t.id} className={cn("toast-in rounded-sm px-6 py-2 text-[12px] font-semibold text-white shadow-float", t.kind === "error" ? "bg-danger" : t.kind === "info" ? "bg-neutral-700" : "bg-brand-400")}>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast di luar ToastProvider");
  return v;
}
