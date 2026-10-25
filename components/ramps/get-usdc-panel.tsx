"use client"

/**
 * "Get USDC" inside the funding step.
 *
 * Someone who reaches an agreement awaiting funding with an empty wallet has
 * nowhere to go today: the only option is to fund, which fails. This is the
 * on-ramp entry point, shown next to it.
 *
 * It states the distinction the whole flow depends on — buying USDC puts it in
 * your wallet, funding moves it into the escrow — because conflating the two
 * is how someone ends up believing the agreement is funded when it is not.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUpRight, Loader2, Wallet } from "lucide-react"
import { LENDARA_AVAILABLE, shortfall, startLendaraOnramp } from "@/lib/ramps/lendara"

interface Props {
  agreementId: string
  /** Amount the agreement needs, as shown elsewhere in the UI. */
  amountUsdc: string
  /** Wallet balance; null while it is still loading or could not be read. */
  balanceUsdc: string | null
  /** Re-read the balance after USDC arrives. */
  onFunded?: () => void | Promise<void>
  className?: string
}

export function GetUsdcPanel({ agreementId, amountUsdc, balanceUsdc, onFunded, className }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [delivered, setDelivered] = useState(false)

  const missing = shortfall(balanceUsdc, amountUsdc)
  const balanceKnown = balanceUsdc !== null

  async function handleGetUsdc() {
    setBusy(true)
    setError(null)

    const result = await startLendaraOnramp({
      agreementId,
      amountUsdc: missing ? missing.toFixed(2) : amountUsdc,
    })

    setBusy(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    // The USDC is in the wallet. The escrow is still unfunded — that is the
    // next step, and the copy below says so.
    setDelivered(true)
    await onFunded?.()
  }

  return (
    <div className={cn("rounded-xl border border-white/10 bg-white/[0.03] p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Wallet className="h-4 w-4 text-[#f0b400]" />
            Need USDC?
          </p>

          <p className="mt-1 text-xs text-white/50">
            {balanceKnown ? (
              missing ? (
                <>
                  Your wallet holds {Number(balanceUsdc).toFixed(2)} USDC and this agreement needs{" "}
                  {amountUsdc}. You are {missing.toFixed(2)} short.
                </>
              ) : (
                <>Your wallet already holds enough USDC to fund this agreement.</>
              )
            ) : (
              <>Buy USDC with your local currency and have it sent to your wallet.</>
            )}
          </p>
        </div>

        <Button
          onClick={() => void handleGetUsdc()}
          disabled={busy}
          size="sm"
          className={cn(
            "shrink-0",
            missing
              ? "bg-[#f0b400] text-[#0c1220] hover:bg-[#e5ab00]"
              : "bg-white/10 text-white hover:bg-white/15",
          )}
        >
          {busy ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Opening…
            </>
          ) : (
            <>
              Get USDC
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>

      {/* The distinction the rest of the flow depends on. */}
      <p className="mt-3 border-t border-white/[0.06] pt-2 text-[11px] leading-relaxed text-white/35">
        Buying USDC puts it in your wallet. Funding this agreement then moves it into the escrow —
        they are two separate steps.
      </p>

      {delivered && (
        <p role="status" className="mt-2 text-xs text-emerald-400">
          USDC received. Fund the agreement to move it into the escrow.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-amber-400">{error}</p>}

      {!LENDARA_AVAILABLE && !error && (
        <p className="mt-2 text-[11px] text-white/30">
          Card payments are coming soon. For now you can deposit through an anchor from the Ramps
          section.
        </p>
      )}
    </div>
  )
}
