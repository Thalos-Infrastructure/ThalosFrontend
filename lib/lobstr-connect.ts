/**
 * LOBSTR vía WalletConnect (SignClient + modal propio de QR).
 * No usamos @walletconnect/qrcode-modal porque su carga del registro de wallets
 * puede devolver listings null y provocar "Cannot convert undefined or null to object".
 * Requiere NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (cloud.walletconnect.com).
 */

import { SignClient } from "@walletconnect/sign-client"

/** Modal mínimo: solo QR + copiar + cerrar (evita el bug de Object.values en qrcode-modal). */
function openLobstrModal(uri: string): () => void {
  if (typeof document === "undefined") return () => {}
  const overlay = document.createElement("div")
  overlay.setAttribute("aria-modal", "true")
  overlay.setAttribute("role", "dialog")
  overlay.setAttribute("data-lobstr-modal", "1")
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:system-ui,sans-serif;"
  const box = document.createElement("div")
  box.style.cssText =
    "background:#fff;border-radius:12px;padding:24px;max-width:320px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);"
  const title = document.createElement("p")
  title.textContent = "Escanear con LOBSTR"
  title.style.cssText = "margin:0 0 16px;font-size:18px;font-weight:600;color:#111;"
  const qrSize = 256
  const qrImg = document.createElement("img")
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(uri)}`
  qrImg.alt = "QR para LOBSTR"
  qrImg.style.cssText = "display:block;width:100%;max-width:256px;height:auto;margin:0 auto 16px;"
  const copyBtn = document.createElement("button")
  copyBtn.textContent = "Copiar enlace"
  copyBtn.style.cssText =
    "display:block;width:100%;margin:0 0 8px;padding:10px 16px;border:1px solid #ccc;border-radius:8px;background:#f5f5f5;cursor:pointer;font-size:14px;"
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(uri).then(() => { copyBtn.textContent = "Copiado" })
  }
  const closeBtn = document.createElement("button")
  closeBtn.textContent = "Cerrar"
  closeBtn.style.cssText =
    "display:block;width:100%;padding:10px 16px;border:none;border-radius:8px;background:#111;color:#fff;cursor:pointer;font-size:14px;"
  const close = () => {
    overlay.remove()
  }
  closeBtn.onclick = close
  box.append(title, qrImg, copyBtn, closeBtn)
  overlay.appendChild(box)
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close() })
  document.body.appendChild(overlay)
  return close
}

const STELLAR_PUBNET = "stellar:pubnet"
const STELLAR_TESTNET = "stellar:testnet"
const METHOD_SIGN = "stellar_signXDR"

let client: SignClient | null = null
let session: { topic: string; accounts: { publicKey: string; network: string }[] } | null = null

export async function connectLobstr(): Promise<
  { address: string } | { error: string }
> {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  if (!projectId) {
    return {
      error: "Configura NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (cloud.walletconnect.com).",
    }
  }
  try {
    if (!client) {
      client = await SignClient.init({
        projectId,
        metadata: {
          name: "Thalos",
          description: "Escrow infrastructure on Stellar",
          url: typeof window !== "undefined" ? window.location.origin : "",
          icons: ["https://stellar.org/favicon.ico"].filter(Boolean),
        },
      })
    }
    const requiredNamespaces = {
      stellar: {
        methods: [METHOD_SIGN, "stellar_signAndSubmitXDR"],
        chains: [STELLAR_PUBNET, STELLAR_TESTNET],
        events: [] as string[],
      },
    }
    const { uri, approval } = await client.connect({
      requiredNamespaces,
    })
    const closeModal = uri ? openLobstrModal(uri) : () => {}
    const s = await approval()
    closeModal()
    const namespaces = s?.namespaces
    const stellarNs = namespaces && typeof namespaces === "object" ? namespaces.stellar : undefined
    const accountsRaw = Array.isArray(stellarNs?.accounts) ? stellarNs.accounts : []
    const accounts = accountsRaw.map((acc: string) => {
      const parts = String(acc).split(":")
      const network = parts[1] ?? "pubnet"
      const publicKey = parts[2] ?? acc
      return { network, publicKey }
    })
    if (!accounts.length) return { error: "No se aprobaron cuentas." }
    const topic = s?.topic
    if (!topic) return { error: "Sesión inválida." }
    session = { topic, accounts }
    return { address: accounts[0].publicKey }
  } catch (e) {
    if (typeof document !== "undefined") document.querySelector("[data-lobstr-modal]")?.remove()
    const msg = e instanceof Error ? e.message : "Error al conectar LOBSTR."
    return { error: msg }
  }
}

function passphraseToChain(p: string): string {
  if (p.includes("Public Global Stellar Network")) return STELLAR_PUBNET
  return STELLAR_TESTNET
}

export async function signWithLobstr(
  xdr: string,
  networkPassphrase: string,
  _publicKey: string
): Promise<{ signedTxXdr: string } | null> {
  if (!client || !session) return null
  try {
    const chainId = passphraseToChain(networkPassphrase)
    const result = await client.request({
      topic: session.topic,
      chainId,
      request: {
        method: METHOD_SIGN,
        params: { xdr },
      },
    })
    const signedXDR = typeof result === "string" ? result : (result as { signedXDR?: string })?.signedXDR
    return signedXDR ? { signedTxXdr: signedXDR } : null
  } catch {
    return null
  }
}
