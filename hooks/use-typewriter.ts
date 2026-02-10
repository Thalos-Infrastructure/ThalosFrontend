"use client"

import { useState, useEffect, useCallback } from "react"

export function useTypewriter(text: string, isVisible: boolean, options?: { typeSpeed?: number; deleteSpeed?: number; pauseBeforeDelete?: number; pauseBeforeType?: number }) {
  const { typeSpeed = 140, deleteSpeed = 70, pauseBeforeDelete = 2200, pauseBeforeType = 600 } = options ?? {}
  const [displayed, setDisplayed] = useState("")
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting" | "wait">("wait")

  const tick = useCallback(() => {
    if (!isVisible) return

    if (phase === "wait") {
      setPhase("typing")
      return
    }

    if (phase === "typing") {
      if (displayed.length < text.length) {
        setDisplayed(text.slice(0, displayed.length + 1))
      } else {
        setPhase("pause")
      }
      return
    }

    if (phase === "deleting") {
      if (displayed.length > 0) {
        setDisplayed(text.slice(0, displayed.length - 1))
      } else {
        setPhase("wait")
      }
      return
    }
  }, [displayed, phase, text, isVisible])

  useEffect(() => {
    if (!isVisible) {
      setDisplayed("")
      setPhase("wait")
      return
    }

    let delay = typeSpeed
    if (phase === "pause") delay = pauseBeforeDelete
    if (phase === "deleting") delay = deleteSpeed
    if (phase === "wait") delay = pauseBeforeType

    const timer = setTimeout(() => {
      if (phase === "pause") {
        setPhase("deleting")
      } else {
        tick()
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [displayed, phase, isVisible, tick, typeSpeed, deleteSpeed, pauseBeforeDelete, pauseBeforeType])

  return { displayed, isTyping: phase === "typing" || phase === "deleting" }
}
