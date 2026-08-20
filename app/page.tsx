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
  BookOpen,
  ChevronRight,
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

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackEvent({
      event_type: "page_view",
      page_path: "/",
      section: "home",
      title: "Página inicial",
    })

    async function fetchData() {
      try {
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

        const [resumos, flashcards, temasQuestoes] =
          await Promise.all([
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
              .select(
                "id, titulo, slug, descricao, created_at"
              )
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
            href: item.slug
              ? `/resumos/${item.slug}`
              : "/resumos",
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
            href: item.slug
              ? `/questoes/${item.slug}`
              : "/questoes",
            icon: HelpCircle,
          })),
        ]

        feedItems.sort(
          (a, b) =>
            new Date(b.criado_em).getTime() -
            new Date(a.criado_em).getTime()
        )

        setFeed(feedItems.slice(0, 8))
      } finally {
        setLoading(false)
      }
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

  function formatarHora(data: string) {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
    })
  }

  const destaque = feed[0]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

          {/* ===================================================== */}
          {/* HEADER DO DASHBOARD                                   */}
          {/* ===================================================== */}

          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-2 w-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />

                <span className="text-xs font-medium text-sky-400">
                  Monitoria Acadêmica
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Química Orgânica
              </h1>

              <p className="text-sm text-muted-foreground mt-1">
                Central de estudos e materiais da monitoria
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/resumos"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition hover:border-sky-500/30 hover:text-sky-400"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Biblioteca
              </Link>

              <Link
                href="/flashcards"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/20"
              >
                <Play className="h-3.5 w-3.5" />
                Estudar
              </Link>
            </div>

          </header>

          {/* ===================================================== */}
          {/* DASHBOARD PRINCIPAL                                   */}
          {/* ===================================================== */}

          <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5 mb-6">

            {/* ------------------------------------------------- */}
            {/* DESTAQUE / PRÓXIMO ESTUDO                         */}
            {/* ------------------------------------------------- */}

            <div className="relative overflow-hidden rounded-2xl border border-border bg-card">

              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.07] via-transparent to-cyan-500/[0.04]" />

              <div className="relative p-5 sm:p-6 lg:p-7">

                <div className="flex items-center justify-between mb-6">

                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                      <Sparkles className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Próximo estudo
                      </p>

                      <p className="text-[11px] text-muted-foreground">
                        Continue de onde parou
                      </p>
                    </div>
                  </div>

                  {destaque && (
                    <span className="hidden sm:inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-medium text-sky-400">
                      Conteúdo recente
                    </span>
                  )}

                </div>

                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                ) : destaque ? (

                  <div>

                    <div className="flex items-center gap-2 mb-3">

                      <span className="rounded-md bg-sky-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-400">
                        {destaque.tipo}
                      </span>

                      {destaque.categoria && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {destaque.categoria}
                        </span>
                      )}

                    </div>

                    <h2 className="max-w-2xl text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground leading-tight">
                      {destaque.titulo}
                    </h2>

                    <p className="mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
                      Este é o conteúdo mais recente adicionado à
                      monitoria. Acesse o material e continue seus
                      estudos.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2.5 mt-5">

                      <Link
                        href={destaque.href}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sky-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/20"
                      >
                        Acessar conteúdo
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      <Link
                        href="/questoes"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/30 px-4 py-2.5 text-xs font-medium text-foreground transition hover:border-sky-500/30 hover:text-sky-400"
                      >
                        Praticar questões
                      </Link>

                    </div>

                  </div>

                ) : (

                  <div className="py-3">

                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                      Comece seus estudos
                    </h2>

                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                      Ainda não existem conteúdos cadastrados.
                      Quando novos materiais forem adicionados,
                      eles aparecerão aqui.
                    </p>

                    <Link
                      href="/resumos"
                      className="inline-flex items-center gap-2 mt-5 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sky-600"
                    >
                      Ver materiais
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                  </div>

                )}

              </div>
            </div>

            {/* ------------------------------------------------- */}
            {/* ESTATÍSTICAS                                      */}
            {/* ------------------------------------------------- */}

            <div className="rounded-2xl border border-border bg-card p-5">

              <div className="flex items-center justify-between mb-5">

                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Visão geral
                  </h2>

                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Conteúdos disponíveis
                  </p>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                  <Layers className="h-4 w-4" />
                </div>

              </div>

              <div className="space-y-2.5">

                <Link
                  href="/resumos"
                  className="group flex items-center justify-between rounded-xl border border-border bg-background/30 p-3 transition hover:border-sky-500/30 hover:bg-sky-500/[0.03]"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Resumos
                      </p>

                      <p className="text-[10px] text-muted-foreground">
                        Materiais de revisão
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                    <span className="text-lg font-bold text-sky-400">
                      {counts.resumos}
                    </span>

                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-sky-400" />

                  </div>

                </Link>

                <Link
                  href="/flashcards"
                  className="group flex items-center justify-between rounded-xl border border-border bg-background/30 p-3 transition hover:border-sky-500/30 hover:bg-sky-500/[0.03]"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                      <Layers className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Flashcards
                      </p>

                      <p className="text-[10px] text-muted-foreground">
                        Revisão rápida
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                    <span className="text-lg font-bold text-sky-400">
                      {counts.flashcards}
                    </span>

                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-sky-400" />

                  </div>

                </Link>

                <Link
                  href="/questoes"
                  className="group flex items-center justify-between rounded-xl border border-border bg-background/30 p-3 transition hover:border-sky-500/30 hover:bg-sky-500/[0.03]"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                      <HelpCircle className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Questões
                      </p>

                      <p className="text-[10px] text-muted-foreground">
                        Teste seus conhecimentos
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                    <span className="text-lg font-bold text-sky-400">
                      {counts.questoes}
                    </span>

                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-sky-400" />

                  </div>

                </Link>

              </div>

            </div>

          </section>

          {/* ===================================================== */}
          {/* PARTE INFERIOR                                       */}
          {/* ===================================================== */}

          <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5">

            {/* ------------------------------------------------- */}
            {/* CONTEÚDOS RECENTES                                */}
            {/* ------------------------------------------------- */}

            <div className="rounded-2xl border border-border bg-card overflow-hidden">

              <div className="flex items-center justify-between px-5 py-4 border-b border-border">

                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Últimas adições
                  </h2>

                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Conteúdos adicionados recentemente
                  </p>
                </div>

                <span className="hidden sm:inline-flex rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-medium text-sky-400">
                  Recentes
                </span>

              </div>

              {loading ? (

                <div className="p-5 space-y-3">

                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3"
                    >
                      <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />

                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                      </div>
                    </div>
                  ))}

                </div>

              ) : feed.length === 0 ? (

                <div className="px-5 py-10 text-center">

                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <p className="text-sm font-medium text-foreground">
                    Nenhum conteúdo adicionado
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Os novos materiais aparecerão nesta área.
                  </p>

                </div>

              ) : (

                <div>

                  {feed.map((item, index) => {

                    const Icon = item.icon

                    return (
                      <Link
                        key={`${item.tipo}-${item.id}`}
                        href={item.href}
                        className={`group flex items-center gap-3 px-5 py-3.5 transition hover:bg-sky-500/[0.03] ${
                          index !== feed.length - 1
                            ? "border-b border-border"
                            : ""
                        }`}
                      >

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 transition group-hover:bg-sky-500/20">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-2 mb-0.5">

                            {index === 0 && (
                              <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-400">
                                NOVO
                              </span>
                            )}

                            <span className="text-[10px] font-medium uppercase tracking-wide text-sky-400">
                              {item.tipo}
                            </span>

                            {item.categoria && (
                              <>
                                <span className="text-[10px] text-muted-foreground">
                                  •
                                </span>

                                <span className="truncate text-[10px] text-muted-foreground max-w-[180px]">
                                  {item.categoria}
                                </span>
                              </>
                            )}

                          </div>

                          <h3 className="truncate text-xs sm:text-sm font-medium text-foreground transition group-hover:text-sky-400">
                            {item.titulo}
                          </h3>

                        </div>

                        <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatarData(item.criado_em)}
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-sky-400" />

                      </Link>
                    )
                  })}

                </div>

              )}

            </div>

            {/* ------------------------------------------------- */}
            {/* ACESSO RÁPIDO                                     */}
            {/* ------------------------------------------------- */}

            <div className="rounded-2xl border border-border bg-card p-5">

              <div className="flex items-center justify-between mb-5">

                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Acesso rápido
                  </h2>

                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Comece uma atividade
                  </p>
                </div>

                <Sparkles className="h-4 w-4 text-sky-400" />

              </div>

              <div className="space-y-2">

                <Link
                  href="/resumos"
                  className="group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-sky-500/30 hover:bg-sky-500/[0.03]"
                >

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <BookOpen className="h-4 w-4" />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground group-hover:text-sky-400 transition">
                      Explorar resumos
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      Consulte os materiais
                    </p>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-sky-400" />

                </Link>

                <Link
                  href="/flashcards"
                  className="group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-sky-500/30 hover:bg-sky-500/[0.03]"
                >

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <Layers className="h-4 w-4" />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground group-hover:text-sky-400 transition">
                      Revisar flashcards
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      Pratique rapidamente
                    </p>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-sky-400" />

                </Link>

                <Link
                  href="/questoes"
                  className="group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-sky-500/30 hover:bg-sky-500/[0.03]"
                >

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <HelpCircle className="h-4 w-4" />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground group-hover:text-sky-400 transition">
                      Resolver questões
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      Teste seus conhecimentos
                    </p>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-sky-400" />

                </Link>

              </div>

              {/* EQUIPE */}

              <div className="mt-5 pt-4 border-t border-border">

                <div className="flex items-center gap-2 mb-3">

                  <Users className="h-3.5 w-3.5 text-sky-400" />

                  <span className="text-[11px] font-semibold text-foreground">
                    Equipe da monitoria
                  </span>

                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Monitores:{" "}
                  <span className="font-medium text-sky-400">
                    André Luiz
                  </span>{" "}
                  e{" "}
                  <span className="font-medium text-sky-400">
                    Ana Georgia
                  </span>
                </p>

                <p className="text-[11px] text-muted-foreground mt-1">
                  Professor:{" "}
                  <span className="font-medium text-foreground">
                    Felipe Ramon
                  </span>
                </p>

              </div>

            </div>

          </section>

          {/* ===================================================== */}
          {/* RODAPÉ                                               */}
          {/* ===================================================== */}

          <div className="flex items-center justify-center gap-2 mt-7 text-[10px] text-muted-foreground">
            <div className="h-1 w-1 rounded-full bg-sky-400" />
            Hub de Estudos · Monitoria de Química Orgânica
          </div>

        </div>
      </main>
    </div>
  )
}
