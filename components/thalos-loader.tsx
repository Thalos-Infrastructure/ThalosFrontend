import Image from "next/image"
import { cn } from "@/lib/utils"

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-16 w-16",
  lg: "h-32 w-32",
} as const

interface ThalosLoaderProps {
  /**
   * Omit for the full-screen overlay (the page-level loading state). Pass a
   * size for an inline spinner - callers that already center it themselves, or
   * that render it inside a button, must not get a `fixed inset-0` overlay.
   */
  size?: keyof typeof sizeClasses
  className?: string
}

export function ThalosLoader({ size, className }: ThalosLoaderProps) {
  const spinner = (
    <Image
      src="/thalos-logo-new.png"
      alt="Thalos"
      width={160}
      height={160}
      className={cn(
        sizeClasses[size ?? "lg"],
        "object-contain animate-[thalos-spin_2.5s_ease-in-out_infinite]",
        className,
      )}
      priority
    />
  )

  if (size) return spinner

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      {spinner}
    </div>
  )
}
