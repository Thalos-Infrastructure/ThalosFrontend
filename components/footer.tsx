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
            {/* Social links */}
            <div className="mt-4 flex items-center gap-4">
              <a
                href="https://x.com/Thalos_infra"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-all duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white"
                aria-label="Follow us on X"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="mailto:thalosinfrastructure@gmail.com"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-all duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white"
                aria-label="Email us"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/>
                </svg>
              </a>
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
                <li>
                  <a href="#" className="text-sm font-medium text-white/45 transition-all duration-300 hover:text-white/80">About</a>
                </li>
                <li>
                  <a href="mailto:thalosinfrastructure@gmail.com" className="text-sm font-medium text-white/45 transition-all duration-300 hover:text-white/80">Contact</a>
                </li>
                <li>
                  <a href="https://x.com/Thalos_infra" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/45 transition-all duration-300 hover:text-white/80">X (Twitter)</a>
                </li>
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
