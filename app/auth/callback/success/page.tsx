"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";

function getParams(): { token: string | null; next: string } {
  if (typeof window === "undefined") return { token: null, next: "/dashboard/personal" };
  const params = new URLSearchParams(window.location.search);
  return {
    token: params.get("token"),
    next: params.get("next") ?? "/dashboard/personal",
  };
}

export default function AuthCallbackSuccessPage() {
  const { login } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    const { token, next } = getParams();
    if (!token) {
      setStatus("error");
      window.location.href = "/?auth_error=missing_token";
      return;
    }
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        login(data.user, token);
        setStatus("done");
        window.location.replace(next);
      })
      .catch(() => {
        setStatus("error");
        window.location.href = "/?auth_error=callback_failed";
      });
  }, [login]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">
        {status === "loading" && "Signing you in…"}
        {status === "error" && "Something went wrong. Redirecting…"}
        {status === "done" && "Redirecting…"}
      </p>
    </div>
  );
}
