// Label rating (server: No Review Yet / Bad / Good / Very Good / Awesome) + label & emoji bintang saat Beri Rating (Figma).
export const STAR_LABELS: Record<number, { label: string; emoji: string }> = {
  0: { label: "Yuk pilih bintangnya!", emoji: "🙂" },
  1: { label: "Buruk!", emoji: "😣" },
  2: { label: "Tidak Menyenangkan.", emoji: "😞" },
  3: { label: "Lumayan.", emoji: "😀" },
  4: { label: "Menyenangkan!", emoji: "😍" },
  5: { label: "Luar Biasa Indah!", emoji: "🤩" },
};

export function ratingLabel(avg: number, count: number): string {
  if (count === 0) return "No Review Yet";
  if (avg < 2.5) return "Bad";
  if (avg < 4) return "Good";
  if (avg < 4.8) return "Very Good";
  return "Awesome";
}

export function ratingText(avg: number): string {
  return avg > 0 ? avg.toFixed(1) : "0.0";
}
