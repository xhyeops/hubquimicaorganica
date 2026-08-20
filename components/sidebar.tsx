"use client"

import Link from "next/link"
import {
  usePathname,
  useRouter,
} from "next/navigation"
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
  BarChart3,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useEffect,
  useState,
} from "react"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"
import { isAdminEmail } from "@/lib/admin"

const menuItems = [
  {
    title: "Início",
    subtitle: "Visão geral",
    href: "/",
    icon: BookOpen,
  },
  {
    title: "Resumos",
    subtitle: "Revisar conteúdos",
    href: "/resumos",
    icon: FileText,
  },
  {
    title: "Flashcards",
    subtitle: "Memorizar",
    href: "/flashcards",
    icon: Layers,
  },
  {
    title: "Questões",
    subtitle: "Praticar",
    href: "/questoes",
    icon: HelpCircle,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)

  const {
    theme,
    setTheme,
  } = useTheme()

  const [mounted, setMounted] =
    useState(false)

  const [user, setUser] =
    useState<any>(null)

  useEffect(() => {
    setMounted(true)

    async function getUser() {
      const { data } =
        await supabase.auth.getUser()

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

  function isItemActive(
    href: string
  ) {
    if (href === "/") {
      return pathname === "/"
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    )
  }

  function NavLinks() {
    return (
      <ul className="flex flex-col gap-1.5">
        {menuItems.map(
          (item) => {
            const Icon =
              item.icon

            const isActive =
              isItemActive(
                item.href
              )

            return (
              <li key={item.href}>

                <Link
                  href={item.href}
                  onClick={() =>
                    setIsOpen(false)
                  }
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-300",

                    isActive
                      ? "bg-sky-500/[0.08]"
                      : "hover:bg-muted/50"
                  )}
                >

                  {/* BARRA ATIVA */}
                  <div
                    className={cn(
                      "absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-400 transition-all duration-300",

                      isActive
                        ? "opacity-100 shadow-[0_0_10px_rgba(56,189,248,0.7)]"
                        : "opacity-0"
                    )}
                  />

                  {/* ÍCONE */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300",

                      isActive
                        ? "bg-sky-500/15 text-sky-400 shadow-sm shadow-sky-500/10"
                        : "bg-transparent text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  {/* TEXTO */}
                  <div className="min-w-0 flex-1">

                    <p
                      className={cn(
                        "text-sm font-medium transition-colors",

                        isActive
                          ? "text-sky-400"
                          : "text-foreground/80 group-hover:text-foreground"
                      )}
                    >
                      {item.title}
                    </p>

                    <p
                      className={cn(
                        "mt-0.5 text-[10px] transition-colors",

                        isActive
                          ? "text-sky-400/60"
                          : "text-muted-foreground/70"
                      )}
                    >
                      {item.subtitle}
                    </p>

                  </div>

                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-all duration-300",

                      isActive
                        ? "translate-x-0 text-sky-400"
                        : "-translate-x-1 text-muted-foreground/30 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    )}
                  />

                </Link>

              </li>
            )
          }
        )}
      </ul>
    )
  }

  function AdminNavigation() {
    if (
      !user?.email ||
      !isAdminEmail(user.email)
    ) {
      return null
    }

    const active =
      pathname === "/dashboard" ||
      pathname.startsWith(
        "/dashboard/"
      )

    return (
      <div className="mt-7">

        <div className="mb-2.5 flex items-center justify-between px-3">

          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
            Administração
          </p>

          <Sparkles className="h-3 w-3 text-sky-400/60" />

        </div>

        <Link
          href="/dashboard"
          onClick={() =>
            setIsOpen(false)
          }
          className={cn(
            "group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-300",

            active
              ? "bg-sky-500/[0.08]"
              : "hover:bg-muted/50"
          )}
        >

          <div
            className={cn(
              "absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-400 transition-all duration-300",

              active
                ? "opacity-100 shadow-[0_0_10px_rgba(56,189,248,0.7)]"
                : "opacity-0"
            )}
          />

          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition",

              active
                ? "bg-sky-500/15 text-sky-400"
                : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
            )}
          >
            <BarChart3 className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0 flex-1">

            <p
              className={cn(
                "text-sm font-medium",

                active
                  ? "text-sky-400"
                  : "text-foreground/80"
              )}
            >
              Dashboard
            </p>

            <p className="mt-0.5 text-[10px] text-muted-foreground/70">
              Analytics do hub
            </p>

          </div>

          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition",

              active
                ? "text-sky-400"
                : "text-muted-foreground/30 opacity-0 group-hover:opacity-100"
            )}
          />

        </Link>

      </div>
    )
  }

  function ThemeButton() {
    if (!mounted) return null

    const dark =
      theme === "dark"

    return (
      <button
        type="button"
        onClick={() =>
          setTheme(
            dark
              ? "light"
              : "dark"
          )
        }
        className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-muted/50"
      >

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition group-hover:text-sky-400">

          {dark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}

        </div>

        <div className="flex-1">

          <p className="text-xs font-medium text-foreground/85">
            {dark
              ? "Modo claro"
              : "Modo escuro"}
          </p>

          <p className="mt-0.5 text-[9px] text-muted-foreground/60">
            Alterar aparência
          </p>

        </div>

      </button>
    )
  }

  function FooterContent() {
    return (
      <div className="space-y-3">

        <ThemeButton />

        {user && (
          <div className="rounded-2xl border border-border/70 bg-background/35 p-3.5">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">

                <GraduationCap className="h-4 w-4" />

              </div>

              <div className="min-w-0 flex-1">

                <p className="text-[9px] text-muted-foreground/60">
                  Conta conectada
                </p>

                <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
                  {user.email}
                </p>

              </div>

            </div>

            <button
              onClick={
                handleLogout
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/15 bg-rose-500/[0.06] px-3 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />

              Sair
            </button>

          </div>
        )}

      </div>
    )
  }

  function Brand() {
    return (
      <Link
        href="/"
        className="group flex items-center gap-3"
        onClick={() =>
          setIsOpen(false)
        }
      >

        <div className="relative">

          <div className="absolute inset-0 rounded-2xl bg-sky-400/25 blur-lg opacity-60 transition group-hover:opacity-90" />

          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-sky-500/20">

            <Atom className="h-5 w-5 text-white" />

          </div>

        </div>

        <div className="min-w-0">

          <h1 className="truncate text-sm font-bold tracking-tight text-foreground">
            Química Orgânica
          </h1>

          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Monitoria Acadêmica
          </p>

        </div>

      </Link>
    )
  }

  return (
    <>
      {/* ===================================================== */}
      {/* HEADER MOBILE                                        */}
      {/* ===================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl lg:hidden">

        <Brand />

        <div className="flex items-center gap-1">

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() =>
                setTheme(
                  theme === "dark"
                    ? "light"
                    : "dark"
                )
              }
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
            className="h-9 w-9 rounded-xl"
            onClick={() =>
              setIsOpen(
                !isOpen
              )
            }
          >

            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}

          </Button>

        </div>

      </header>

      {/* ===================================================== */}
      {/* OVERLAY MOBILE                                       */}
      {/* ===================================================== */}

      <div
        onClick={() =>
          setIsOpen(false)
        }
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",

          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
      />

      {/* ===================================================== */}
      {/* SIDEBAR MOBILE                                       */}
      {/* ===================================================== */}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-14 z-50 flex w-[86vw] max-w-[310px] flex-col border-r border-border/70 bg-background/95 shadow-2xl shadow-black/20 backdrop-blur-2xl transition-all duration-300 ease-out lg:hidden",

          isOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"
        )}
      >

        <nav className="flex-1 overflow-y-auto px-3 py-5">

          <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
            Estudar
          </p>

          <NavLinks />

          <AdminNavigation />

        </nav>

        <div className="border-t border-border/70 bg-background/70 p-3 backdrop-blur-xl">

          <FooterContent />

        </div>

      </aside>

      {/* ===================================================== */}
      {/* SIDEBAR DESKTOP                                      */}
      {/* ===================================================== */}

      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col border-r border-border/70 bg-background/75 backdrop-blur-xl lg:flex">

        {/* MARCA */}

        <div className="border-b border-border/70 px-5 py-5">

          <Brand />

        </div>

        {/* NAVEGAÇÃO */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">

          <div className="mb-3 flex items-center justify-between px-3">

            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
              Estudar
            </p>

            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />

          </div>

          <NavLinks />

          <AdminNavigation />

        </nav>

        {/* RODAPÉ */}

        <div className="border-t border-border/70 bg-background/40 p-3">

          <FooterContent />

        </div>

      </aside>
    </>
  )
}
