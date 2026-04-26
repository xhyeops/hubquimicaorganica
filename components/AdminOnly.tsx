"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { isAdminEmail } from "@/lib/admin"

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user?.email) {
        setIsAdmin(false)
        setChecking(false)
        return
      }

      setIsAdmin(isAdminEmail(data.user.email))
      setChecking(false)
    }

    checkAdmin()
  }, [])

  if (checking) return null
  if (!isAdmin) return null

  return <>{children}</>
}