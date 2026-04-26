"use client"

import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import {
  ArrowLeft,
  Stethoscope,
  User,
  Activity,
  AlertTriangle,
  Pencil,
} from "lucide-react"
import Link from "next/link"
import { use, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const dificuldadeColors: Record<string, string> = {
  "Básico": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Intermediário": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Avançado": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

export default function CasoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function fetchCaso() {
      const { data, error } = await supabase
        .from("casos_clinicos")
        .select("*")
        .eq("slug", slug)
        .single()

      if (error) {
        console.error("Erro ao buscar caso:", error)
        return
      }

      setData(data)
    }

    fetchCaso()
  }, [slug])

  if (!data) {
    return <div className="p-6">Carregando...</div>
  }

  const sections = [
    { key: "paciente", label: "Paciente", icon: User },
    { key: "queixa", label: "Queixa Principal", icon: AlertTriangle },
    { key: "historia", label: "História Clínica", icon: Activity },
    { key: "exame", label: "Exame Físico", icon: Stethoscope },
    { key: "conduta", label: "Conduta", icon: Activity },
    { key: "discussao", label: "Discussão Farmacológica", icon: Stethoscope },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">

          {/* TOPO COM VOLTAR + EDITAR */}
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/casos-clinicos"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar para Casos Clínicos
            </Link>

            {/* TEMPORARIAMENTE SEM ADMINONLY */}
            <Link
              href={`/casos-clinicos/${slug}/editar`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </div>

          {/* HEADER */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <Stethoscope className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">{data.titulo}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                dificuldadeColors[data.dificuldade] || "bg-secondary text-secondary-foreground"
              }`}>
                {data.dificuldade}
              </span>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {data.sistema}
              </span>
            </div>
          </div>

          {/* SEÇÕES */}
          <div className="space-y-4">
            {sections.map(({ key, label, icon: Icon }) => (
              <div key={key} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
                  <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-foreground">{label}</h3>
                </div>

                <div className="p-6">
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {data[key as keyof typeof data] || "Não informado"}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}