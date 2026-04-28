"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { AdminOnly } from "@/components/AdminOnly"
import {
  ArrowLeft,
  Target,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Pencil,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

type Tema = {
  id: string
  slug: string
  titulo: string
  descricao: string | null
}

type Questao = {
  id: string
  tema_id: string
  pergunta: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  correta: string
  comentario: string | null
  ordem: number | null
}

export default function QuestaoDetailPage() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug

  const [tema, setTema] = useState<Tema | null>(null)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [loading, setLoading] = useState(true)

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    async function fetchQuiz() {
      if (!slug) return

      setLoading(true)

      const { data: temaData, error: temaError } = await supabase
        .from("temas_questoes")
        .select("*")
        .eq("slug", slug)
        .single()

      if (temaError || !temaData) {
        console.error("Erro ao buscar tema:", temaError)
        setLoading(false)
        return
      }

      const { data: questoesData, error: questoesError } = await supabase
        .from("questoes")
        .select("*")
        .eq("tema_id", temaData.id)

      if (questoesError) {
        console.error("Erro ao buscar questões:", questoesError)
        setLoading(false)
        return
      }

      const questoesOrdenadas = (questoesData || []).sort((a, b) => {
        return (a.ordem || 0) - (b.ordem || 0)
      })

      setTema(temaData)
      setQuestoes(questoesOrdenadas)
      setLoading(false)
    }

    fetchQuiz()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Carregando quiz...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!tema || questoes.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
            <Link
              href="/questoes"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-sky-400 mb-8 group transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar para Questões
            </Link>

            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 mb-4">
                <Target className="h-7 w-7 text-sky-400" />
              </div>

              <h2 className="text-xl font-semibold text-foreground">
                Quiz não encontrado ou sem questões
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Verifique se o tema possui questões cadastradas.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const question = questoes[currentQuestion]
  const totalQuestions = questoes.length

  const alternativas = [
    question.alternativa_a,
    question.alternativa_b,
    question.alternativa_c,
    question.alternativa_d,
  ]

  const corretaIndex = ["A", "B", "C", "D"].indexOf(
    String(question.correta).toUpperCase()
  )

  function handleSelect(index: number) {
    if (showResult) return
    setSelectedAnswer(index)
  }

  function handleConfirm() {
    if (selectedAnswer === null) return

    setShowResult(true)

    if (selectedAnswer === corretaIndex) {
      setScore((s) => s + 1)
    }
  }

  function handleNext() {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((c) => c + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setFinished(true)
    }
  }

  function handleRestart() {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const percentage = Math.round((score / totalQuestions) * 100)

    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
            <div className="bg-card rounded-3xl border border-border p-8 text-center shadow-xl shadow-sky-500/5">
              <div
                className={cn(
                  "inline-flex items-center justify-center w-24 h-24 rounded-full mb-6",
                  percentage >= 70 ? "bg-emerald-500/10" : "bg-amber-500/10"
                )}
              >
                <span
                  className={cn(
                    "text-3xl font-bold",
                    percentage >= 70 ? "text-emerald-500" : "text-amber-500"
                  )}
                >
                  {percentage}%
                </span>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                Quiz finalizado!
              </h2>

              <p className="text-muted-foreground mb-6">
                Você acertou {score} de {totalQuestions} questões.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={handleRestart}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refazer
                </Button>

                <Link href="/questoes">
                  <Button className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600">
                    Voltar para Questões
                  </Button>
                </Link>
              </div>
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <div className="mb-6 sm:mb-8 flex items-center justify-between gap-4">
            <Link
              href="/questoes"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-sky-400 group transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar para Questões
            </Link>

            <AdminOnly>
              <Link
                href={`/questoes/${slug}/editar`}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </AdminOnly>
          </div>

          <section className="mb-6 sm:mb-8 rounded-3xl border border-sky-500/10 bg-gradient-to-br from-sky-500/10 via-card to-cyan-500/5 p-5 sm:p-6 shadow-lg shadow-sky-500/5">
            <div className="flex items-start gap-3">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-400">
                <Target className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {tema.titulo}
                </h1>

                <p className="text-sm text-muted-foreground mt-1">
                  {tema.descricao || "Questões comentadas"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  Questão {currentQuestion + 1} de {totalQuestions}
                </span>

                <span className="font-medium text-sky-400">
                  {score} acertos
                </span>
              </div>

              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-300"
                  style={{
                    width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>
          </section>

          <section className="bg-card rounded-3xl border border-border overflow-hidden shadow-xl shadow-sky-500/5">
            <div className="p-5 sm:p-8">
              <p className="text-lg font-semibold text-foreground mb-6 leading-relaxed">
                {question.pergunta}
              </p>

              <div className="space-y-3">
                {alternativas.map((alt, index) => {
                  const isSelected = selectedAnswer === index
                  const isCorrect = index === corretaIndex
                  const showCorrect = showResult && isCorrect
                  const showWrong = showResult && isSelected && !isCorrect

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelect(index)}
                      disabled={showResult}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200",
                        !showResult &&
                          isSelected &&
                          "border-sky-500 bg-sky-500/10",
                        !showResult &&
                          !isSelected &&
                          "border-border hover:border-sky-500/50 hover:bg-sky-500/5",
                        showCorrect &&
                          "border-emerald-500 bg-emerald-500/10",
                        showWrong && "border-rose-500 bg-rose-500/10",
                        showResult &&
                          !showCorrect &&
                          !showWrong &&
                          "opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium shrink-0",
                          !showResult &&
                            isSelected &&
                            "bg-sky-500 text-white",
                          !showResult &&
                            !isSelected &&
                            "bg-secondary text-secondary-foreground",
                          showCorrect && "bg-emerald-500 text-white",
                          showWrong && "bg-rose-500 text-white"
                        )}
                      >
                        {showCorrect ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : showWrong ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </span>

                      <span className="flex-1 text-sm sm:text-base text-foreground">
                        {alt}
                      </span>
                    </button>
                  )
                })}
              </div>

              {showResult && (
                <div className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Comentário:
                  </p>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {question.comentario || "Sem comentário cadastrado."}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-8 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              {!showResult ? (
                <Button
                  onClick={handleConfirm}
                  disabled={selectedAnswer === null}
                  className="bg-sky-500 hover:bg-sky-600"
                >
                  Confirmar
                </Button>
              ) : (
                <Button onClick={handleNext} className="bg-sky-500 hover:bg-sky-600">
                  {currentQuestion < totalQuestions - 1 ? (
                    <>
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    "Ver resultado"
                  )}
                </Button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}