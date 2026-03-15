import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '600', '700']
})

export default function ThumbnailPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Ocean background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/ocean-bg.png)' }}
      />
      
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-12">
        {/* Logo original sin alteraciones - PNG con fondo transparente */}
        <img 
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/thalos%20logo-x1prCDO55MBzjsk4RfYIhSpwGs4u6c.png" 
          alt="Thalos Logo" 
          className="h-72 w-auto object-contain drop-shadow-[0_0_30px_rgba(240,180,0,0.3)]"
        />
        
        {/* Nombre con fuente elegante */}
        <h1 className={`${playfair.className} text-6xl font-semibold tracking-[0.2em] text-white drop-shadow-lg`}>
          THALOS
        </h1>
        
        {/* Linea decorativa */}
        <div className="h-px w-48 bg-gradient-to-r from-transparent via-[#f0b400] to-transparent" />
        
        {/* Slogan con fuente elegante */}
        <p className={`${playfair.className} text-xl font-normal tracking-wide text-[#f0b400] italic`}>
          Programmable platform for digital agreements
        </p>
      </div>
    </div>
  )
}
