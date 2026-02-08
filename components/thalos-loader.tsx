import Image from "next/image"

export function ThalosLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="relative">
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: "radial-gradient(circle, rgba(240,180,0,0.15) 0%, transparent 70%)",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
          aria-hidden="true"
        />
        {/* Spinning logo */}
        <div
          className="relative"
          style={{
            animation: "thalos-spin 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            transformStyle: "preserve-3d",
          }}
        >
          <Image
            src="/thalos-icon.png"
            alt="Loading..."
            width={120}
            height={120}
            className="h-24 w-24 object-contain"
            priority
          />
        </div>
      </div>
      <p className="mt-6 text-sm font-semibold tracking-wider text-white/40 animate-pulse">
        Loading...
      </p>
    </div>
  )
}
