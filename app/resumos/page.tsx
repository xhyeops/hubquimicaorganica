"use client"

import { trackEvent } from "@/lib/analytics"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { FileText, ArrowRight, BookOpen, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AdminOnly } from "@/components/AdminOnly"

type Resumo = {
  id: string
  slug: string
  titulo: string
  description: string | null
  categoria: string | null
  criado_em?: string
}

export default function ResumosPage() {
  const [resumos, setResumos] = useState<Resumo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  trackEvent({
    event_type: "page_view",
    page_path: "/resumos",
    section: "resumos",
    title: "Página de resumos",
  })
    
    async function carregarResumos() {
      setLoading(true)

      const { data, error } = await supabase
        .from("resumos")
        .select("*")
        .order("criado_em", { ascending: false })

      if (error) {
        console.error("Erro ao carregar resumos:", error)
        setLoading(false)
        return
      }

      setResumos(data || [])
      setLoading(false)
    }

    carregarResumos()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <div className="mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-sm font-medium">
              <FileText className="h-3.5 w-3.5" />
              Conteúdo de Estudo
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  Resumos
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                  Conteúdos organizados para revisar funções orgânicas,
                  propriedades, reações e mecanismos.
                </p>
              </div>

              <AdminOnly>
                <Link
                  href="/admin/novo-resumo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  <Plus size={18} />
                  Novo resumo
                </Link>
              </AdminOnly>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Carregando resumos...</p>
            </div>
          ) : resumos.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <BookOpen className="mx-auto mb-4 h-8 w-8 text-sky-400" />
              <p className="font-medium text-foreground">
                Nenhum resumo encontrado
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Quando novos conteúdos forem adicionados, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {resumos.map((resumo, index) => (
                <Link
                  key={resumo.id}
                  href={`/resumos/${resumo.slug}`}
                  className="group rounded-2xl bg-card border border-border p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10"
                >
                  <div className="flex gap-4">
                    <div className="hidden sm:flex w-12 h-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="inline-flex rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400">
                        {resumo.categoria || "Geral"}
                      </span>

                      <h2 className="text-lg sm:text-xl font-semibold mt-3 text-foreground group-hover:text-sky-400 transition">
                        {resumo.titulo}
                      </h2>

                      {resumo.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {resumo.description}
                        </p>
                      )}
                    </div>

                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-60 transition group-hover:translate-x-1 group-hover:text-sky-400 group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}