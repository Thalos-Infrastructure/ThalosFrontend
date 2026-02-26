import Image from "next/image"

export function ThalosLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <Image
        src="/thalos-logo.jpg"
        alt="Thalos"
        width={160}
        height={160}
        className="h-32 w-32 object-contain"
        priority
      />
    </div>
  )
}
