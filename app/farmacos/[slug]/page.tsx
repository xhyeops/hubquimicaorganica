"use client"

import { Sidebar } from "@/components/sidebar"
import { ArrowLeft, Pill, Beaker, AlertCircle, CheckCircle, XCircle, Zap } from "lucide-react"
import Link from "next/link"
import { use, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Farmaco = {
  id: string
  slug: string
  nome: string
  classe: string
  categoria: string
  mecanismo: string
  indicacao: string
  contraindicacoes?: string
  efeitos_adversos?: string
  interacoes?: string
}

export default function FarmacoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [data, setData] = useState<Farmaco | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarFarmaco() {
      const { data, error } = await supabase
        .from("farmacos")
        .select("*")
        .eq("slug", slug)
        .single()

      if (error) {
        console.error("Erro ao carregar fármaco:", error)
        setData(null)
      } else {
        setData(data)
      }

      setLoading(false)
    }

    carregarFarmaco()
  }, [slug])

  function lista(texto?: string) {
    if (!texto) return []
    return texto
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
            <Link href="/farmacos" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar
            </Link>

            <div className="text-center py-16">
              <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">Fármaco não encontrado</h2>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <Link
            href="/farmacos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar para Fármacos
          </Link>

          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
                <Pill className="h-7 w-7" />
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground">{data.nome}</h1>
                <p className="text-muted-foreground">{data.classe}</p>
              </div>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
              {data.categoria}
            </span>
          </div>

          <div className="grid gap-4">
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                <Beaker className="h-5 w-5 text-rose-500" />
                <h3 className="font-semibold">Mecanismo de Ação</h3>
              </div>
              <div className="p-6 text-sm leading-relaxed">{data.mecanismo}</div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <h3>Indicações</h3>
                </div>
                <ul className="p-6 space-y-2">
                  {lista(data.indicacao).map((item, i) => (
                    <li key={i} className="text-sm">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b">
                  <XCircle className="h-5 w-5 text-rose-500" />
                  <h3>Contraindicações</h3>
                </div>
                <ul className="p-6 space-y-2">
                  {lista(data.contraindicacoes).map((item, i) => (
                    <li key={i} className="text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <h3>Efeitos Adversos</h3>
                </div>
                <ul className="p-6 space-y-2">
                  {lista(data.efeitos_adversos).map((item, i) => (
                    <li key={i} className="text-sm">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <h3>Interações</h3>
                </div>
                <ul className="p-6 space-y-2">
                  {lista(data.interacoes).map((item, i) => (
                    <li key={i} className="text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}