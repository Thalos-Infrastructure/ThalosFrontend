import Image from "next/image"

export function ThalosLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <Image
        src="/thalos-logo-new.png"
        alt="Thalos"
        width={160}
        height={160}
        className="h-32 w-32 object-contain animate-[thalos-spin_2.5s_ease-in-out_infinite]"
        priority
      />
    </div>
  )
}
