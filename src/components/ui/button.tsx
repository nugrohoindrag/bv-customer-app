import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger" | "danger-outline" | "soft" | "muted";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

// Figma: tombol hijau flat #2ECC71 radius kecil (4px), teks putih bold; outline putih dengan border hijau; danger outline merah.
const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white disabled:bg-neutral-200 disabled:text-white",
  outline: "border border-brand-500 text-brand-600 bg-card",
  ghost: "text-brand-600 bg-transparent",
  danger: "bg-danger text-white",
  "danger-outline": "border border-danger text-danger bg-card",
  soft: "bg-brand-50 text-brand-700",
  muted: "border border-border text-neutral-500 bg-card",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[12px] rounded-sm",
  md: "h-11 px-5 text-[14px] rounded-sm",
  lg: "h-12 px-6 text-[15px] rounded-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", size = "md", loading, block, disabled, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn("tap inline-flex select-none items-center justify-center gap-2 font-bold transition disabled:cursor-not-allowed", variants[variant], sizes[size], block && "w-full", className)}
      {...rest}
    >
      {loading && <Loader2 className="animate-spin" size={18} />}
      {children}
    </button>
  );
});
