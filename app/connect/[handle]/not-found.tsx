import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0e17]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="text-sm font-bold text-white/80 hidden sm:inline">Thalos</span>
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-white/30">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Profile Not Found</h1>
        <p className="mb-8 max-w-sm text-sm text-white/40">
          We couldn&apos;t find a profile matching that handle. It may have been removed or the
          link might be incorrect.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-[#f0b400] px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-[#f0b400]/90"
        >
          Back to Home
        </Link>
      </main>
    </div>
  )
}
