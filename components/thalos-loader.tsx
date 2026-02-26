import Image from "next/image"

export function ThalosLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* Glow ring behind logo */}
          <div className="absolute -inset-4 rounded-full bg-[#f0b400]/10 animate-pulse-glow" />
          <Image
            src="/thalos-logo.jpg"
            alt="Thalos"
            width={140}
            height={140}
            className="relative h-28 w-28 object-contain drop-shadow-[0_0_30px_rgba(240,180,0,0.3)]"
            style={{ animation: "thalos-spin 3s ease-in-out infinite" }}
            priority
          />
        </div>
        <p className="text-sm font-bold tracking-[0.25em] text-foreground/30">THALOS</p>
      </div>
    </div>
  )
}
