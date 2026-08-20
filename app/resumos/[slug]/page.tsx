"use client"

import { trackEvent } from "@/lib/analytics"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  List,
  Pencil,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { supabase } from "@/lib/supabase"

type Resumo = {
  id: string
  slug: string
  titulo: string
  description?: string | null
  categoria?: string | null
  conteudo?: string | null
}

type Etapa = {
  titulo: string
  conteudo: string
}

function separarConteudoEmEtapas(conteudo: string): Etapa[] {
  if (!conteudo?.trim()) return []

  const linhas = conteudo.split("\n")
  const etapas: Etapa[] = []

  let tituloAtual = ""
  let conteudoAtual: string[] = []

  const salvarEtapa = () => {
    const texto = conteudoAtual.join("\n").trim()

    if (tituloAtual || texto) {
      etapas.push({
        titulo: tituloAtual || "Introdução",
        conteudo: texto,
      })
    }
  }

  for (const linha of linhas) {
    const match = linha.match(/^##\s+(.+)$/)

    if (match) {
      salvarEtapa()

      tituloAtual = match[1].trim()
      conteudoAtual = []
    } else {
      conteudoAtual.push(linha)
    }
  }

  salvarEtapa()

  /*
   * Se existir um pequeno conteúdo antes do primeiro ##
   * e depois existirem outras etapas, mantemos esse
   * conteúdo como introdução.
   */
  return etapas.filter(
    (etapa) => etapa.titulo.trim() || etapa.conteudo.trim()
  )
}

export default function ResumoDetailPage() {
  const params = useParams()

  const slug = Array.isArray(params.slug)
    ? params.slug[0]
    : params.slug

  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)

  const [etapaAtual, setEtapaAtual] = useState(0)
  const [menuEtapasAberto, setMenuEtapasAberto] = useState(false)

  const startTimeRef = useRef<number>(Date.now())
  const etapasVisitadasRef = useRef<Set<number>>(new Set())

  /*
   * ============================================================
   * CARREGAR RESUMO
   * ============================================================
   */

  useEffect(() => {
    async function carregarResumo() {
      if (!slug) return

      setLoading(true)

      const { data, error } = await supabase
        .from("resumos")
        .select("*")
        .eq("slug", slug)
        .single()

      if (error || !data) {
        console.error("Erro ao carregar resumo:", error)

        setResumo(null)
        setLoading(false)

        return
      }

      setResumo(data)

      setEtapaAtual(0)

      startTimeRef.current = Date.now()
      etapasVisitadasRef.current = new Set()

      setLoading(false)
    }

    carregarResumo()
  }, [slug])

  /*
   * ============================================================
   * SEPARAR MARKDOWN EM ETAPAS
   * ============================================================
   */

  const etapas = useMemo(() => {
    if (!resumo?.conteudo) return []

    return separarConteudoEmEtapas(resumo.conteudo)
  }, [resumo])

  const etapa = etapas[etapaAtual]

  const totalEtapas = etapas.length

  const progresso =
    totalEtapas > 0
      ? Math.round(((etapaAtual + 1) / totalEtapas) * 100)
      : 0

  /*
   * ============================================================
   * VISUALIZAÇÃO DO RESUMO
   * ============================================================
   */

  useEffect(() => {
    if (!resumo) return

    trackEvent({
      event_type: "resumo_view",

      page_path: `/resumos/${resumo.slug}`,

      section: "resumos",

      slug: resumo.slug,

      title: resumo.titulo,

      content_id: resumo.id,

      content_type: "resumo",

      metadata: {
        categoria: resumo.categoria || "Geral",
        descricao: resumo.description || null,
      },
    })
  }, [resumo])

  /*
   * ============================================================
   * ANALYTICS DA ETAPA
   * ============================================================
   */

  useEffect(() => {
    if (!resumo || !etapa || totalEtapas === 0) return

    const numeroEtapa = etapaAtual + 1

    if (etapasVisitadasRef.current.has(numeroEtapa)) {
      return
    }

    etapasVisitadasRef.current.add(numeroEtapa)

    const durationSeconds = Math.max(
      0,
      Math.round(
        (Date.now() - startTimeRef.current) / 1000
      )
    )

    trackEvent({
      event_type: "resumo_step_view",

      page_path: `/resumos/${resumo.slug}`,

      section: "resumos",

      slug: resumo.slug,

      title: resumo.titulo,

      content_id: resumo.id,

      content_type: "resumo",

      value: numeroEtapa,

      duration_seconds: durationSeconds,

      metadata: {
        categoria: resumo.categoria || "Geral",

        etapa: numeroEtapa,

        titulo_etapa: etapa.titulo,

        total_etapas: totalEtapas,

        progresso,
      },
    })

    /*
     * Também registramos conclusão quando
     * o aluno chega à última etapa.
     */
    if (numeroEtapa === totalEtapas) {
      trackEvent({
        event_type: "resumo_complete",

        page_path: `/resumos/${resumo.slug}`,

        section: "resumos",

        slug: resumo.slug,

        title: resumo.titulo,

        content_id: resumo.id,

        content_type: "resumo",

        value: 100,

        duration_seconds: durationSeconds,

        metadata: {
          categoria: resumo.categoria || "Geral",
          total_etapas: totalEtapas,
        },
      })
    }
  }, [
    resumo,
    etapa,
    etapaAtual,
    totalEtapas,
    progresso,
  ])

  /*
   * ============================================================
   * SAÍDA DO RESUMO
   * ============================================================
   */

  useEffect(() => {
    if (!resumo) return

    const registrarSaida = () => {
      const durationSeconds = Math.max(
        0,
        Math.round(
          (Date.now() - startTimeRef.current) / 1000
        )
      )

      const maiorEtapa = Math.max(
        0,
        ...Array.from(etapasVisitadasRef.current)
      )

      const progressoMaximo =
        totalEtapas > 0
          ? Math.round(
              (maiorEtapa / totalEtapas) * 100
            )
          : 0

      trackEvent({
        event_type: "resumo_exit",

        page_path: `/resumos/${resumo.slug}`,

        section: "resumos",

        slug: resumo.slug,

        title: resumo.titulo,

        content_id: resumo.id,

        content_type: "resumo",

        value: progressoMaximo,

        duration_seconds: durationSeconds,

        metadata: {
          categoria: resumo.categoria || "Geral",

          etapa_maxima: maiorEtapa,

          total_etapas: totalEtapas,

          progresso_maximo: progressoMaximo,
        },
      })
    }

    window.addEventListener(
      "pagehide",
      registrarSaida
    )

    return () => {
      window.removeEventListener(
        "pagehide",
        registrarSaida
      )
    }
  }, [resumo, totalEtapas])

  /*
   * ============================================================
   * NAVEGAÇÃO
   * ============================================================
   */

  function irParaEtapa(index: number) {
    if (index < 0 || index >= totalEtapas) return

    setEtapaAtual(index)
    setMenuEtapasAberto(false)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  function proximaEtapa() {
    if (etapaAtual >= totalEtapas - 1) return

    irParaEtapa(etapaAtual + 1)
  }

  function etapaAnterior() {
    if (etapaAtual <= 0) return

    irParaEtapa(etapaAtual - 1)
  }

  /*
   * ============================================================
   * CARREGANDO
   * ============================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="pt-14 lg:pl-64 lg:pt-0">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500/20 border-t-sky-500" />

              <p className="text-sm text-muted-foreground">
                Carregando resumo...
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  /*
   * ============================================================
   * NÃO ENCONTRADO
   * ============================================================
   */

  if (!resumo) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="pt-14 lg:pl-64 lg:pt-0">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
              href="/resumos"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-sky-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Resumos
            </Link>

            <div className="rounded-3xl border border-border bg-card p-10 text-center">
              <FileText className="mx-auto mb-4 h-8 w-8 text-sky-400" />

              <p className="font-medium text-foreground">
                Resumo não encontrado.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  /*
   * ============================================================
   * PÁGINA
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pt-14 lg:pl-64 lg:pt-0">

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

          {/* ================================================ */}
          {/* TOPO */}
          {/* ================================================ */}

          <div className="mb-6 flex items-center justify-between gap-4">

            <Link
              href="/resumos"
              className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-sky-400"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card transition group-hover:border-sky-500/30 group-hover:bg-sky-500/10">
                <ArrowLeft className="h-4 w-4" />
              </div>

              <span className="hidden sm:inline">
                Resumos
              </span>
            </Link>

            <AdminOnly>
              <Link
                href={`/admin/editar-resumo/${resumo.slug}`}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-400"
              >
                <Pencil size={15} />
                Editar
              </Link>
            </AdminOnly>

          </div>

          {/* ================================================ */}
          {/* CABEÇALHO DO CONTEÚDO */}
          {/* ================================================ */}

          <header className="mb-7">

            <div className="mb-4 flex flex-wrap items-center gap-2">

              {resumo.categoria && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-500">
                  <BookOpen className="h-3.5 w-3.5" />
                  {resumo.categoria}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />

                {totalEtapas}{" "}
                {totalEtapas === 1
                  ? "etapa"
                  : "etapas"}
              </span>

            </div>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

              <div className="max-w-4xl">

                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {resumo.titulo}
                </h1>

                {resumo.description && (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {resumo.description}
                  </p>
                )}

              </div>

              {totalEtapas > 0 && (
                <div className="shrink-0 text-left lg:text-right">

                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Progresso
                  </p>

                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {progresso}%
                  </p>

                </div>
              )}

            </div>

          </header>

          {/* ================================================ */}
          {/* PROGRESSO */}
          {/* ================================================ */}

          {totalEtapas > 0 && (
            <section className="mb-6 rounded-2xl border border-border bg-card/60 px-4 py-4 sm:px-5">

              <div className="mb-3 flex items-center justify-between gap-4">

                <div>
                  <p className="text-xs text-muted-foreground">
                    Etapa atual
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {etapaAtual + 1} de {totalEtapas}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMenuEtapasAberto(
                      !menuEtapasAberto
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <List className="h-4 w-4" />

                  Ver etapas
                </button>

              </div>

              {/* Barra */}

              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">

                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                  style={{
                    width: `${progresso}%`,
                  }}
                />

              </div>

              {/* Menu das etapas */}

              {menuEtapasAberto && (
                <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">

                  {etapas.map((item, index) => {
                    const ativa =
                      index === etapaAtual

                    const visitada =
                      etapasVisitadasRef.current.has(
                        index + 1
                      )

                    return (
                      <button
                        key={`${item.titulo}-${index}`}
                        type="button"
                        onClick={() =>
                          irParaEtapa(index)
                        }
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                          ativa
                            ? "border-sky-500/40 bg-sky-500/10"
                            : "border-border bg-background/40 hover:border-sky-500/30 hover:bg-secondary/60"
                        }`}
                      >

                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            ativa
                              ? "bg-sky-500 text-white"
                              : visitada
                              ? "bg-sky-500/10 text-sky-400"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {visitada && !ativa ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div className="min-w-0">

                          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Etapa {index + 1}
                          </p>

                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.titulo}
                          </p>

                        </div>

                      </button>
                    )
                  })}

                </div>
              )}

            </section>
          )}

          {/* ================================================ */}
          {/* CONTEÚDO */}
          {/* ================================================ */}

          {etapa ? (
            <article className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">

              {/* Cabeçalho da etapa */}

              <div className="border-b border-border bg-gradient-to-r from-sky-500/[0.07] via-transparent to-cyan-500/[0.04] px-5 py-5 sm:px-8 lg:px-10">

                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 font-bold text-sky-500">
                    {String(etapaAtual + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div>

                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-500">
                      Etapa {etapaAtual + 1}
                    </p>

                    <h2 className="text-xl font-bold leading-tight text-foreground sm:text-2xl lg:text-[1.7rem]">
                      {etapa.titulo}
                    </h2>

                  </div>

                </div>

              </div>

              {/* Markdown */}

              <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-10">

                <div className="mx-auto max-w-5xl">

                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mb-5 mt-2 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                          {children}
                        </h1>
                      ),

                      /*
                       * Caso exista ## dentro da etapa,
                       * tratamos como subtítulo.
                       */
                      h2: ({ children }) => (
                        <h2 className="mb-4 mt-8 border-l-[3px] border-sky-500 pl-4 text-xl font-bold leading-tight text-foreground sm:text-2xl">
                          {children}
                        </h2>
                      ),

                      h3: ({ children }) => (
                        <h3 className="mb-3 mt-7 text-lg font-semibold text-foreground sm:text-xl">
                          {children}
                        </h3>
                      ),

                      p: ({
                        node,
                        children,
                      }: any) => {
                        const hasImage =
                          node?.children?.some(
                            (child: any) =>
                              child.tagName === "img"
                          )

                        if (hasImage) {
                          return (
                            <div className="my-7">
                              {children}
                            </div>
                          )
                        }

                        return (
                          <p className="mb-5 text-[15.5px] leading-7 text-foreground/90 sm:text-[16.5px] sm:leading-8">
                            {children}
                          </p>
                        )
                      },

                      strong: ({ children }) => (
                        <strong className="font-bold text-sky-500 dark:text-sky-400">
                          {children}
                        </strong>
                      ),

                      ul: ({ children }) => (
                        <ul className="mb-6 ml-1 list-disc space-y-2.5 pl-6 text-[15.5px] leading-7 text-foreground/90 sm:text-[16.5px] sm:leading-8">
                          {children}
                        </ul>
                      ),

                      ol: ({ children }) => (
                        <ol className="mb-6 ml-1 list-decimal space-y-2.5 pl-6 text-[15.5px] leading-7 text-foreground/90 sm:text-[16.5px] sm:leading-8">
                          {children}
                        </ol>
                      ),

                      li: ({ children }) => (
                        <li className="pl-1">
                          {children}
                        </li>
                      ),

                      blockquote: ({ children }) => (
                        <blockquote className="my-7 rounded-2xl border border-sky-500/20 bg-sky-500/[0.07] px-5 py-4 text-[15.5px] leading-7 text-foreground/90 sm:text-base">
                          {children}
                        </blockquote>
                      ),

                      img: ({ src, alt }) => (
                        <img
                          src={src || ""}
                          alt={alt || ""}
                          className="mx-auto my-7 max-h-[440px] w-auto max-w-full rounded-2xl border border-border bg-white object-contain shadow-lg shadow-black/10"
                        />
                      ),

                      a: ({
                        href,
                        children,
                      }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sky-500 underline decoration-sky-500/30 underline-offset-4 transition hover:text-sky-400"
                        >
                          {children}
                        </a>
                      ),

                      hr: () => (
                        <hr className="my-8 border-border" />
                      ),

                      code: ({ children }) => (
                        <code className="rounded-md bg-secondary px-1.5 py-0.5 text-sm text-sky-500 dark:text-sky-300">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {etapa.conteudo}
                  </ReactMarkdown>

                </div>

              </div>

              {/* ============================================ */}
              {/* NAVEGAÇÃO INFERIOR */}
              {/* ============================================ */}

              <footer className="border-t border-border bg-background/30 px-5 py-5 sm:px-8 lg:px-10">

                <div className="flex items-center justify-between gap-3">

                  {/* Anterior */}

                  {etapaAtual > 0 ? (
                    <button
                      type="button"
                      onClick={etapaAnterior}
                      className="group flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-secondary sm:px-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition group-hover:border-sky-500/30 group-hover:text-sky-400">
                        <ChevronLeft className="h-5 w-5" />
                      </div>

                      <div className="hidden min-w-0 sm:block">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Anterior
                        </p>

                        <p className="max-w-[220px] truncate text-sm font-semibold text-foreground">
                          {etapas[etapaAtual - 1]?.titulo}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div />
                  )}

                  {/* Contador */}

                  <div className="hidden text-center md:block">
                    <p className="text-xs text-muted-foreground">
                      {etapaAtual + 1} de{" "}
                      {totalEtapas}
                    </p>
                  </div>

                  {/* Próximo */}

                  {etapaAtual < totalEtapas - 1 ? (
                    <button
                      type="button"
                      onClick={proximaEtapa}
                      className="group flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-right transition hover:bg-secondary sm:px-3"
                    >
                      <div className="hidden min-w-0 sm:block">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Próximo
                        </p>

                        <p className="max-w-[220px] truncate text-sm font-semibold text-foreground">
                          {etapas[etapaAtual + 1]?.titulo}
                        </p>
                      </div>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition group-hover:translate-x-0.5 group-hover:bg-sky-400">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </button>
                  ) : (
                    <Link
                      href="/resumos"
                      className="group inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
                    >
                      Concluir
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </Link>
                  )}

                </div>

              </footer>

            </article>
          ) : (

            /*
             * Caso o resumo não tenha ##
             * por algum motivo.
             */
            <article className="rounded-3xl border border-border bg-card p-6 sm:p-8">

              <div className="mx-auto max-w-5xl">

                <ReactMarkdown>
                  {resumo.conteudo || ""}
                </ReactMarkdown>

              </div>

            </article>
          )}

          {/* ================================================ */}
          {/* INDICADORES INFERIORES */}
          {/* ================================================ */}

          {totalEtapas > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1.5">

              {etapas.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    irParaEtapa(index)
                  }
                  aria-label={`Ir para etapa ${
                    index + 1
                  }`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === etapaAtual
                      ? "w-8 bg-sky-500"
                      : index < etapaAtual
                      ? "w-3 bg-sky-500/40"
                      : "w-3 bg-border hover:bg-muted-foreground/40"
                  }`}
                />
              ))}

            </div>
          )}

        </div>

      </main>
    </div>
  )
}
