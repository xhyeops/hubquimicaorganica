"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { HelpCircle, ArrowRight, CheckCircle2, Target, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function QuestoesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuizzes() {
      const { data: temas, error: temasError } = await supabase
        .from("temas_questoes")
        .select("*")
        .order("created_at", { ascending: false })

      if (temasError) {
        console.error("Erro ao buscar temas:", temasError.message)
        setLoading(false)
        return
      }

      const temasComContagem = await Promise.all(
        (temas || []).map(async (tema) => {
          const { count, error: countError } = await supabase
            .from("questoes")
            .select("*", { count: "exact", head: true })
            .eq("tema_id", tema.id)

          if (countError) {
            console.error("Erro ao contar questões:", countError.message)
          }

          return {
            ...tema,
            total_questoes: count || 0,
          }
        })
      )

      setQuizzes(temasComContagem)
      setLoading(false)
    }

    fetchQuizzes()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Teste seu Conhecimento</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                  Questões
                </h1>
                <p className="text-muted-foreground">
                  Pratique com questões comentadas e fixe o conteúdo estudado.
                </p>
              </div>

              <AdminOnly>
                <Link
                  href="/questoes/novo"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4" />
                  Novo Tema
                </Link>
              </AdminOnly>
            </div>
          </div>

          {loading && (
            <div className="text-center py-10 text-muted-foreground">
              Carregando questões...
            </div>
          )}

          {!loading && (
            <div className="grid sm:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/questoes/${quiz.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5 hover:border-amber-500/30"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg mb-4">
                    <Target className="h-6 w-6" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {quiz.titulo}
                    </h2>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {quiz.descricao || "Sem descrição disponível."}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        {quiz.total_questoes} questões
                      </span>

                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && quizzes.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-4">
                <HelpCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                Nenhuma questão ainda
              </h3>
              <p className="text-sm text-muted-foreground">
                As questões aparecerão aqui quando forem adicionadas.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}