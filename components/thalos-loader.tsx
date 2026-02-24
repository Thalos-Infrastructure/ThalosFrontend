import Image from "next/image"

export function ThalosLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <Image
        src="/thalos-loading.gif"
        alt="Loading..."
        width={240}
        height={240}
        className="h-48 w-48 object-contain"
        priority
        unoptimized
      />
    </div>
  )
}
