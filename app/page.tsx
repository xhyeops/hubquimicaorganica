"use client"

import { trackEvent } from "@/lib/analytics"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import {
  FileText,
  HelpCircle,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  Clock,
  Play,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

type FeedItem = {
  id: string
  tipo: "Resumo" | "Flashcard" | "Questão"
  titulo: string
  categoria: string | null
  criado_em: string
  href: string
  icon: any
}

export default function HomePage() {
  const [counts, setCounts] = useState({
    resumos: 0,
    flashcards: 0,
    questoes: 0,
  })

  const [feed, setFeed] = useState<FeedItem[]>([])

  useEffect(() => {
    trackEvent({
      event_type: "page_view",
      page_path: "/",
      section: "home",
      title: "Página inicial",
    })

    async function fetchData() {
      const [resumosCount, flashcardsCount, questoesCount] = await Promise.all([
        supabase.from("resumos").select("*", { count: "exact", head: true }),
        supabase.from("flashcards").select("*", { count: "exact", head: true }),
        supabase
          .from("temas_questoes")
          .select("*", { count: "exact", head: true }),
      ])

      setCounts({
        resumos: resumosCount.count || 0,
        flashcards: flashcardsCount.count || 0,
        questoes: questoesCount.count || 0,
      })

      const [resumos, flashcards, temasQuestoes] = await Promise.all([
        supabase
          .from("resumos")
          .select("id, titulo, slug, categoria, criado_em")
          .order("criado_em", { ascending: false })
          .limit(5),

        supabase
          .from("flashcards")
          .select("id, pergunta, categoria, criado_em")
          .order("criado_em", { ascending: false })
          .limit(5),

        supabase
          .from("temas_questoes")
          .select("id, titulo, slug, descricao, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      const feedItems: FeedItem[] = [
        ...(resumos.data || []).map((item: any) => ({
          id: item.id,
          tipo: "Resumo" as const,
          titulo: item.titulo,
          categoria: item.categoria,
          criado_em: item.criado_em,
          href: item.slug ? `/resumos/${item.slug}` : "/resumos",
          icon: FileText,
        })),

        ...(flashcards.data || []).map((item: any) => ({
          id: item.id,
          tipo: "Flashcard" as const,
          titulo: item.pergunta,
          categoria: item.categoria,
          criado_em: item.criado_em,
          href: "/flashcards",
          icon: Layers,
        })),

        ...(temasQuestoes.data || []).map((item: any) => ({
          id: item.id,
          tipo: "Questão" as const,
          titulo: item.titulo,
          categoria: item.descricao,
          criado_em: item.created_at,
          href: item.slug ? `/questoes/${item.slug}` : "/questoes",
          icon: HelpCircle,
        })),
      ]

      feedItems.sort(
        (a, b) =>
          new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      )

      setFeed(feedItems.slice(0, 8))
    }

    fetchData()
  }, [])

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:py-16">
          <section className="mb-7 sm:mb-10 rounded-[1.5rem] sm:rounded-[2rem] border border-sky-500/10 bg-gradient-to-br from-sky-500/10 via-card to-cyan-500/5 p-5 sm:p-8 shadow-lg sm:shadow-xl shadow-sky-500/5">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 sm:mb-5 rounded-full bg-sky-500/10 text-sky-400 text-xs sm:text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Hub de Estudos
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4 leading-tight">
              Monitoria de{" "}
              <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                Química Orgânica
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Acompanhe as novidades da monitoria e acesse os materiais pelo
              menu lateral.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-5 sm:mt-6">
              <Link
                href="/flashcards"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/20"
              >
                <Play className="h-4 w-4" />
                Começar pelos flashcards
              </Link>

              <Link
                href="/resumos"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/20 bg-background/40 px-4 py-2.5 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:border-sky-500/50 hover:text-sky-400"
              >
                Ver resumos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="mb-7 sm:mb-10">
            <div className="flex items-end justify-between mb-3 sm:mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Novas adições
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Últimos conteúdos adicionados ao hub
                </p>
              </div>

              <span className="hidden sm:inline-flex rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
                Atualizações recentes
              </span>
            </div>

            {feed.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma atualização cadastrada ainda.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {feed.map((item, index) => {
                  const Icon = item.icon

                  return (
                    <Link
                      key={`${item.tipo}-${item.id}`}
                      href={item.href}
                      className="group relative flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/10"
                    >
                      <div className="absolute left-0 top-5 bottom-5 w-1 rounded-r-full bg-sky-500/0 transition group-hover:bg-sky-400" />

                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-sky-500/10 text-sky-400 transition group-hover:scale-110 group-hover:bg-sky-500/20">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {index === 0 && (
                              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] sm:text-xs font-medium text-cyan-400">
                                Novo
                              </span>
                            )}

                            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] sm:text-xs font-medium text-sky-400">
                              {item.tipo}
                            </span>

                            {item.categoria && (
                              <span className="line-clamp-1 text-[11px] sm:text-xs text-muted-foreground">
                                {item.categoria}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2 group-hover:text-sky-400 transition">
                            {item.titulo}
                          </h3>

                          <div className="mt-2 flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {formatarData(item.criado_em)}
                          </div>
                        </div>
                      </div>

                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-sky-400" />
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-7 sm:mb-10">
            {[
              {
                label: "Resumos",
                value: counts.resumos,
                href: "/resumos",
                icon: FileText,
              },
              {
                label: "Flashcards",
                value: counts.flashcards,
                href: "/flashcards",
                icon: Layers,
              },
              {
                label: "Temas de questões",
                value: counts.questoes,
                href: "/questoes",
                icon: HelpCircle,
              },
            ].map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-2xl bg-card border border-border p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-sky-400">
                        {item.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.label}
                      </div>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 transition group-hover:scale-110 group-hover:bg-sky-500/20">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </section>

          <section className="rounded-2xl bg-card border border-border p-4 sm:p-5 transition hover:border-sky-500/20">
            <div className="flex items-center gap-2 mb-3 text-sky-400">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Equipe da monitoria</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Monitores:{" "}
              <span className="text-sky-400 font-semibold">André Luiz</span> e{" "}
              <span className="text-sky-400 font-semibold">Ana Georgia</span>
            </p>

            <p className="text-sm text-muted-foreground mt-1">
              Professor:{" "}
              <span className="text-foreground font-medium">
                Felipe Ramon
              </span>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}