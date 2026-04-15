"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link")
      router.push("/")
    }
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password")
      }
      
      setSuccess(true)
      toast.success("Password reset successfully!")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/15 bg-[#0c1220]/95 p-8 backdrop-blur-2xl">
          {!success ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Create new password</h1>
              <p className="text-white/60 text-sm mb-8">
                Enter your new password below
              </p>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/40"
                    minLength={8}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/40"
                    minLength={8}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-11 rounded-xl bg-[#f0b400] text-black font-semibold hover:bg-[#f0b400]/90 mt-2"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Password Reset Complete</h2>
              <p className="text-white/60 text-sm mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link href="/">
                <Button className="h-11 rounded-xl bg-[#f0b400] text-black font-semibold hover:bg-[#f0b400]/90 w-full">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
