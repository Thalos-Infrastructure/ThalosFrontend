import Image from 'next/image'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '500', '600']
})

export default function ThumbnailPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
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
        <div className="mb-4">
          <img 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/thalos%20logo-x1prCDO55MBzjsk4RfYIhSpwGs4u6c.png" 
            alt="Thalos Logo" 
            className="h-52 w-auto object-contain drop-shadow-[0_0_40px_rgba(240,180,0,0.4)]"
          />
        </div>
        
        {/* Thalos name */}
        <h1 className={`${playfair.className} text-6xl font-semibold tracking-[0.15em] text-white drop-shadow-lg`}>
          THALOS
        </h1>
        
        {/* Slogan */}
        <p className={`${playfair.className} mt-3 text-xl tracking-wide text-white/90`}>
          Programmable platform for digital agreements
        </p>
        
        {/* Decorative line */}
        <div className="mt-10 h-px w-64 bg-gradient-to-r from-transparent via-[#f0b400]/70 to-transparent" />
        
        {/* Built on section */}
        <div className="mt-6 flex items-center gap-5">
          {/* Stellar */}
          <div className="flex items-center gap-2">
            <span className={`${playfair.className} text-sm text-white/70`}>Built on</span>
            <Image
              src="/stellar-full.png"
              alt="Stellar"
              width={70}
              height={20}
              className="brightness-0 invert opacity-80"
            />
          </div>
          
          {/* Separator */}
          <span className="text-[#f0b400]/50">|</span>
          
          {/* Trustless Work */}
          <div className="flex items-center gap-2">
            <span className={`${playfair.className} text-sm text-white/70`}>Powered by</span>
            <Image
              src="/trustless-logo.png"
              alt="Trustless Work"
              width={24}
              height={24}
              className="brightness-0 invert opacity-80"
            />
            <span className={`${playfair.className} text-sm text-white/80`}>Trustless Work</span>
          </div>
        </div>
      </div>
    </div>
  )
}
