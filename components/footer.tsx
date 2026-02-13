import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-card/10">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Top: Logo + tagline row */}
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          {/* Logo */}
          <Image
            src="/thalos-icon.png"
            alt="Thalos"
            width={200}
            height={200}
            className="h-28 w-auto object-contain"
          />
          {/* Tagline */}
          <p className="max-w-sm text-sm font-medium leading-relaxed text-white/50 md:text-right">
            Payments and escrow infrastructure on Stellar. Protected funds, staged payments, and productive capital while retained.
          </p>
        </div>

        {/* Middle: links + socials */}
        <div className="mt-6 flex flex-col gap-6 border-t border-border/10 pt-6 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-12">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/70">Platform</p>
              <ul className="flex flex-col gap-1.5">
                {["Documentation", "API Reference", "Use Cases", "Pricing"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm font-medium text-white/45 transition-all duration-300 hover:text-white/80">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/70">Company</p>
              <ul className="flex flex-col gap-1.5">
                <li><a href="#" className="text-sm font-medium text-white/45 transition-all duration-300 hover:text-white/80">About</a></li>
                <li><a href="mailto:thalosinfrastructure@gmail.com" className="text-sm font-medium text-white/45 transition-all duration-300 hover:text-white/80">Contact</a></li>
                <li><a href="https://x.com/Thalos_infra" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/45 transition-all duration-300 hover:text-white/80">X (Twitter)</a></li>
              </ul>
            </div>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            <a href="https://x.com/Thalos_infra" target="_blank" rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-all duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white"
              aria-label="Follow us on X">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="mailto:thalosinfrastructure@gmail.com"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-all duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white"
              aria-label="Email us">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
            </a>
          </div>
        </div>

        {/* Bottom: Built on Stellar + Escrows by Trustless Work + legal */}
        <div className="mt-6 flex flex-col items-center gap-4 border-t border-border/10 pt-5 md:flex-row md:justify-between">
          {/* Partner badges */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/40">Built on</span>
              <Image src="/stellar-logo.png" alt="Stellar" width={80} height={80} className="h-5 w-auto object-contain brightness-0 invert opacity-60" />
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/40">Escrows by</span>
              <Image src="/trustless-logo.png" alt="Trustless Work" width={80} height={80} className="h-5 w-auto object-contain opacity-70" />
            </div>
          </div>

          {/* Legal */}
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-medium text-white/40 transition-all duration-300 hover:text-white/70">Privacy</a>
            <a href="#" className="text-xs font-medium text-white/40 transition-all duration-300 hover:text-white/70">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
