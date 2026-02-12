import Image from "next/image"

export function ThalosLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <div
        style={{
          animation: "thalos-spin 3s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
      >
        <Image
          src="/thalos-icon.png"
          alt="Loading..."
          width={300}
          height={300}
          className="h-52 w-52 object-contain"
          priority
        />
      </div>
    </div>
  )
}
