"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAuthStore } from "@/lib/auth-store";
import { useStellarWallet } from "@/lib/stellar-wallet";
import { updateProfile } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";

/**
 * Tras login (OAuth, email o wallet) el usuario elige Personal o Enterprise
 * antes de entrar al dashboard.
 */
export default function SelectProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, hydrated } = useAuthStore();
  const { address: stellarAddress, refreshProfile } = useStellarWallet();
  const [busy, setBusy] = useState(false);

  // For JWT-only users (no Freighter), use custodial wallet from auth store
  const walletAddress = stellarAddress ?? user?.wallet?.publicKey ?? null;

  const goHome = useCallback(() => {
    router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    const tmr = setTimeout(() => {
      if (!user && !walletAddress) goHome();
    }, 400);
    return () => clearTimeout(tmr);
  }, [hydrated, user, walletAddress, goHome]);

  const handleSelect = async (type: "personal" | "business") => {
    const href = type === "personal" ? "/dashboard/personal" : "/dashboard/business";

    if (walletAddress) {
      setBusy(true);
      try {
        const accountType = type === "enterprise" ? "enterprise" : "personal";
        const { error } = await updateProfile(walletAddress, { account_type: accountType });
        if (error) console.warn("updateProfile:", error);
        if (refreshProfile) await refreshProfile();
      } finally {
        setBusy(false);
      }
    }

    router.push(href);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!user && !walletAddress) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#f0b400]">
            {t("auth.getStarted")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("auth.profileType")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("auth.chooseProfile")}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            disabled={busy}
            onClick={() => handleSelect("personal")}
            className={cn(
              "h-auto min-h-[88px] flex-col gap-2 rounded-xl border border-border/30 bg-secondary/40 py-6 text-base font-semibold",
              "hover:border-[#f0b400]/40 hover:bg-[#f0b400]/10"
            )}
            variant="outline"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {t("auth.personalRetail")}
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => handleSelect("business")}
            className={cn(
              "h-auto min-h-[88px] flex-col gap-2 rounded-xl border border-border/30 bg-secondary/40 py-6 text-base font-semibold",
              "hover:border-[#f0b400]/40 hover:bg-[#f0b400]/10"
            )}
            variant="outline"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
            {t("auth.businessEnterprise")}
          </Button>
        </div>
      </div>
    </div>
  );
}
