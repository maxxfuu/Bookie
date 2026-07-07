import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"

/** Greyed-out stand-in for the hero visual until the real image lands. */
export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border bg-muted/50",
        className
      )}
    >
      <ImageIcon className="size-6 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Image placeholder</span>
    </div>
  )
}
