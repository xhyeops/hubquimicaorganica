"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  FileText,
  HelpCircle,
  Menu,
  X,
  Sun,
  Moon,
  Atom,
  LogOut,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"

const menuItems = [
  { title: "Início", href: "/", icon: BookOpen },
  { title: "Resumos", href: "/resumos", icon: FileText },
  { title: "Flashcards", href: "/flashcards", icon: Layers },
  { title: "Questões", href: "/questoes", icon: HelpCircle },
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
    setIsOpen(false)
    router.push("/login")
  }

  function NavLinks() {
    return (
      <ul className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-sm",
                  isActive
                    ? "bg-sky-500/20 text-sky-400 font-semibold shadow-lg shadow-sky-500/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            </li>
          )
        })}
      </ul>
    )
  }

  function FooterContent() {
    return (
      <div className="space-y-4">
        {mounted && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 rounded-2xl h-11"
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
          <div className="rounded-2xl border border-border bg-background/50 p-3 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Logado como:</p>

            <p className="text-sm font-semibold break-all text-foreground mb-3">
              {user.email}
            </p>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-card/85 backdrop-blur-xl border-b border-border lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="chem-atom-spin chem-glow h-8 w-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Atom className="h-4 w-4 text-white" />
          </div>

          <span className="font-semibold text-foreground">
            Química Orgânica
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-background/55 backdrop-blur-sm transition-opacity duration-300 ease-out lg:hidden",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      />

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed top-14 left-0 bottom-0 z-50 w-[85vw] max-w-xs border-r border-border bg-card/95 backdrop-blur-2xl shadow-2xl shadow-sky-950/20 transition-all duration-300 ease-out lg:hidden",
          isOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"
        )}
      >
        <nav className="p-4">
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Menu
          </p>

          <NavLinks />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 bg-card/80 backdrop-blur-xl">
          <FooterContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-card/50 backdrop-blur-xl border-r border-border">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="chem-atom-spin chem-glow h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Atom className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="font-bold text-foreground">Química Orgânica</h1>
              <p className="text-xs text-muted-foreground">
                Monitoria Acadêmica
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Menu
          </p>

          <NavLinks />
        </nav>

        <div className="p-4 border-t border-border">
          <FooterContent />
        </div>
      </aside>
    </>
  )
}