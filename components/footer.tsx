import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-6">
        {/* Main row: Thalos left, Partners right */}
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          {/* Left: logo + tagline side by side */}
          <div className="flex items-center gap-3">
            <Image src="/thalos-icon.png" alt="Thalos" width={36} height={36} className="h-8 w-8 shrink-0 object-contain brightness-0 invert" />
            <p className="max-w-[280px] text-[11px] font-medium leading-relaxed text-muted-foreground/60">
              Payments and escrow infrastructure on Stellar. Protected funds, staged payments, and productive capital while retained.
            </p>
          </div>

          {/* Right: partner logos */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Built on</span>
              <Image src="/stellar-full.png" alt="Stellar" width={80} height={20} className="h-4 w-auto object-contain brightness-0 invert opacity-50" />
            </div>
            <div className="h-3.5 w-px bg-white/10" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Escrows by</span>
              <Image src="/trustless-logo.png" alt="Trustless Work" width={20} height={20} className="h-4 w-auto object-contain opacity-60" />
            </div>
          </div>
        </div>

        {/* Bottom row: socials + copyright */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-3">
            <a href="https://x.com/Thalos_infra" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 transition-colors hover:text-foreground" aria-label="Follow us on X">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="mailto:thalosinfrastructure@gmail.com" className="text-muted-foreground/40 transition-colors hover:text-foreground" aria-label="Email us">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </a>
          </div>
          <p className="text-[10px] text-muted-foreground/25">&copy; {new Date().getFullYear()} Thalos Infrastructure</p>
        </div>
      </div>
    </footer>
  )
}
