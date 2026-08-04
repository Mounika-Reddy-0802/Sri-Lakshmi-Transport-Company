import { ImageIcon } from "lucide-react";

/* A designed frame the owner replaces with a real photo.
   Drop an <img> in place of this, or set a background image. */
export function PhotoSlot({
  label, ratio = "aspect-[4/3]", className = "",
}: { label: string; ratio?: string; className?: string }) {
  return (
    <div className={`photo-slot rounded-xl2 ${ratio} ${className}`}>
      <div className="absolute inset-0 grid place-items-center p-6 text-center">
        <div>
          <ImageIcon className="mx-auto text-white/40" size={26} />
          <p className="mt-3 text-sm font-medium text-white/85">{label}</p>
          <p className="mt-1 text-xs text-white/45">Replace with a real photo</p>
        </div>
      </div>
    </div>
  );
}
