import Image from "next/image"

export function ThalosLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <div
        style={{
          animation: "thalos-spin 2.5s cubic-bezier(0.37, 0, 0.63, 1) infinite",
          transformStyle: "preserve-3d",
          perspective: "800px",
        }}
      >
        <Image
          src="/thalos-icon.png"
          alt="Loading..."
          width={200}
          height={200}
          className="h-36 w-36 object-contain"
          priority
        />
      </div>
    </div>
  )
}
