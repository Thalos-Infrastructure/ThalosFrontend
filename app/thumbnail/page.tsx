export default function ThumbnailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-8 p-12">
        {/* Logo original sin alteraciones */}
        <img 
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/thalos%20logo-x1prCDO55MBzjsk4RfYIhSpwGs4u6c.png" 
          alt="Thalos Logo" 
          className="h-64 w-auto object-contain"
        />
        
        {/* Nombre */}
        <h1 className="text-5xl font-bold tracking-wider text-white">
          THALOS
        </h1>
        
        {/* Slogan */}
        <p className="text-xl font-light tracking-wide text-[#f0b400]">
          Programmable platform for digital agreements
        </p>
      </div>
    </div>
  )
}
