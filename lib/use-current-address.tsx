"use client";

import { useStellarWallet } from "@/lib/stellar-wallet";
import { useAuthStore } from "@/lib/auth-store";

export function useCurrentAddress() {
  const { address: walletAddress } = useStellarWallet();
  const { user, token } = useAuthStore();

  const socialAddress = user?.wallet?.publicKey;

  // PRIORIDAD: Si Freighter (u otra wallet externa) está conectada, usarla siempre.
  // Esto permite que usuarios con sesión JWT puedan conectar su propia wallet
  // para ver sus acuerdos reales en lugar de los de la wallet custodial.
  if (walletAddress) {
    return walletAddress;
  }

  // Si no hay wallet externa conectada pero hay sesión JWT, usar la wallet custodial.
  if (token && socialAddress) {
    return socialAddress;
  }

  // Fallback
  return null;
}

/**
 * Hook adicional para saber qué tipo de wallet está activa
 */
export function useWalletType(): "external" | "custodial" | null {
  const { address: walletAddress } = useStellarWallet();
  const { user, token } = useAuthStore();
  
  if (walletAddress) return "external";
  if (token && user?.wallet?.publicKey) return "custodial";
  return null;
}

