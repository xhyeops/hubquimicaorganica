"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import {
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Target,
  Plus,
  EyeOff,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { trackEvent } from "@/lib/analytics"
import { isAdminEmail } from "@/lib/admin"

type TemaQuestao = {
  id: string
  slug: string
  titulo: string
  descricao: string | null
  created_at: string
  total_questoes: number
  visivel: boolean
}

export default function QuestoesPage() {
  const [quizzes, setQuizzes] = useState<TemaQuestao[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    trackEvent({
      event_type: "page_view",
      page_path: "/questoes",
      section: "questoes",
      title: "Página de questões",
      content_type: "quiz_list",
      metadata: {
        pagina: "questoes",
      },
    })

    async function carregarPagina() {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()

      const email = userData.user?.email

      const admin =
        !!email && isAdminEmail(email)

      setIsAdmin(admin)

      let query = supabase
        .from("temas_questoes")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

      /*
       * Alunos só enxergam temas liberados.
       *
       * Admin vê todos, inclusive os ocultos.
       */
      if (!admin) {
        query = query.eq("visivel", true)
      }

      const {
        data: temas,
        error: temasError,
      } = await query

      if (temasError) {
        console.error(
          "Erro ao buscar temas:",
          temasError.message
        )

        setLoading(false)
        return
      }

      const temasComContagem =
        await Promise.all(
          (temas || []).map(
            async (tema) => {
              const {
                count,
                error: countError,
              } = await supabase
                .from("questoes")
                .select("*", {
                  count: "exact",
                  head: true,
                })
                .eq(
                  "tema_id",
                  tema.id
                )

              if (countError) {
                console.error(
                  "Erro ao contar questões:",
                  countError.message
                )
              }

              return {
                ...tema,
                total_questoes:
                  count || 0,

                /*
                 * Compatibilidade caso existam
                 * registros antigos sem valor.
                 */
                visivel:
                  tema.visivel !== false,
              }
            }
          )
        )

      setQuizzes(
        temasComContagem
      )

      setLoading(false)
    }

    carregarPagina()
  }, [])

  function registrarAberturaQuiz(
    quiz: TemaQuestao
  ) {
    trackEvent({
      event_type: "quiz_open",
      page_path: "/questoes",
      section: "questoes",

      slug: quiz.slug,
      title: quiz.titulo,

      content_id: quiz.id,
      content_type: "quiz",

      value: quiz.total_questoes,

      metadata: {
        descricao:
          quiz.descricao || null,

        total_questoes:
          quiz.total_questoes,

        visivel:
          quiz.visivel,
      },
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">

          {/* CABEÇALHO */}
          <section className="mb-8 sm:mb-10">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-sm font-medium">
              <HelpCircle className="h-3.5 w-3.5" />
              Teste seu conhecimento
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
                  Questões
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                  Pratique com questões comentadas e fixe os
                  principais conteúdos de química orgânica.
                </p>
              </div>

              <AdminOnly>
                <Link
                  href="/questoes/novo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  <Plus className="h-4 w-4" />
                  Novo tema
                </Link>
              </AdminOnly>

            </div>

            {isAdmin && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                <EyeOff className="h-3.5 w-3.5" />

                Temas ocultos aparecem apenas para administradores.
              </div>
            )}

          </section>

          {/* CARREGAMENTO */}
          {loading ? (

            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                Carregando questões...
              </p>
            </div>

          ) : quizzes.length === 0 ? (

            /* SEM QUESTÕES */
            <div className="rounded-2xl border border-border bg-card p-8 text-center">

              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 mb-4">
                <HelpCircle className="h-7 w-7 text-sky-400" />
              </div>

              <h3 className="text-lg font-medium text-foreground mb-1">
                Nenhuma questão disponível
              </h3>

              <p className="text-sm text-muted-foreground">
                Os temas de questões aparecerão aqui quando forem liberados.
              </p>

            </div>

          ) : (

            /* LISTA DE TEMAS */
            <section className="grid sm:grid-cols-2 gap-4">

              {quizzes.map((quiz) => {

                const card = (
                  <div
                    className={`group relative overflow-hidden rounded-2xl bg-card border p-5 sm:p-6 transition-all duration-300 ${
                      quiz.visivel
                        ? "border-border hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/10"
                        : "border-amber-500/20 opacity-75"
                    }`}
                  >

                    <div
                      className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full transition ${
                        quiz.visivel
                          ? "bg-sky-500/0 group-hover:bg-sky-400"
                          : "bg-amber-400"
                      }`}
                    />

                    {/* TOPO */}
                    <div className="flex items-start justify-between gap-3">

                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 transition ${
                          quiz.visivel
                            ? "bg-sky-500/10 text-sky-400 group-hover:scale-110 group-hover:bg-sky-500/20"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {quiz.visivel ? (
                          <Target className="h-6 w-6" />
                        ) : (
                          <EyeOff className="h-5 w-5" />
                        )}
                      </div>

                      {!quiz.visivel && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
                          <EyeOff className="h-3 w-3" />
                          Oculto
                        </span>
                      )}

                    </div>

                    <div className="space-y-2">

                      <h2
                        className={`text-lg sm:text-xl font-semibold transition-colors ${
                          quiz.visivel
                            ? "text-foreground group-hover:text-sky-400"
                            : "text-foreground"
                        }`}
                      >
                        {quiz.titulo}
                      </h2>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {quiz.descricao ||
                          "Sem descrição disponível."}
                      </p>

                      <div className="flex items-center justify-between pt-3">

                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">

                          <CheckCircle2
                            className={`h-4 w-4 ${
                              quiz.visivel
                                ? "text-sky-400"
                                : "text-amber-400"
                            }`}
                          />

                          {quiz.total_questoes}{" "}
                          {quiz.total_questoes === 1
                            ? "questão"
                            : "questões"}

                        </span>

                        {quiz.visivel ? (
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                        ) : (
                          <span className="text-[10px] font-medium text-amber-400">
                            Somente admin
                          </span>
                        )}

                      </div>

                    </div>

                  </div>
                )

                /*
                 * Admin pode abrir tema oculto normalmente.
                 *
                 * Alunos nunca recebem temas ocultos na consulta.
                 */
                return (
                  <Link
                    key={quiz.id}
                    href={`/questoes/${quiz.slug}`}
                    onClick={() =>
                      registrarAberturaQuiz(
                        quiz
                      )
                    }
                  >
                    {card}
                  </Link>
                )
              })}

            </section>

          )}

        </div>
      </main>
    </div>
  )
}
