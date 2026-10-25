"use client"

/**
 * "Get USDC" inside the funding step.
 *
 * Someone who reaches an agreement awaiting funding with an empty wallet has
 * nowhere to go: the only action is Fund, which fails. This is the on-ramp
 * entry point, shown next to it.
 *
 * It states the distinction the whole flow depends on — buying USDC puts it in
 * your wallet, funding moves it into the escrow — because conflating the two
 * is how someone ends up believing the agreement is funded when it is not.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ArrowUpRight, Loader2, Wallet } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import {
  FIAT_CURRENCIES,
  shortfall,
  startLendaraOnramp,
  type FiatCurrency,
} from "@/lib/ramps/lendara"

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

/** What each status means while the deposit is in flight. */
const STATUS_COPY: Record<string, string> = {
  incomplete: "Waiting for your payment…",
  pending_user_transfer_start: "Waiting for your payment…",
  pending_user_transfer_complete: "Payment received, sending the USDC…",
  pending_external: "Your bank is processing the payment…",
  pending_anchor: "Lendara is processing the deposit…",
  pending_stellar: "Sending the USDC to your wallet…",
  pending_trust: "Your wallet needs a USDC trustline to receive this…",
  completed: "USDC delivered. Verifying…",
}

export function GetUsdcPanel({ agreementId, amountUsdc, balanceUsdc, onFunded, className }: Props) {
  const { token } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [delivered, setDelivered] = useState(false)

  const [currency, setCurrency] = useState<FiatCurrency>("ARS")
  const [amount, setAmount] = useState("")

  const missing = shortfall(balanceUsdc, amountUsdc)
  const balanceKnown = balanceUsdc !== null

  async function handleGetUsdc() {
    if (!amount.trim()) {
      setError("Enter how much you want to spend")
      return
    }

    setBusy(true)
    setError(null)
    setNotice(null)
    setStatus(null)

    const result = await startLendaraOnramp({
      agreementId,
      fiatCurrency: currency,
      amount: amount.trim(),
      token,
      onStatus: (s) => setStatus(STATUS_COPY[s] ?? null),
    })

    setBusy(false)
    setStatus(null)

    if (!result.success) {
      // Closing the widget is a decision, not a failure to report.
      if (!result.cancelled) setError(result.error)
      return
    }

    setDelivered(true)
    setOpen(false)

    // The money arrived — but in sandbox it may be Lendara's own USDC, which
    // the escrow will not accept. Saying only "funds received" here is what
    // would send someone to a Fund button that cannot work.
    if (!result.data.usableForEscrow) {
      setNotice(
        "The USDC arrived, but it was issued by a different provider than the one these escrows use, so it cannot fund this agreement yet.",
      )
    }

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
          onClick={() => (open ? void handleGetUsdc() : setOpen(true))}
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

      {open && !delivered && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-white/35">Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as FiatCurrency)}
              disabled={busy}
              className="h-9 rounded-lg border border-white/15 bg-[#0a0d14] px-2 text-sm text-white focus:border-[#f0b400]/50 focus:outline-none"
            >
              {FIAT_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[8rem] flex-1 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-white/35">
              Amount to spend
            </span>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="25000"
              disabled={busy}
              className="h-9 border-white/15 bg-[#0a0d14] text-white placeholder:text-white/25"
            />
          </label>
        </div>
      )}

      {/* The amount is charged in local currency, and we hold no exchange
          rate, so the shortfall is shown as context rather than prefilled. */}
      {open && !delivered && missing && (
        <p className="mt-2 text-[11px] text-white/35">
          You need about {missing.toFixed(2)} USDC more. Lendara will show the rate before you pay.
        </p>
      )}

      {status && <p className="mt-2 text-xs text-sky-300">{status}</p>}

      {/* The distinction the rest of the flow depends on. */}
      <p className="mt-3 border-t border-white/[0.06] pt-2 text-[11px] leading-relaxed text-white/35">
        Buying USDC puts it in your wallet. Funding this agreement then moves it into the escrow —
        they are two separate steps.
      </p>

      {delivered && !notice && (
        <p role="status" className="mt-2 text-xs text-emerald-400">
          USDC received. Fund the agreement to move it into the escrow.
        </p>
      )}

      {notice && (
        <p role="status" className="mt-2 text-xs text-amber-400">
          {notice}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  )
}
