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
            <p className="text-sm text-muted-foreground">
              Carregando resumo...
            </p>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/resumos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-sky-400 mb-7 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Resumos
          </Link>

          <div className="mb-7">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">
                    {resumo.titulo}
                  </h1>

                  {resumo.description && (
                    <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {resumo.description}
                    </p>
                  )}
                </div>
              </div>

              <AdminOnly>
                <Link
                  href={`/admin/editar-resumo/${resumo.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  <Pencil size={16} />
                  Editar
                </Link>
              </AdminOnly>
            </div>

            {resumo.categoria && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <BookOpen className="h-3 w-3" />
                {resumo.categoria}
              </span>
            )}
          </div>

          <article className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <div className="mx-auto max-w-3xl">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl sm:text-3xl font-bold mb-5 mt-1 text-foreground leading-tight">
                      {children}
                    </h1>
                  ),

                  h2: ({ children }) => (
                    <h2 className="text-xl sm:text-2xl font-bold mt-8 mb-3 text-foreground leading-tight border-l-4 border-sky-500 pl-3">
                      {children}
                    </h2>
                  ),

                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground">
                      {children}
                    </h3>
                  ),

                  p: ({ node, children }: any) => {
                    const hasImage = node?.children?.some(
                      (child: any) => child.tagName === "img"
                    )

                    if (hasImage) {
                      return <div className="my-5">{children}</div>
                    }

                    return (
                      <p className="mb-4 text-[15.5px] sm:text-base leading-7 text-foreground/90">
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
                    <ul className="list-disc pl-6 mb-5 space-y-2 text-[15.5px] leading-7 text-foreground/90">
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 mb-5 space-y-2 text-[15.5px] leading-7 text-foreground/90">
                      {children}
                    </ol>
                  ),

                  li: ({ children }) => <li>{children}</li>,

                  blockquote: ({ children }) => (
                    <blockquote className="my-5 rounded-xl border-l-4 border-sky-500 bg-sky-500/10 px-4 py-3 text-[15.5px] leading-7 text-foreground/90">
                      {children}
                    </blockquote>
                  ),

                  img: ({ src, alt }) => (
                    <img
                      src={src || ""}
                      alt={alt || ""}
                      className="mx-auto my-5 max-h-[280px] w-auto max-w-full rounded-xl border border-border bg-white object-contain shadow-md shadow-black/10"
                    />
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

                  hr: () => <hr className="my-7 border-border" />,

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