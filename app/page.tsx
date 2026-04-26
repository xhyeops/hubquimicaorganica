"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import {
  FileText,
  FlaskConical,
  HelpCircle,
  Pill,
  ArrowRight,
  Sparkles,
  Users,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const actions = [
  {
    title: "Revisar conteúdo",
    description: "Leia resumos objetivos antes da aula, prova ou monitoria.",
    href: "/resumos",
    icon: FileText,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    title: "Praticar questões",
    description: "Teste seu raciocínio com questões comentadas.",
    href: "/questoes",
    icon: HelpCircle,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    title: "Aplicar na clínica",
    description: "Resolva casos clínicos e desenvolva tomada de decisão.",
    href: "/casos-clinicos",
    icon: FlaskConical,
    gradient: "from-emerald-500 to-teal-600",
  },
]

export default function HomePage() {
  const [counts, setCounts] = useState({
    resumos: 0,
    casos: 0,
    questoes: 0,
    farmacos: 0,
  })

  useEffect(() => {
    async function fetchCounts() {
      const [resumos, casos, questoes, farmacos] = await Promise.all([
        supabase.from("resumos").select("*", { count: "exact", head: true }),
        supabase.from("casos_clinicos").select("*", { count: "exact", head: true }),
        supabase.from("questoes").select("*", { count: "exact", head: true }),
        supabase.from("farmacos").select("*", { count: "exact", head: true }),
      ])

      setCounts({
        resumos: resumos.count || 0,
        casos: casos.count || 0,
        questoes: questoes.count || 0,
        farmacos: farmacos.count || 0,
      })
    }

    fetchCounts()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-16">
          
          {/* HERO LIMPO */}
          <section className="mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-rose-500/10 text-rose-400 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                Hub de Estudos
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
                Monitoria de{" "}
                <span className="bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">
                  Farmacologia Clínica
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl">
                Materiais da monitoria para revisar, praticar e aplicar farmacologia clínica de forma mais objetiva.
              </p>

              <p className="text-sm text-muted-foreground mt-4">
                Desenvolvido para monitoria acadêmica.
              </p>
            </div>
          </section>

          {/* AÇÕES PRINCIPAIS */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              O que fazer agora?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-2xl bg-card border border-border p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/5"
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} text-white mb-4 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <action.icon className="h-6 w-6" />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-rose-400 transition">
                      {action.title}
                    </h3>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* FARMACOS */}
          <section className="mb-8">
            <Link
              href="/farmacos"
              className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 px-5 py-4 transition hover:border-rose-500/40"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white transition-transform duration-300 group-hover:scale-110">
                  <Pill className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-semibold text-foreground">
                    Consulta rápida de fármacos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Mecanismos, indicações e efeitos importantes.
                  </p>
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </Link>
          </section>

          {/* EQUIPE + CONTADORES */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-card border border-border p-5 transition hover:border-rose-500/20">
              <div className="flex items-center gap-2 mb-3 text-rose-400">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Equipe da monitoria</span>
              </div>

              <p className="text-sm text-muted-foreground">
                Monitores:{" "}
                <span className="text-rose-400 font-semibold">André Araújo</span>{" "}
                e{" "}
                <span className="text-rose-400 font-semibold">Camille Alves</span>
              </p>

              <p className="text-sm text-muted-foreground mt-1">
                Professor:{" "}
                <span className="text-foreground font-medium">Paulo Yuri Firmino</span>
              </p>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5 transition hover:border-rose-500/20">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-rose-400">{counts.resumos}</div>
                  <div className="text-xs text-muted-foreground">Resumos</div>
                </div>

                <div>
                  <div className="text-xl font-bold text-rose-400">{counts.questoes}</div>
                  <div className="text-xs text-muted-foreground">Questões</div>
                </div>

                <div>
                  <div className="text-xl font-bold text-rose-400">{counts.casos}</div>
                  <div className="text-xs text-muted-foreground">Casos</div>
                </div>

                <div>
                  <div className="text-xl font-bold text-rose-400">{counts.farmacos}</div>
                  <div className="text-xs text-muted-foreground">Fármacos</div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}