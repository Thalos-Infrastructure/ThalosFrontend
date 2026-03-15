"use client";

import { useEffect } from "react";
import { useStellarWallet } from "@/lib/stellar-wallet";
import { useAuthStore } from "@/lib/auth-store";

export function useCurrentAddress() {
  const { address: walletAddress } = useStellarWallet();
  const { user, hydrate, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  const socialAddress = user?.wallet?.publicKey;

  return socialAddress || walletAddress || null;
}

