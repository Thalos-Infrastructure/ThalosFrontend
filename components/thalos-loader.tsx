import Image from "next/image"

export function ThalosLoader({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = size === "lg" ? "h-32 w-32" : size === "sm" ? "h-8 w-8" : "h-16 w-16";
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-background`}>
      <Image
        src="/thalos-logo-new.png"
        alt="Thalos"
        width={160}
        height={160}
        className={`${sizeClasses} object-contain animate-[thalos-spin_2.5s_ease-in-out_infinite] ${className || ""}`}
        priority
      />
    </div>
  )
}
