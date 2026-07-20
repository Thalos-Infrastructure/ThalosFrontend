"use client"

import { useState } from "react"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { SHOW_SIGN_MESSAGE_TEST } from "@/lib/config"

export function TestSignMessage() {
  const { signMessage, address, openWalletModal } = useStellarWallet()
  const [result, setResult] = useState<string>("")

  // Dev-only widget: hidden unless explicitly enabled. Guard runs after the hooks
  // above so React's rules-of-hooks stay satisfied.
  if (!SHOW_SIGN_MESSAGE_TEST) return null

  const handleSign = async () => {
    if (!address) {
      await openWalletModal()
      return
    }
    try {
      const res = await signMessage("Hello Thalos!")
      if (res) {
        setResult(`Success! Signed by: ${res.signerAddress.substring(0, 6)}...\nSig: ${res.signedMessage.substring(0, 20)}...`)
      } else {
        setResult("User rejected or failed")
      }
    } catch (e: any) {
      setResult(`Error: ${e.message}`)
    }
  }

  return (
    <div className="fixed bottom-24 right-4 p-4 bg-background border border-border/50 rounded-lg z-[100] text-xs shadow-xl backdrop-blur-md">
      <p className="mb-2 font-bold text-foreground">SignMessage Test (Dev)</p>
      <button 
        onClick={handleSign}
        className="px-3 py-1.5 bg-primary text-primary-foreground font-medium rounded hover:opacity-90 transition-opacity"
      >
        Sign "Hello Thalos!"
      </button>
      {result && <pre className="mt-2 p-2 bg-muted text-muted-foreground rounded overflow-auto max-w-[250px] whitespace-pre-wrap break-all">{result}</pre>}
    </div>
  )
}
