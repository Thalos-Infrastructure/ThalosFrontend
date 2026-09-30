/**
 * Dashboard section + agreement detail navigation via URL query params.
 *
 * Keeps My Agreements → detail stable across refresh, share, and back.
 * Example: /dashboard/personal?section=agreements&agreementId=C...
 */
"use client"

import { useCallback, useMemo } from "react"
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

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
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
