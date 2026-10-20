"use client"

/**
 * Tells someone with no email on file that they will not be notified.
 *
 * Thalos resolves notification recipients from `profiles.email`, joined through
 * the agreement's participants. A wallet with no email simply drops out of the
 * recipient list, and the send returns early without logging anything — so the
 * person never hears about their own agreements and nothing anywhere says why.
 *
 * It renders only once the profile has actually loaded: showing this while the
 * profile is still null would accuse every visitor of missing an email during
 * the first render.
 */

import Link from "next/link"
import { useStellarWallet } from "@/lib/stellar-wallet"

export function EmailMissingBanner({ className }: { className?: string }) {
  const { profile } = useStellarWallet()

  if (!profile || profile.email) return null

  return (
    <div
      className={`rounded-xl border border-[#f0b400]/25 bg-[#f0b400]/5 px-4 py-3 text-sm ${className ?? ""}`}
    >
      <span className="font-medium text-[#f0b400]">Add your email</span>
      <span className="ml-2 text-white/70">
        You will not receive notifications about your agreements until you do.
      </span>{" "}
      <Link href="/profile" className="font-medium text-[#f0b400] underline hover:no-underline">
        Complete your profile
      </Link>
    </div>
  )
}
