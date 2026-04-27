"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import {
  FileText,
  FlaskConical,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Users,
  Layers,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

const actions = [
  {
    title: "Estudar resumos",
    description: "Aprenda funções orgânicas, propriedades e conceitos fundamentais.",
    href: "/resumos",
    icon: FileText,
    gradient: "from-sky-500 to-cyan-500",
  },
  {
    title: "Treinar exercícios",
    description: "Resolva questões e fixe os conceitos de química orgânica.",
    href: "/questoes",
    icon: HelpCircle,
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    title: "Revisar flashcards",
    description: "Fixe grupos funcionais, reações e conceitos importantes.",
    href: "/flashcards",
    icon: Layers,
    gradient: "from-cyan-500 to-teal-500",
  },
]

export default function HomePage() {
  const [counts, setCounts] = useState({
    resumos: 0,
    flashcards: 0,
    questoes: 0,
  })

  useEffect(() => {
    async function fetchCounts() {
      const [resumos, flashcards, questoes] = await Promise.all([
        supabase.from("resumos").select("*", { count: "exact", head: true }),
        supabase.from("flashcards").select("*", { count: "exact", head: true }),
        supabase.from("questoes").select("*", { count: "exact", head: true }),
      ])

      setCounts({
        resumos: resumos.count || 0,
        flashcards: flashcards.count || 0,
        questoes: questoes.count || 0,
      })
    }

    fetchCounts()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-16">

          {/* HERO */}
          <section className="mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-sky-500/10 text-sky-400 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                Hub de Estudos
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
                Monitoria de{" "}
                <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                  Química Orgânica
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-2xl">
                Materiais para estudar, revisar e dominar química orgânica de forma clara e prática.
              </p>

              <p className="text-sm text-muted-foreground mt-4">
                Focado em funções orgânicas, reações, mecanismos e exercícios comentados.
              </p>
            </div>
          </section>

          {/* AÇÕES */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              O que fazer agora?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-2xl bg-card border border-border p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/5"
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} text-white mb-4 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <action.icon className="h-6 w-6" />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-sky-400 transition">
                      {action.title}
                    </h3>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* GUIA */}
          <section className="mb-8">
            <Link
              href="/resumos"
              className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-sky-500/10 to-transparent border border-sky-500/20 px-5 py-4 transition hover:border-sky-500/40"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white transition-transform duration-300 group-hover:scale-110">
                  <FlaskConical className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-semibold text-foreground">
                    Guia rápido de Química Orgânica
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Funções orgânicas, propriedades, reações e mecanismos importantes.
                  </p>
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
            </Link>
          </section>

          {/* EQUIPE + CONTADORES */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-card border border-border p-5 transition hover:border-sky-500/20">
              <div className="flex items-center gap-2 mb-3 text-sky-400">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Equipe da monitoria</span>
              </div>

              <p className="text-sm text-muted-foreground">
                Monitores:{" "}
                <span className="text-sky-400 font-semibold">André Luiz</span>{" "}
                e{" "}
                <span className="text-sky-400 font-semibold">Ana Georgia</span>
              </p>

              <p className="text-sm text-muted-foreground mt-1">
                Professor:{" "}
                <span className="text-foreground font-medium">
                  Felipe Ramon
                </span>
              </p>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5 transition hover:border-sky-500/20">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-sky-400">
                    {counts.resumos}
                  </div>
                  <div className="text-xs text-muted-foreground">Resumos</div>
                </div>

                <div>
                  <div className="text-xl font-bold text-sky-400">
                    {counts.flashcards}
                  </div>
                  <div className="text-xs text-muted-foreground">Flashcards</div>
                </div>

                <div>
                  <div className="text-xl font-bold text-sky-400">
                    {counts.questoes}
                  </div>
                  <div className="text-xs text-muted-foreground">Questões</div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}