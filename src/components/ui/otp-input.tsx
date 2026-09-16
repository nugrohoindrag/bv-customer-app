// Input OTP 4 kotak (Figma): satu input tersembunyi + kotak visual, otomatis submit saat 4 digit.
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function OtpInput({ value, onChange, length = 4, error, disabled, autoFocus = true }: { value: string; onChange: (v: string) => void; length?: number; error?: boolean; disabled?: boolean; autoFocus?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <div className="relative">
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        disabled={disabled}
        aria-label="Kode OTP"
        className="absolute inset-0 h-full w-full opacity-0"
      />
      <div className="flex gap-2" onClick={() => ref.current?.focus()}>
        {Array.from({ length }).map((_, i) => (
          <div key={i} className={cn("flex h-9 w-9 items-center justify-center rounded-sm bg-neutral-100 text-[15px] font-bold", error && "ring-1 ring-danger", value.length === i && !disabled && "ring-1 ring-brand-500")}>
            {value[i] ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}
