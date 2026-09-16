// Bottom sheet & dialog konfirmasi (Figma: Sort by, Cancel Booking Confirmation).
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Sheet({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; className?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn("sheet-up relative w-full max-w-[480px] rounded-t-2xl bg-card pb-[calc(var(--safe-bottom)+16px)] shadow-modal", className)}>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-neutral-300" />
        {title !== undefined && (
          <div className="flex items-center gap-2 px-4 pb-2 pt-3">
            <button type="button" onClick={onClose} aria-label="Tutup" className="tap -ml-1 flex h-8 w-8 items-center justify-center rounded-full">
              <X size={20} className="text-brand-500" strokeWidth={2.5} />
            </button>
            <div className="text-[15px] font-bold">{title}</div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Kembali",
  onConfirm,
  onCancel,
  loading,
  danger,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="alertdialog" aria-modal="true">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="fade-up relative w-full max-w-[360px] rounded-lg bg-card p-5 text-center shadow-modal">
        <div className="text-[15px] font-bold">{title}</div>
        <div className="mt-3 text-[12px] leading-5 text-neutral-500">{body}</div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant={danger ? "danger-outline" : "outline"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
          <Button onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
