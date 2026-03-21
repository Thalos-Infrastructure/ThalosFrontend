"use client";

import { useStellarWallet } from "@/lib/stellar-wallet";
import { useAuthStore } from "@/lib/auth-store";

export function useCurrentAddress() {
  const { address: walletAddress } = useStellarWallet();
  const { user, token } = useAuthStore();

  const socialAddress = user?.wallet?.publicKey;

  // Con sesión JWT (Gmail, GitHub, email/contraseña): la wallet de la cuenta en auth_users
  // es la que debe mostrarse (A), aunque Freighter siga conectado en el navegador (B).
  if (token) {
    if (socialAddress) return socialAddress;
    return walletAddress ?? null;
  }

  // Sin sesión de la app: modo solo wallet (Freighter, etc.) — prioridad a la wallet conectada.
  return walletAddress || socialAddress || null;
}

