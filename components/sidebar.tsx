"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  FileText,
  HelpCircle,
  FlaskConical,
  Pill,
  Menu,
  X,
  Sun,
  Moon,
  GraduationCap,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"

const menuItems = [
  { title: "Início", href: "/", icon: BookOpen },
  { title: "Resumos", href: "/resumos", icon: FileText },
  { title: "Casos Clínicos", href: "/casos-clinicos", icon: FlaskConical },
  { title: "Questões", href: "/questoes", icon: HelpCircle },
  { title: "Fármacos", href: "/farmacos", icon: Pill },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)

    async function getUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/login")
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-card/80 backdrop-blur-xl border-b border-border lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">Farmacologia</span>
        </Link>

        <div className="flex items-center gap-1">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-card/50 backdrop-blur-xl border-r border-border">
        
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="font-bold text-foreground">Farmacologia</h1>
              <p className="text-xs text-muted-foreground">Monitoria Clínica</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Menu
          </p>

          <ul className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm",
                      isActive
                        ? "bg-rose-500/20 text-rose-400 font-medium shadow-[0_0_10px_rgba(244,63,94,0.25)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-4">
          {mounted && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 rounded-xl h-10"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span className="text-sm">Modo claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span className="text-sm">Modo escuro</span>
                </>
              )}
            </Button>
          )}

          {user && (
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">
                Logado como:
              </p>

              <p className="text-sm font-semibold break-all text-foreground mb-3">
                {user.email}
              </p>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}