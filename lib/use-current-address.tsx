"use client";

import { useStellarWallet } from "@/lib/stellar-wallet";
import { useAuthStore } from "@/lib/auth-store";

export function useCurrentAddress() {
  const { address: walletAddress } = useStellarWallet();
  const { user } = useAuthStore();

  const socialAddress = user?.wallet?.publicKey;

  return socialAddress || walletAddress || null;
}

