export function ThalosLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5">
        {/* Spinning ring */}
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#f0b400]"
            style={{ animationDuration: "0.8s" }} />
        </div>
        {/* Brand text */}
        <p className="text-sm font-semibold tracking-[0.2em] text-white/30">THALOS</p>
      </div>
    </div>
  )
}
