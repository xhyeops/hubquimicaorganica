"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { isAdminEmail } from "@/lib/admin"

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getUser()

      if (data.user?.email && isAdminEmail(data.user.email)) {
        setIsAdmin(true)
      }

      setChecking(false)
    }

    checkAdmin()
  }, [])

  if (checking) return null
  if (!isAdmin) return null

  return <>{children}</>
}