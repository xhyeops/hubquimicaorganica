"use client"

import { trackEvent } from "@/lib/analytics"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import {
  ArrowRight,
  BookOpen,
  Clock,
  FileText,
  HelpCircle,
  Layers,
  Play,
  Sparkles,
  Target,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

type FeedItem = {
  id: string
  tipo: "Resumo" | "Flashcard" | "Questão"
  titulo: string
  categoria: string | null
  criado_em: string
  href: string
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
              .limit(6),

            supabase
              .from("flashcards")
              .select("id, pergunta, categoria, criado_em")
              .order("criado_em", { ascending: false })
              .limit(4),

            supabase
              .from("temas_questoes")
              .select("id, titulo, slug, descricao, created_at")
              .order("created_at", { ascending: false })
              .limit(4),
          ])

        const feedItems: FeedItem[] = [
          ...(resumos.data || []).map((item: any) => ({
            id: item.id,
            tipo: "Resumo" as const,
            titulo: item.titulo,
            categoria: item.categoria,
            criado_em: item.criado_em,
            href: item.slug ? `/resumos/${item.slug}` : "/resumos",
          })),

          ...(flashcards.data || []).map((item: any) => ({
            id: item.id,
            tipo: "Flashcard" as const,
            titulo: item.pergunta,
            categoria: item.categoria,
            criado_em: item.criado_em,
            href: "/flashcards",
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
          })),
        ]

        feedItems.sort(
          (a, b) =>
            new Date(b.criado_em).getTime() -
            new Date(a.criado_em).getTime()
        )

        setFeed(feedItems.slice(0, 5))
      } catch (error) {
        console.error("Erro ao carregar página inicial:", error)
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
    })
  }

  const destaque = feed[0]

  const totalConteudos =
    counts.resumos +
    counts.flashcards +
    counts.questoes

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

          {/* TOPO */}
          <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />

                <span className="text-xs font-semibold text-sky-400">
                  Monitoria Acadêmica
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Química Orgânica
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Revisar · Memorizar · Praticar
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:inline-flex">
                {totalConteudos} conteúdos disponíveis
              </span>

              <Link
                href="/flashcards"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-400 hover:shadow-sky-500/30"
              >
                <Play className="h-3.5 w-3.5" />
                Estudar agora
              </Link>
            </div>
          </header>

          {/* DESTAQUE PRINCIPAL */}
          <section className="mb-7">
            <div className="group relative overflow-hidden rounded-[1.75rem] border border-sky-500/20 bg-card">

              {/* efeitos de fundo */}
              <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl transition duration-700 group-hover:bg-sky-500/20" />

              <div className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 lg:block">
                <div className="relative h-52 w-52">
                  <div className="absolute left-6 top-8 h-32 w-24 rotate-[-9deg] rounded-3xl border border-sky-400/20 bg-sky-500/10 shadow-2xl shadow-sky-500/10 transition duration-500 group-hover:-translate-x-2 group-hover:-rotate-12" />

                  <div className="absolute left-20 top-2 h-36 w-28 rotate-[8deg] rounded-3xl border border-cyan-400/20 bg-cyan-400/10 shadow-2xl shadow-cyan-500/10 transition duration-500 group-hover:translate-x-2 group-hover:rotate-12" />

                  <div className="absolute left-14 top-10 flex h-36 w-28 items-center justify-center rounded-3xl border border-sky-400/30 bg-background/80 shadow-2xl backdrop-blur">
                    <Sparkles className="h-10 w-10 text-sky-400" />
                  </div>
                </div>
              </div>

              <div className="relative p-6 sm:p-8 lg:min-h-[285px] lg:p-9">

                {loading ? (
                  <div className="max-w-2xl space-y-4">
                    <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
                    <div className="h-10 w-2/3 animate-pulse rounded-xl bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-11 w-36 animate-pulse rounded-xl bg-muted" />
                  </div>
                ) : destaque ? (
                  <div className="max-w-2xl">

                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[11px] font-semibold text-sky-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      Destaque
                    </div>

                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
                      {destaque.tipo}
                    </p>

                    <h2 className="max-w-xl text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                      {destaque.titulo}
                    </h2>

                    {destaque.categoria && (
                      <p className="mt-3 line-clamp-1 max-w-xl text-sm text-muted-foreground">
                        {destaque.categoria}
                      </p>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={destaque.href}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:bg-sky-400"
                      >
                        Continuar
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                      <Link
                        href="/questoes"
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-4 py-2.5 text-xs font-semibold text-foreground backdrop-blur transition hover:border-sky-500/40 hover:text-sky-400"
                      >
                        <Target className="h-4 w-4" />
                        Praticar
                      </Link>
                    </div>

                  </div>
                ) : (
                  <div className="max-w-xl">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
                      <BookOpen className="h-6 w-6" />
                    </div>

                    <h2 className="text-2xl font-bold text-foreground">
                      Seu espaço de estudos
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Os conteúdos adicionados à monitoria aparecerão aqui.
                    </p>
                  </div>
                )}

              </div>
            </div>
          </section>

          {/* MODOS DE ESTUDO */}
          <section className="mb-8">

            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  O que você quer fazer?
                </h2>
              </div>

              <span className="hidden text-xs text-muted-foreground sm:block">
                Escolha um modo de estudo
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">

              {/* RESUMOS */}
              <Link
                href="/resumos"
                className="group relative min-h-[210px] overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 transition duration-300 hover:-translate-y-1.5 hover:border-sky-500/40 hover:shadow-2xl hover:shadow-sky-500/10"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/10 blur-2xl transition group-hover:bg-sky-500/20" />

                <div className="relative flex h-full flex-col justify-between">

                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 transition duration-300 group-hover:scale-110 group-hover:bg-sky-500/20">
                      <BookOpen className="h-6 w-6" />
                    </div>

                    <ArrowRight className="h-5 w-5 text-muted-foreground transition duration-300 group-hover:translate-x-1 group-hover:text-sky-400" />
                  </div>

                  <div className="mt-8">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400">
                      Revisar
                    </span>

                    <h3 className="mt-1 text-2xl font-bold text-foreground">
                      Resumos
                    </h3>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-2xl font-bold text-sky-400">
                        {counts.resumos}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        materiais
                      </span>
                    </div>
                  </div>

                </div>
              </Link>

              {/* FLASHCARDS */}
              <Link
                href="/flashcards"
                className="group relative min-h-[210px] overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 transition duration-300 hover:-translate-y-1.5 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl transition group-hover:bg-cyan-500/20" />

                <div className="absolute right-5 top-16 opacity-20 transition duration-500 group-hover:rotate-6 group-hover:scale-105 group-hover:opacity-30">
                  <div className="relative h-20 w-24">
                    <div className="absolute left-0 top-2 h-16 w-16 rotate-[-8deg] rounded-xl border border-cyan-400 bg-cyan-500/10" />
                    <div className="absolute left-5 top-0 h-16 w-16 rotate-[7deg] rounded-xl border border-cyan-400 bg-cyan-500/10" />
                  </div>
                </div>

                <div className="relative flex h-full flex-col justify-between">

                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 transition duration-300 group-hover:scale-110 group-hover:bg-cyan-500/20">
                      <Layers className="h-6 w-6" />
                    </div>

                    <ArrowRight className="h-5 w-5 text-muted-foreground transition duration-300 group-hover:translate-x-1 group-hover:text-cyan-400" />
                  </div>

                  <div className="mt-8">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
                      Memorizar
                    </span>

                    <h3 className="mt-1 text-2xl font-bold text-foreground">
                      Flashcards
                    </h3>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-2xl font-bold text-cyan-400">
                        {counts.flashcards}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        cards
                      </span>
                    </div>
                  </div>

                </div>
              </Link>

              {/* QUESTÕES */}
              <Link
                href="/questoes"
                className="group relative min-h-[210px] overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 transition duration-300 hover:-translate-y-1.5 hover:border-sky-500/40 hover:shadow-2xl hover:shadow-sky-500/10"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/10 blur-2xl transition group-hover:bg-sky-500/20" />

                <div className="absolute right-8 top-16 opacity-15 transition duration-500 group-hover:scale-110 group-hover:opacity-30">
                  <Target className="h-20 w-20 text-sky-400" />
                </div>

                <div className="relative flex h-full flex-col justify-between">

                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 transition duration-300 group-hover:scale-110 group-hover:bg-sky-500/20">
                      <Target className="h-6 w-6" />
                    </div>

                    <ArrowRight className="h-5 w-5 text-muted-foreground transition duration-300 group-hover:translate-x-1 group-hover:text-sky-400" />
                  </div>

                  <div className="mt-8">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400">
                      Praticar
                    </span>

                    <h3 className="mt-1 text-2xl font-bold text-foreground">
                      Questões
                    </h3>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-2xl font-bold text-sky-400">
                        {counts.questoes}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        temas
                      </span>
                    </div>
                  </div>

                </div>
              </Link>

            </div>
          </section>

          {/* PARTE INFERIOR */}
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">

            {/* NOVIDADES */}
            <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card">

              <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Novidades
                  </h2>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Adicionados recentemente
                  </p>
                </div>

                <Sparkles className="h-4 w-4 text-sky-400" />
              </div>

              {loading ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="flex animate-pulse items-center gap-4"
                    >
                      <div className="h-10 w-10 rounded-xl bg-muted" />

                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 rounded bg-muted" />
                        <div className="h-4 w-1/2 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : feed.length === 0 ? (
                <div className="p-10 text-center">
                  <Sparkles className="mx-auto mb-3 h-6 w-6 text-sky-400" />

                  <p className="text-sm text-muted-foreground">
                    Nenhuma novidade por enquanto.
                  </p>
                </div>
              ) : (
                <div>
                  {feed.map((item, index) => (
                    <Link
                      key={`${item.tipo}-${item.id}`}
                      href={item.href}
                      className={`group flex items-center gap-4 px-5 py-4 transition hover:bg-sky-500/[0.035] sm:px-6 ${
                        index !== feed.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >

                      <div className="w-11 shrink-0 text-center">
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">
                          {formatarData(item.criado_em)}
                        </p>
                      </div>

                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          item.tipo === "Resumo"
                            ? "bg-sky-500/10 text-sky-400"
                            : item.tipo === "Flashcard"
                              ? "bg-cyan-500/10 text-cyan-400"
                              : "bg-sky-500/10 text-sky-400"
                        }`}
                      >
                        {item.tipo === "Resumo" && (
                          <FileText className="h-4 w-4" />
                        )}

                        {item.tipo === "Flashcard" && (
                          <Layers className="h-4 w-4" />
                        )}

                        {item.tipo === "Questão" && (
                          <HelpCircle className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-400">
                          {item.tipo}
                        </p>

                        <h3 className="truncate text-sm font-medium text-foreground transition group-hover:text-sky-400">
                          {item.titulo}
                        </h3>
                      </div>

                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-sky-400" />

                    </Link>
                  ))}
                </div>
              )}

            </div>

            {/* CARD LATERAL */}
            <div className="relative overflow-hidden rounded-[1.5rem] border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-card to-card p-5">

              <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />

              <div className="relative">

                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400">
                  Estude do seu jeito
                </p>

                <h2 className="mt-2 text-xl font-bold leading-tight text-foreground">
                  Revise e pratique no mesmo lugar.
                </h2>

                <div className="mt-6 space-y-3">

                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />

                    <span className="text-xs text-muted-foreground">
                      {counts.resumos} resumos para revisão
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />

                    <span className="text-xs text-muted-foreground">
                      {counts.flashcards} flashcards disponíveis
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />

                    <span className="text-xs text-muted-foreground">
                      {counts.questoes} temas de questões
                    </span>
                  </div>

                </div>

                <Link
                  href="/questoes"
                  className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-sky-400 transition hover:gap-3"
                >
                  Começar uma atividade
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

              </div>
            </div>

          </section>

          {/* RODAPÉ DISCRETO */}
          <footer className="mt-8 flex items-center justify-center gap-2 pb-2 text-[10px] text-muted-foreground">
            <div className="h-1 w-1 rounded-full bg-sky-400" />
            Monitoria de Química Orgânica
          </footer>

        </div>
      </main>
    </div>
  )
}
