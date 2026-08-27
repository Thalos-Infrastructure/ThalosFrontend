"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"

import { usePollarWallet } from "@/lib/pollar-wallet"
import { dashboardPathFor } from "@/lib/dashboard-path"

/**
 * What a "Login" button should do: with a live Pollar session there is nothing
 * left to ask, so skip the modal and go straight to the dashboard.
 *
 * A hook because the app has four login entry points, each with its own modal
 * state; wiring this into one of them is how behaviour drifts apart.
 */
export function useLoginEntry(): {
  /** `openModal` is the caller's own fallback for when there's no session. */
  startLogin: (openModal: () => void) => void
  /** True while the session is being resumed; show a loader or disable the button. */
  resuming: boolean
} {
  const router = useRouter()
  const { hasSession, isConnecting, resume, clearError } = usePollarWallet()
  const [resuming, setResuming] = useState(false)

  const startLogin = useCallback(
    (openModal: () => void) => {
      // A login is already running — from a second click, or from another entry
      // point sharing the provider. Starting a second pipeline would mint a
      // second JWT and race the first over the same wallet.
      if (resuming || isConnecting) return

      if (!hasSession) {
        openModal()
        return
      }

      setResuming(true)
      let navigated = false
      void resume((_address, profile) => {
        navigated = true
        router.push(dashboardPathFor(profile))
      }).finally(() => {
        setResuming(false)
        // resume() reports failures through the provider's error state rather
        // than throwing, so a stale session would otherwise do nothing at all.
        if (!navigated) {
          // The modal IS the recovery, so don't also shout about the session
          // that failed to resume — the user is simply being asked to log in.
          clearError()
          openModal()
        }
      })
    },
    [hasSession, isConnecting, resuming, resume, router, clearError],
  )

  return { startLogin, resuming }
}
