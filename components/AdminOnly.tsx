"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { isAdminEmail } from "@/lib/admin"

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const { data, error } = await supabase.auth.getUser()

      // Não logado → manda pro login
      if (error || !data.user?.email) {
        router.push("/login")
        return
      }

      // Verifica se é admin
      const admin = isAdminEmail(data.user.email)

      // Não é admin → manda pra home
      if (!admin) {
        router.push("/")
        return
      }

      // OK
      setIsAdmin(true)
      setChecking(false)
    }

    checkAdmin()
  }, [router])

  // Loading (evita tela branca)
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Verificando acesso...
      </div>
    )
  }

  // Segurança extra (caso algo falhe)
  if (!isAdmin) return null

  return <>{children}</>
}