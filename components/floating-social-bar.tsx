"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Mail, Github } from "lucide-react"

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

export function FloatingSocialBar() {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show after scrolling down 300px
      if (currentScrollY > 300) {
        if (currentScrollY > lastScrollY || currentScrollY > 500) {
          setIsVisible(true)
        }
      } else {
        setIsVisible(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // Fade out when not hovered (to not cover content), fade in on hover
  const displayOpacity = isVisible ? (isHovered ? 1 : 0.15) : 0

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-2 transition-all duration-300",
        isVisible ? "translate-x-0" : "translate-x-8 pointer-events-none"
      )}
      style={{ opacity: displayOpacity }}
    >
      {/* Title - fixed like Platform, Resources */}
      <div className="mb-2 rounded-lg bg-[#0a0a0c]/70 backdrop-blur-xl px-3 py-2 border border-white/10">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#f0b400] whitespace-nowrap">Get in Touch</p>
      </div>
      
      {/* Social icons */}
      <div className="flex flex-col gap-2 rounded-2xl bg-[#0a0a0c]/70 backdrop-blur-xl p-2 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <a 
          href="mailto:thalosinfrastructure@gmail.com" 
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-[#f0b400]/15 hover:text-[#f0b400]"
          aria-label="Email"
        >
          <Mail className="h-4 w-4" />
        </a>
        <a 
          href="https://x.com/Thalos_infra" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-[#f0b400]/15 hover:text-[#f0b400]"
          aria-label="X (Twitter)"
        >
          <XIcon className="h-4 w-4" />
        </a>
        <a 
          href="https://www.instagram.com/thalos_platform/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-[#f0b400]/15 hover:text-[#f0b400]"
          aria-label="Instagram"
        >
          <InstagramIcon className="h-4 w-4" />
        </a>
        <a 
          href="https://github.com/Thalos-Infrastructure" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-[#f0b400]/15 hover:text-[#f0b400]"
          aria-label="GitHub"
        >
          <Github className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
