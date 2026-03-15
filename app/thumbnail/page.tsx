'use client'

import Image from 'next/image'
import { Playfair_Display } from 'next/font/google'
import { useRef } from 'react'
import { toPng } from 'html-to-image'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '500', '600']
})

export default function ThumbnailPage() {
  const thumbnailRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!thumbnailRef.current) return
    
    try {
      const dataUrl = await toPng(thumbnailRef.current, {
        quality: 1,
        pixelRatio: 2
      })
      
      const link = document.createElement('a')
      link.download = 'thalos-thumbnail.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error generating image:', error)
    }
  }

  return (
    <>
    {/* Download button */}
    <button
      onClick={handleDownload}
      className="fixed top-4 right-4 z-50 rounded-lg bg-[#f0b400] px-6 py-3 text-sm font-semibold text-black hover:bg-[#e5ab00] shadow-lg transition-all print:hidden"
    >
      Download PNG
    </button>
    
    <div ref={thumbnailRef} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Ocean sunset background */}
      <Image
        src="/ocean-sunset-bg.png"
        alt=""
        fill
        className="object-cover"
        priority
      />
      
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Thalos Logo */}
        <div className="mb-6">
          <img 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/thalos%20logo-x1prCDO55MBzjsk4RfYIhSpwGs4u6c.png" 
            alt="Thalos Logo" 
            className="h-80 w-auto object-contain drop-shadow-[0_0_50px_rgba(240,180,0,0.5)]"
          />
        </div>
        
        {/* Thalos name */}
        <h1 className={`${playfair.className} text-8xl font-semibold tracking-[0.15em] text-white drop-shadow-lg`}>
          THALOS
        </h1>
        
        {/* Slogan */}
        <p className={`${playfair.className} mt-4 text-3xl tracking-wide text-white/90`}>
          Programmable platform for digital agreements
        </p>
        
        {/* Decorative line */}
        <div className="mt-12 h-px w-96 bg-gradient-to-r from-transparent via-[#f0b400]/70 to-transparent" />
        
        {/* Built on section */}
        <div className="mt-8 flex items-center gap-8">
          {/* Stellar */}
          <div className="flex items-center gap-3">
            <span className={`${playfair.className} text-lg text-white/70`}>Built on</span>
            <Image
              src="/stellar-full.png"
              alt="Stellar"
              width={100}
              height={28}
              className="brightness-0 invert opacity-80"
            />
          </div>
          
          {/* Separator */}
          <span className="text-2xl text-[#f0b400]/50">|</span>
          
          {/* Trustless Work */}
          <div className="flex items-center gap-3">
            <span className={`${playfair.className} text-lg text-white/70`}>Powered by</span>
            <Image
              src="/trustless-logo.png"
              alt="Trustless Work"
              width={32}
              height={32}
              className="brightness-0 invert opacity-80"
            />
            <span className={`${playfair.className} text-lg text-white/80`}>Trustless Work</span>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
