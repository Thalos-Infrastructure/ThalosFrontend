/**
 * Dashboard section + agreement detail navigation via URL query params.
 *
 * Keeps My Agreements → detail stable across refresh, share, and back.
 * Example: /dashboard/personal?section=agreements&agreementId=C...
 */
"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type DashboardNav = {
  activeSection: string
  viewingAgreement: string | null
  setActiveSection: (section: string) => void
  setViewingAgreement: (agreementId: string | null) => void
}

export function useDashboardNav(defaultSection = "home"): DashboardNav {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeSection = searchParams.get("section") || defaultSection
  const viewingAgreement = searchParams.get("agreementId")

  // router.replace does not update window.location synchronously, so back-to-back
  // calls in one handler (open agreement, then set section) must build on the
  // pending query string or the second call drops agreementId.
  const pendingQsRef = useRef<string | null>(null)
  const currentQs = searchParams.toString()
  useEffect(() => {
    pendingQsRef.current = null
  }, [currentQs])

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(pendingQsRef.current ?? currentQs)
      mutate(params)
      const qs = params.toString()
      pendingQsRef.current = qs
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, currentQs],
  )

  const setActiveSection = useCallback(
    (section: string) => {
      replaceParams((params) => {
        params.set("section", section)
        if (section !== "agreements") {
          params.delete("agreementId")
        }
      })
    },
    [replaceParams],
  )

  const setViewingAgreement = useCallback(
    (agreementId: string | null) => {
      replaceParams((params) => {
        params.set("section", "agreements")
        if (agreementId) {
          params.set("agreementId", agreementId)
        } else {
          params.delete("agreementId")
        }
      })
    },
    [replaceParams],
  )

  return useMemo(
    () => ({
      activeSection,
      viewingAgreement,
      setActiveSection,
      setViewingAgreement,
    }),
    [activeSection, viewingAgreement, setActiveSection, setViewingAgreement],
  )
}
