"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  variant?: "up" | "left" | "scale"
  delay?: number
  threshold?: number
}

export function ScrollReveal({
  children,
  className,
  variant = "up",
  delay = 0,
  threshold = 0.08,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  const variantClass =
    variant === "left"
      ? "section-reveal-left"
      : variant === "scale"
        ? "section-reveal-scale"
        : "section-reveal"

  return (
    <div
      ref={ref}
      className={cn(variantClass, isVisible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
