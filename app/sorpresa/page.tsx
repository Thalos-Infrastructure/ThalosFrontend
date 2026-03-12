"use client"

import { useEffect, useState } from "react"

export default function SorpresaPage() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <div
        className={`text-center transition-all duration-1000 ${
          show ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
      >
        <h1
          className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 animate-pulse"
          style={{
            textShadow: "0 0 80px rgba(255,0,0,0.5)",
          }}
        >
          SORPRESA
        </h1>
        <h1
          className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 animate-pulse mt-4"
          style={{
            textShadow: "0 0 80px rgba(255,0,0,0.5)",
          }}
        >
          SORPRESA
        </h1>
        <div className="mt-12 text-2xl md:text-4xl text-white/60 font-mono">
          you have been scammed PAPU!!
        </div>
        <div className="mt-8 text-6xl animate-bounce">
          🎉
        </div>
      </div>

      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.1),transparent_70%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>
    </div>
  )
}
