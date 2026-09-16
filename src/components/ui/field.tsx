// Input gaya Figma: label kecil abu di atas, garis bawah tipis, pesan error merah kecil di bawah. Varian PhoneField "+62 | 8123456789".
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string | null;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  containerClassName?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, hint, prefix, suffix, className, containerClassName, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-[11px] font-semibold text-neutral-500">
          {label}
        </label>
      )}
      <div className={cn("flex items-center gap-3 border-b py-2", error ? "border-danger" : "border-border focus-within:border-brand-500")}>
        {prefix && <span className="shrink-0 text-[14px] font-bold text-foreground">{prefix}</span>}
        {prefix && <span className="h-5 w-px bg-border" />}
        <input ref={ref} id={inputId} className={cn("min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none placeholder:font-normal placeholder:text-neutral-400", className)} {...rest} />
        {suffix}
      </div>
      {error ? <p className="mt-1 text-[11px] text-danger">{error}</p> : hint ? <p className="mt-1 text-[11px] text-neutral-400">{hint}</p> : null}
    </div>
  );
});

export const PhoneField = forwardRef<HTMLInputElement, Omit<FieldProps, "prefix">>(function PhoneField(props, ref) {
  return <Field ref={ref} prefix="+62" inputMode="numeric" autoComplete="tel-national" placeholder="cth : 8123456789" {...props} />;
});
