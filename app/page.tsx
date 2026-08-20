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
      const [resumosCount, flashcardsCount, questoesCount] =
        await Promise.all([
          supabase
            .from("resumos")
            .select("*", { count: "exact", head: true }),

          supabase
            .from("flashcards")
            .select("*", { count: "exact", head: true }),

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
          new Date(b.criado_em).getTime() -
          new Date(a.criado_em).getTime()
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10">

          {/* CABEÇALHO */}
          <section className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-sky-400 mb-1">
                  Hub de Estudos
                </p>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                  Bom dia! 👋
                </h1>

                <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                  Pronto para estudar Química Orgânica?
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 text-sky-400" />
                Monitoria de Química Orgânica
              </div>
            </div>
          </section>

          {/* DESTAQUE */}
          <section className="mb-7">
            <div className="relative overflow-hidden rounded-2xl border border-sky-500/15 bg-gradient-to-br from-sky-500/10 via-card to-cyan-500/5 p-5 sm:p-7">

              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

              <div className="absolute -bottom-20 right-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative max-w-3xl">

                <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400 mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  Comece por aqui
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  Continue seus estudos de{" "}
                  <span className="text-sky-400">
                    Química Orgânica
                  </span>
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
                  Revise os conteúdos da monitoria, pratique com flashcards
                  ou teste seus conhecimentos com questões.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 mt-5">

                  <Link
                    href="/flashcards"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/20"
                  >
                    <Play className="h-4 w-4" />
                    Começar a estudar
                  </Link>

                  <Link
                    href="/resumos"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-sky-500/40 hover:text-sky-400"
                  >
                    Ver conteúdos
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                </div>
              </div>
            </div>
          </section>

          {/* ACESSO RÁPIDO */}
          <section className="mb-7">

            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Acesso rápido
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground">
                  Escolha como você quer estudar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              {/* RESUMOS */}
              <Link
                href="/resumos"
                className="group rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10"
              >
                <div className="flex items-center justify-between mb-5">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 transition group-hover:scale-110 group-hover:bg-sky-500/20">
                    <FileText className="h-5 w-5" />
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-sky-400" />

                </div>

                <h3 className="font-semibold text-foreground group-hover:text-sky-400 transition">
                  Resumos
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Revise os principais conteúdos
                </p>

                <div className="mt-4 text-xs text-sky-400">
                  {counts.resumos} conteúdos disponíveis
                </div>
              </Link>

              {/* FLASHCARDS */}
              <Link
                href="/flashcards"
                className="group rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10"
              >
                <div className="flex items-center justify-between mb-5">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 transition group-hover:scale-110 group-hover:bg-sky-500/20">
                    <Layers className="h-5 w-5" />
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-sky-400" />

                </div>

                <h3 className="font-semibold text-foreground group-hover:text-sky-400 transition">
                  Flashcards
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Faça uma revisão rápida
                </p>

                <div className="mt-4 text-xs text-sky-400">
                  {counts.flashcards} cards disponíveis
                </div>
              </Link>

              {/* QUESTÕES */}
              <Link
                href="/questoes"
                className="group rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10"
              >
                <div className="flex items-center justify-between mb-5">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 transition group-hover:scale-110 group-hover:bg-sky-500/20">
                    <HelpCircle className="h-5 w-5" />
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-sky-400" />

                </div>

                <h3 className="font-semibold text-foreground group-hover:text-sky-400 transition">
                  Questões
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Teste seus conhecimentos
                </p>

                <div className="mt-4 text-xs text-sky-400">
                  {counts.questoes} temas disponíveis
                </div>
              </Link>

            </div>
          </section>

          {/* CONTEÚDOS RECENTES */}
          <section className="mb-7">

            <div className="flex items-end justify-between mb-3">

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Conteúdos recentes
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground">
                  Veja o que foi adicionado recentemente
                </p>
              </div>

              <span className="hidden sm:inline-flex rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
                Atualizações
              </span>

            </div>

            {feed.length === 0 ? (

              <div className="rounded-2xl border border-border bg-card p-7 text-center">

                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                  <Sparkles className="h-5 w-5" />
                </div>

                <p className="text-sm font-medium text-foreground">
                  Nenhum conteúdo novo ainda
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Os novos materiais aparecerão aqui.
                </p>

              </div>

            ) : (

              <div className="overflow-hidden rounded-2xl border border-border bg-card">

                {feed.map((item, index) => {

                  const Icon = item.icon

                  return (
                    <Link
                      key={`${item.tipo}-${item.id}`}
                      href={item.href}
                      className={`group flex items-center gap-3 sm:gap-4 p-4 transition-colors hover:bg-sky-500/[0.03] ${
                        index !== feed.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 transition group-hover:bg-sky-500/20">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2 mb-1">

                          {index === 0 && (
                            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                              NOVO
                            </span>
                          )}

                          <span className="text-[10px] font-medium uppercase tracking-wide text-sky-400">
                            {item.tipo}
                          </span>

                          {item.categoria && (
                            <>
                              <span className="text-muted-foreground">
                                ·
                              </span>

                              <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                {item.categoria}
                              </span>
                            </>
                          )}

                        </div>

                        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-sky-400 transition">
                          {item.titulo}
                        </h3>

                        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatarData(item.criado_em)}
                        </div>

                      </div>

                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-sky-400" />

                    </Link>
                  )
                })}

              </div>
            )}
          </section>

          {/* VISÃO GERAL */}
          <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

            {/* ESTATÍSTICAS */}
            <div className="rounded-2xl border border-border bg-card p-5">

              <div className="flex items-center gap-2 mb-5">

                <Layers className="h-4 w-4 text-sky-400" />

                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Seu hub de estudos
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Conteúdos disponíveis atualmente
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-3 gap-3">

                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="text-xl font-bold text-sky-400">
                    {counts.resumos}
                  </div>

                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Resumos
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="text-xl font-bold text-sky-400">
                    {counts.flashcards}
                  </div>

                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Flashcards
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="text-xl font-bold text-sky-400">
                    {counts.questoes}
                  </div>

                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Questões
                  </div>
                </div>

              </div>
            </div>

            {/* EQUIPE */}
            <div className="rounded-2xl border border-border bg-card p-5">

              <div className="flex items-center gap-2 mb-4 text-sky-400">
                <Users className="h-4 w-4" />

                <span className="text-sm font-semibold">
                  Equipe da monitoria
                </span>
              </div>

              <div className="space-y-3">

                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Monitores
                  </p>

                  <p className="text-sm font-medium text-foreground mt-0.5">
                    <span className="text-sky-400">
                      André Luiz
                    </span>{" "}
                    e{" "}
                    <span className="text-sky-400">
                      Ana Georgia
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Professor
                  </p>

                  <p className="text-sm font-medium text-foreground mt-0.5">
                    Felipe Ramon
                  </p>
                </div>

              </div>
            </div>

          </section>

        </div>
      </main>
    </div>
  )
}
