"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { ArrowLeft, BookOpen, FileText, Pencil } from "lucide-react"

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

export default function ResumoDetailPage() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug

  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)

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
      setLoading(false)
    }

    carregarResumo()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="rounded-2xl border border-border bg-card px-6 py-5 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">
                Carregando resumo...
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!resumo) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
            <Link
              href="/resumos"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-sky-400 mb-8 transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Resumos
            </Link>

            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Resumo não encontrado.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          <Link
            href="/resumos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-sky-400 mb-6 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Resumos
          </Link>

          <header className="mb-6 rounded-2xl border border-border bg-card/70 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20">
                  <FileText className="h-6 w-6" />
                </div>

                <div>
                  {resumo.categoria && (
                    <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                      <BookOpen className="h-3.5 w-3.5" />
                      {resumo.categoria}
                    </span>
                  )}

                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-foreground">
                    {resumo.titulo}
                  </h1>

                  {resumo.description && (
                    <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
                      {resumo.description}
                    </p>
                  )}
                </div>
              </div>

              <AdminOnly>
                <Link
                  href={`/admin/editar-resumo/${resumo.slug}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  <Pencil size={16} />
                  Editar
                </Link>
              </AdminOnly>
            </div>
          </header>

          <article className="rounded-2xl border border-border bg-card/70 px-5 py-6 shadow-sm sm:px-7 sm:py-7">
            <div className="mx-auto max-w-2xl">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-5 mt-1 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-3 mt-7 border-l-4 border-sky-500 pl-3 text-xl font-bold leading-tight text-foreground">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-6 text-lg font-semibold leading-tight text-foreground">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-base leading-7 text-foreground/90">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-sky-500 dark:text-sky-400">
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-5 mt-2 list-disc space-y-1.5 pl-5 text-foreground/90">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-5 mt-2 list-decimal space-y-1.5 pl-5 text-foreground/90">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="pl-1 leading-7">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-5 rounded-xl border-l-4 border-sky-500 bg-sky-500/10 px-4 py-3 text-foreground/90">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-7 border-border" />,
                  img: ({ src, alt }) => (
                    <figure className="my-5">
                      <img
                        src={src || ""}
                        alt={alt || ""}
                        className="mx-auto max-h-[360px] w-auto max-w-full rounded-xl border border-border bg-white object-contain shadow-md shadow-black/10"
                      />

                      {alt && (
                        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                          {alt}
                        </figcaption>
                      )}
                    </figure>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-500 underline underline-offset-4 hover:text-sky-400"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="rounded-md bg-secondary px-1.5 py-0.5 text-sm text-sky-500 dark:text-sky-300">
                      {children}
                    </code>
                  ),
                }}
              >
                {resumo.conteudo || ""}
              </ReactMarkdown>
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}