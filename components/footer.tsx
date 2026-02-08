import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-card/10">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Logo + description */}
          <div className="max-w-sm">
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={200}
              height={200}
              className="mb-4 h-36 w-auto object-contain"
            />
            <p className="text-sm font-medium leading-relaxed text-white/50">
              Payments and escrow infrastructure on Stellar. Protected funds, staged payments, and productive capital while retained.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-muted-foreground">Built on Stellar</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/70">Platform</p>
              <ul className="flex flex-col gap-2">
                {["Documentation", "API Reference", "Use Cases", "Pricing"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm font-medium text-white/45 transition-all duration-300 hover:text-white/80">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/70">Company</p>
              <ul className="flex flex-col gap-2">
                {["About", "Contact"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm font-medium text-white/45 transition-all duration-300 hover:text-white/80">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/10 pt-6 md:flex-row">
          <p className="text-xs font-semibold text-white/40">
            Thalos. Escrow & Payments Infrastructure.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-medium text-white/40 transition-all duration-300 hover:text-white/70">Privacy</a>
            <a href="#" className="text-xs font-medium text-white/40 transition-all duration-300 hover:text-white/70">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
