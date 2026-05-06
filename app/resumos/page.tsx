"use client"

import { trackEvent } from "@/lib/analytics"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import {
  FileText,
  ArrowRight,
  BookOpen,
  Plus,
  ArrowUp,
  ArrowDown,
  ListOrdered,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AdminOnly } from "@/components/AdminOnly"

type Resumo = {
  id: string
  slug: string
  titulo: string
  description: string | null
  categoria: string | null
  criado_em?: string
  ordem: number | null
}

export default function ResumosPage() {
  const [resumos, setResumos] = useState<Resumo[]>([])
  const [loading, setLoading] = useState(true)
  const [modoReordenar, setModoReordenar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    trackEvent({
      event_type: "page_view",
      page_path: "/resumos",
      section: "resumos",
      title: "Página de resumos",
    })

    carregarResumos()
  }, [])

  async function carregarResumos() {
    setLoading(true)

    const { data, error } = await supabase
      .from("resumos")
      .select("*")
      .order("ordem", { ascending: false })
      .order("criado_em", { ascending: false })

    if (error) {
      console.error("Erro ao carregar resumos:", error)
      setLoading(false)
      return
    }

    setResumos(data || [])
    setLoading(false)
  }

  async function moverResumo(index: number, direcao: "cima" | "baixo") {
    const novoIndex = direcao === "cima" ? index - 1 : index + 1

    if (novoIndex < 0 || novoIndex >= resumos.length) return

    const lista = [...resumos]
    const atual = lista[index]
    const troca = lista[novoIndex]

    lista[index] = troca
    lista[novoIndex] = atual

    setResumos(lista)
    setSalvando(true)

    const total = lista.length

    const atualizacoes = lista.map((resumo, i) =>
      supabase
        .from("resumos")
        .update({ ordem: total - i })
        .eq("id", resumo.id)
    )

    const resultados = await Promise.all(atualizacoes)
    const erro = resultados.find((resultado) => resultado.error)

    if (erro?.error) {
      console.error("Erro ao reordenar resumos:", erro.error)
      await carregarResumos()
    } else {
      setResumos(
        lista.map((resumo, i) => ({
          ...resumo,
          ordem: total - i,
        }))
      )
    }

    setSalvando(false)
  }

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
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setModoReordenar(!modoReordenar)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-500 transition hover:bg-sky-500/20"
                  >
                    <ListOrdered size={18} />
                    {modoReordenar ? "Concluir" : "Reordenar"}
                  </button>

                  <Link
                    href="/admin/novo-resumo"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
                  >
                    <Plus size={18} />
                    Novo resumo
                  </Link>
                </div>
              </AdminOnly>
            </div>

            {modoReordenar && (
              <p className="mt-4 text-sm text-muted-foreground">
                Use as setas para mudar a ordem. A numeração é contada de baixo
                para cima.
              </p>
            )}

            {salvando && (
              <p className="mt-2 text-sm text-sky-500">
                Salvando nova ordem...
              </p>
            )}
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
                <div
                  key={resumo.id}
                  className="group rounded-2xl bg-card border border-border p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10"
                >
                  <div className="flex gap-4">
                    <div className="hidden sm:flex w-12 h-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-bold">
                      {String(resumos.length - index).padStart(2, "0")}
                    </div>

                    <Link
                      href={`/resumos/${resumo.slug}`}
                      className="flex flex-1 min-w-0 gap-4"
                    >
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

                      {!modoReordenar && (
                        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-60 transition group-hover:translate-x-1 group-hover:text-sky-400 group-hover:opacity-100" />
                      )}
                    </Link>

                    {modoReordenar && (
                      <AdminOnly>
                        <div className="flex shrink-0 flex-col gap-2">
                          <button
                            type="button"
                            disabled={index === 0 || salvando}
                            onClick={() => moverResumo(index, "cima")}
                            className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-sky-500/40 hover:text-sky-400 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowUp size={18} />
                          </button>

                          <button
                            type="button"
                            disabled={index === resumos.length - 1 || salvando}
                            onClick={() => moverResumo(index, "baixo")}
                            className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-sky-500/40 hover:text-sky-400 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowDown size={18} />
                          </button>
                        </div>
                      </AdminOnly>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}