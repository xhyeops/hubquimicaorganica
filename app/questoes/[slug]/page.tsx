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
  Eye,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { trackEvent } from "@/lib/analytics"
import ReactMarkdown from "react-markdown"

type Tema = {
  id: string
  slug: string
  titulo: string
  descricao: string | null
}

type Questao = {
  id: string
  tema_id: string
  tipo: "fechada" | "aberta" | null
  pergunta: string | null
  enunciado?: string | null
  imagem_url: string | null
  alternativa_a: string | null
  alternativa_b: string | null
  alternativa_c: string | null
  alternativa_d: string | null
  alternativa_e: string | null
  correta: string | null
  resposta_correta?: string | null
  resposta_aberta: string | null
  comentario: string | null
  explicacao?: string | null
  ordem: number | null
}

export default function QuestaoDetailPage() {
  const params = useParams()

  const slug = Array.isArray(params.slug)
    ? params.slug[0]
    : params.slug

  const [tema, setTema] = useState<Tema | null>(null)

  const [questoes, setQuestoes] = useState<Questao[]>([])

  const [loading, setLoading] = useState(true)

  const [currentQuestion, setCurrentQuestion] = useState(0)

  const [selectedAnswer, setSelectedAnswer] =
    useState<number | null>(null)

  const [openAnswer, setOpenAnswer] = useState("")

  const [showResult, setShowResult] = useState(false)

  const [score, setScore] = useState(0)

  const [answeredClosed, setAnsweredClosed] = useState(0)

  const [answeredOpen, setAnsweredOpen] = useState(0)

  const [finished, setFinished] = useState(false)

  /*
   * Guarda o momento em que o quiz começou.
   *
   * É utilizado posteriormente para calcular
   * aproximadamente quanto tempo o usuário levou
   * para concluir o quiz.
   */
  const quizStartTime = useRef<number>(Date.now())

  /*
   * Guarda o momento em que a questão atual
   * começou a ser visualizada.
   */
  const questionStartTime = useRef<number>(Date.now())

  /*
   * ============================================================
   * CARREGAMENTO DO QUIZ
   * ============================================================
   */

  useEffect(() => {
    async function fetchQuiz() {
      if (!slug) return

      setLoading(true)

      const { data: temaData, error: temaError } =
        await supabase
          .from("temas_questoes")
          .select("*")
          .eq("slug", slug)
          .single()

      if (temaError || !temaData) {
        console.error(
          "Erro ao buscar tema:",
          temaError
        )

        setLoading(false)

        return
      }

      const {
        data: questoesData,
        error: questoesError,
      } = await supabase
        .from("questoes")
        .select("*")
        .eq("tema_id", temaData.id)

      if (questoesError) {
        console.error(
          "Erro ao buscar questões:",
          questoesError
        )

        setLoading(false)

        return
      }

      const questoesOrdenadas = (
        questoesData || []
      ).sort((a, b) => {
        return (a.ordem || 0) - (b.ordem || 0)
      })

      setTema(temaData)

      setQuestoes(questoesOrdenadas)

      /*
       * Reinicia os cronômetros assim que
       * os dados do quiz são carregados.
       */
      quizStartTime.current = Date.now()

      questionStartTime.current = Date.now()

      setLoading(false)
    }

    fetchQuiz()
  }, [slug])

  /*
   * ============================================================
   * ANALYTICS — ABERTURA DO QUIZ
   * ============================================================
   */

  useEffect(() => {
    if (!tema) return

    trackEvent({
      event_type: "quiz_view",

      page_path: `/questoes/${tema.slug}`,

      section: "questoes",

      slug: tema.slug,

      title: tema.titulo,

      content_id: tema.id,

      content_type: "quiz",

      value: questoes.length,

      metadata: {
        tema_id: tema.id,
        tema_slug: tema.slug,
        total_questoes: questoes.length,
      },
    })
  }, [tema, questoes.length])

  /*
   * ============================================================
   * ANALYTICS — VISUALIZAÇÃO DE CADA QUESTÃO
   * ============================================================
   */

  useEffect(() => {
    if (!tema) return

    if (questoes.length === 0) return

    if (finished) return

    const questaoAtual =
      questoes[currentQuestion]

    if (!questaoAtual) return

    const textoQuestao =
      questaoAtual.pergunta ||
      questaoAtual.enunciado ||
      `Questão ${currentQuestion + 1}`

    /*
     * Reinicia o tempo da questão.
     */
    questionStartTime.current = Date.now()

    trackEvent({
      event_type: "question_view",

      page_path: `/questoes/${tema.slug}`,

      section: "questoes",

      slug: tema.slug,

      title: textoQuestao,

      content_id: questaoAtual.id,

      content_type: "question",

      value: currentQuestion + 1,

      metadata: {
        tema_id: tema.id,
        tema_titulo: tema.titulo,
        tema_slug: tema.slug,

        tipo:
          questaoAtual.tipo || "fechada",

        posicao:
          currentQuestion + 1,

        total_questoes:
          questoes.length,

        ordem:
          questaoAtual.ordem ?? null,
      },
    })
  }, [
    currentQuestion,
    tema,
    questoes,
    finished,
  ])

  /*
   * ============================================================
   * FUNÇÕES AUXILIARES
   * ============================================================
   */

  function resetQuestionState() {
    setSelectedAnswer(null)

    setOpenAnswer("")

    setShowResult(false)
  }

  function getQuestionDuration() {
    const segundos =
      (Date.now() -
        questionStartTime.current) /
      1000

    return Math.max(
      0,
      Math.round(segundos)
    )
  }

  function getQuizDuration() {
    const segundos =
      (Date.now() -
        quizStartTime.current) /
      1000

    return Math.max(
      0,
      Math.round(segundos)
    )
  }

  /*
   * ============================================================
   * NAVEGAÇÃO
   * ============================================================
   */

  function irParaAnterior() {
    if (currentQuestion === 0) return

    const question =
      questoes[currentQuestion]

    if (tema && question) {
      const pergunta =
        question.pergunta ||
        question.enunciado ||
        `Questão ${currentQuestion + 1}`

      trackEvent({
        event_type:
          "question_previous",

        page_path: `/questoes/${tema.slug}`,

        section: "questoes",

        slug: tema.slug,

        title: pergunta,

        content_id: question.id,

        content_type: "question",

        value: currentQuestion + 1,

        metadata: {
          tema_id: tema.id,
          tema_titulo: tema.titulo,
          posicao:
            currentQuestion + 1,
          total_questoes:
            questoes.length,
        },
      })
    }

    setCurrentQuestion(
      (c) => c - 1
    )

    resetQuestionState()
  }

  function irParaProxima() {
    const question =
      questoes[currentQuestion]

    /*
     * Se a questão ainda não foi respondida,
     * o botão "Pular" chama esta função.
     *
     * Nesse caso registramos especificamente
     * que ela foi pulada.
     */
    if (
      !showResult &&
      tema &&
      question
    ) {
      const pergunta =
        question.pergunta ||
        question.enunciado ||
        `Questão ${currentQuestion + 1}`

      trackEvent({
        event_type:
          "question_skipped",

        page_path: `/questoes/${tema.slug}`,

        section: "questoes",

        slug: tema.slug,

        title: pergunta,

        content_id: question.id,

        content_type: "question",

        value: currentQuestion + 1,

        duration_seconds:
          getQuestionDuration(),

        metadata: {
          tema_id: tema.id,

          tema_titulo:
            tema.titulo,

          tema_slug:
            tema.slug,

          tipo:
            question.tipo ||
            "fechada",

          posicao:
            currentQuestion + 1,

          total_questoes:
            questoes.length,
        },
      })
    }

    if (
      currentQuestion <
      questoes.length - 1
    ) {
      setCurrentQuestion(
        (c) => c + 1
      )

      resetQuestionState()
    } else {
      finalizarQuiz()
    }
  }

  /*
   * ============================================================
   * FINALIZAÇÃO DO QUIZ
   * ============================================================
   */

  function finalizarQuiz() {
    if (!tema) {
      setFinished(true)

      return
    }

    const totalFechadas =
      questoes.filter(
        (q) =>
          (q.tipo || "fechada") ===
          "fechada"
      ).length

    const totalAbertas =
      questoes.filter(
        (q) => q.tipo === "aberta"
      ).length

    const percentual =
      answeredClosed > 0
        ? Math.round(
            (score /
              answeredClosed) *
              100
          )
        : null

    const totalRespondidas =
      answeredClosed +
      answeredOpen

    const totalPuladas =
      Math.max(
        0,
        questoes.length -
          totalRespondidas
      )

    trackEvent({
      event_type:
        "quiz_completed",

      page_path: `/questoes/${tema.slug}`,

      section: "questoes",

      slug: tema.slug,

      title: tema.titulo,

      content_id: tema.id,

      content_type: "quiz",

      success:
        percentual !== null
          ? percentual >= 70
          : undefined,

      value:
        percentual ?? 0,

      duration_seconds:
        getQuizDuration(),

      metadata: {
        tema_id: tema.id,

        tema_slug: tema.slug,

        total_questoes:
          questoes.length,

        total_fechadas:
          totalFechadas,

        total_abertas:
          totalAbertas,

        respondidas_fechadas:
          answeredClosed,

        respondidas_abertas:
          answeredOpen,

        total_respondidas:
          totalRespondidas,

        total_puladas:
          totalPuladas,

        acertos:
          score,

        erros:
          Math.max(
            0,
            answeredClosed -
              score
          ),

        percentual:
          percentual,
      },
    })

    setFinished(true)
  }

  /*
   * ============================================================
   * ESTADOS DE CARREGAMENTO
   * ============================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                Carregando quiz...
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (
    !tema ||
    questoes.length === 0
  ) {
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

  /*
   * ============================================================
   * DADOS DA QUESTÃO ATUAL
   * ============================================================
   */

  const question =
    questoes[currentQuestion]

  const totalQuestions =
    questoes.length

  const tipoQuestao =
    question.tipo || "fechada"

  const pergunta =
    question.pergunta ||
    question.enunciado ||
    ""

  const comentario =
    question.comentario ||
    question.explicacao ||
    ""

  const respostaComentada =
    question.resposta_aberta ||
    comentario ||
    "Sem resposta comentada cadastrada."

  const alternativas = [
    question.alternativa_a,
    question.alternativa_b,
    question.alternativa_c,
    question.alternativa_d,
    question.alternativa_e,
  ].filter(
    (alt): alt is string =>
      Boolean(
        alt &&
          alt.trim()
      )
  )

  const correta =
    question.correta ||
    question.resposta_correta ||
    "A"

  const corretaIndex = [
    "A",
    "B",
    "C",
    "D",
    "E",
  ].indexOf(
    String(correta).toUpperCase()
  )

  /*
   * ============================================================
   * SELEÇÃO DE RESPOSTA
   * ============================================================
   */

  function handleSelect(
    index: number
  ) {
    if (showResult) return

    setSelectedAnswer(index)
  }

  /*
   * ============================================================
   * CONFIRMAÇÃO DA RESPOSTA
   * ============================================================
   */

  function handleConfirm() {
    if (
      tipoQuestao ===
        "fechada" &&
      selectedAnswer === null
    ) {
      return
    }

    if (
      tipoQuestao ===
        "aberta" &&
      !openAnswer.trim()
    ) {
      return
    }

    setShowResult(true)

    /*
     * ------------------------------------------------------------
     * QUESTÃO FECHADA
     * ------------------------------------------------------------
     */

    if (
      tipoQuestao ===
      "fechada"
    ) {
      const acertou =
        corretaIndex >= 0 &&
        selectedAnswer ===
          corretaIndex

      setAnsweredClosed(
        (value) => value + 1
      )

      if (acertou) {
        setScore(
          (s) => s + 1
        )
      }

      const letraSelecionada =
        selectedAnswer !== null
          ? String.fromCharCode(
              65 +
                selectedAnswer
            )
          : null

      const letraCorreta =
        corretaIndex >= 0
          ? String.fromCharCode(
              65 +
                corretaIndex
            )
          : null

      trackEvent({
        event_type:
          "question_answered",

        page_path: `/questoes/${tema.slug}`,

        section: "questoes",

        slug: tema.slug,

        title: pergunta,

        content_id:
          question.id,

        content_type:
          "question",

        success:
          acertou,

        value:
          currentQuestion + 1,

        duration_seconds:
          getQuestionDuration(),

        metadata: {
          tema_id:
            tema.id,

          tema_titulo:
            tema.titulo,

          tema_slug:
            tema.slug,

          tipo:
            "fechada",

          posicao:
            currentQuestion + 1,

          total_questoes:
            totalQuestions,

          alternativa_selecionada:
            letraSelecionada,

          alternativa_correta:
            letraCorreta,

          acertou:
            acertou,
        },
      })
    }

    /*
     * ------------------------------------------------------------
     * QUESTÃO ABERTA
     * ------------------------------------------------------------
     *
     * Não armazenamos o texto digitado pelo usuário.
     *
     * Também não marcamos success true/false,
     * porque a questão aberta não possui correção automática.
     */

    else {
      setAnsweredOpen(
        (value) => value + 1
      )

      trackEvent({
        event_type:
          "question_answered",

        page_path: `/questoes/${tema.slug}`,

        section: "questoes",

        slug: tema.slug,

        title: pergunta,

        content_id:
          question.id,

        content_type:
          "question",

        value:
          currentQuestion + 1,

        duration_seconds:
          getQuestionDuration(),

        metadata: {
          tema_id:
            tema.id,

          tema_titulo:
            tema.titulo,

          tema_slug:
            tema.slug,

          tipo:
            "aberta",

          posicao:
            currentQuestion + 1,

          total_questoes:
            totalQuestions,

          resposta_preenchida:
            true,

          tamanho_resposta:
            openAnswer.trim()
              .length,
        },
      })
    }
  }

  /*
   * ============================================================
   * PRÓXIMA QUESTÃO
   * ============================================================
   */

  function handleNext() {
    if (
      currentQuestion <
      questoes.length - 1
    ) {
      setCurrentQuestion(
        (c) => c + 1
      )

      resetQuestionState()
    } else {
      finalizarQuiz()
    }
  }

  /*
   * ============================================================
   * REINICIAR QUIZ
   * ============================================================
   */

  function handleRestart() {
    trackEvent({
      event_type:
        "quiz_restart",

      page_path: `/questoes/${tema.slug}`,

      section: "questoes",

      slug: tema.slug,

      title: tema.titulo,

      content_id: tema.id,

      content_type: "quiz",

      metadata: {
        tema_id: tema.id,

        tema_slug:
          tema.slug,

        total_questoes:
          questoes.length,

        score_anterior:
          score,

        respondidas_fechadas:
          answeredClosed,

        respondidas_abertas:
          answeredOpen,
      },
    })

    setCurrentQuestion(0)

    setSelectedAnswer(null)

    setOpenAnswer("")

    setShowResult(false)

    setScore(0)

    setAnsweredClosed(0)

    setAnsweredOpen(0)

    setFinished(false)

    quizStartTime.current =
      Date.now()

    questionStartTime.current =
      Date.now()
  }

  /*
   * ============================================================
   * RESULTADO FINAL
   * ============================================================
   */

  if (finished) {
    const totalFechadas =
      questoes.filter(
        (q) =>
          (q.tipo ||
            "fechada") ===
          "fechada"
      ).length

    const totalAbertas =
      questoes.filter(
        (q) =>
          q.tipo === "aberta"
      ).length

    const percentage =
      answeredClosed > 0
        ? Math.round(
            (score /
              answeredClosed) *
              100
          )
        : null

    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 lg:py-12">

            <div className="bg-card rounded-3xl border border-border p-8 text-center shadow-xl shadow-sky-500/5">

              <div
                className={cn(
                  "inline-flex items-center justify-center w-24 h-24 rounded-full mb-6",

                  percentage ===
                    null
                    ? "bg-sky-500/10"
                    : percentage >=
                        70
                      ? "bg-emerald-500/10"
                      : "bg-amber-500/10"
                )}
              >
                {percentage ===
                null ? (
                  <CheckCircle className="h-10 w-10 text-sky-400" />
                ) : (
                  <span
                    className={cn(
                      "text-3xl font-bold",

                      percentage >=
                        70
                        ? "text-emerald-500"
                        : "text-amber-500"
                    )}
                  >
                    {percentage}%
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                Quiz finalizado!
              </h2>

              <p className="text-muted-foreground mb-6">
                Você chegou ao final das questões.
              </p>

              <div className="mb-6 grid gap-3 text-left sm:grid-cols-2">

                <div className="rounded-2xl border border-border bg-background/60 p-4">

                  <p className="text-sm text-muted-foreground">
                    Questões fechadas
                  </p>

                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {score} acertos
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {answeredClosed} respondidas de{" "}
                    {totalFechadas}
                  </p>

                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-4">

                  <p className="text-sm text-muted-foreground">
                    Questões abertas
                  </p>

                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {answeredOpen} respondidas
                  </p>

                  <p className="text-xs text-muted-foreground">
                    de {totalAbertas} questões abertas
                  </p>

                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">

                <Button
                  variant="outline"
                  onClick={
                    handleRestart
                  }
                >
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

  /*
   * ============================================================
   * INTERFACE PRINCIPAL DO QUIZ
   * ============================================================
   */

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

          {/* CABEÇALHO DO QUIZ */}

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
                  {tema.descricao ||
                    "Questões comentadas"}
                </p>

              </div>

            </div>

            <div className="mt-5">

              <div className="flex items-center justify-between text-sm mb-2">

                <span className="text-muted-foreground">
                  Questão{" "}
                  {currentQuestion + 1} de{" "}
                  {totalQuestions}
                </span>

                <span className="font-medium text-sky-400">
                  {score} acertos
                </span>

              </div>

              <div className="h-2 bg-secondary rounded-full overflow-hidden">

                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-300"
                  style={{
                    width: `${
                      ((currentQuestion +
                        1) /
                        totalQuestions) *
                      100
                    }%`,
                  }}
                />

              </div>

            </div>

          </section>

          {/* QUESTÃO */}

          <section className="bg-card rounded-3xl border border-border overflow-hidden shadow-xl shadow-sky-500/5">

            <div className="p-5 sm:p-8">

              <div className="mb-4 inline-flex rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-500 dark:text-sky-400">
                {tipoQuestao ===
                "aberta"
                  ? "Questão aberta"
                  : "Questão fechada"}
              </div>

              <div className="mb-6 text-lg font-semibold leading-relaxed text-foreground">

                <ReactMarkdown
                  components={{
                    p: ({
                      children,
                    }) => (
                      <p className="mb-4 leading-relaxed text-foreground">
                        {children}
                      </p>
                    ),

                    strong: ({
                      children,
                    }) => (
                      <strong className="font-bold text-sky-400">
                        {children}
                      </strong>
                    ),

                    img: ({
                      src,
                      alt,
                    }) => (
                      <div className="my-6 flex justify-center">
                        <img
                          src={
                            src ||
                            ""
                          }
                          alt={
                            alt ||
                            ""
                          }
                          className="max-h-[420px] max-w-full rounded-2xl border border-border bg-white object-contain shadow-lg sm:max-w-[620px]"
                        />
                      </div>
                    ),
                  }}
                >
                  {pergunta}
                </ReactMarkdown>

              </div>

              {question.imagem_url && (
                <div className="mb-6 flex justify-center">

                  <img
                    src={
                      question.imagem_url
                    }
                    alt="Imagem da questão"
                    className="max-h-[420px] max-w-full rounded-2xl border border-border bg-white object-contain shadow-lg sm:max-w-[620px]"
                  />

                </div>
              )}

              {/* QUESTÃO FECHADA */}

              {tipoQuestao ===
              "fechada" ? (

                <div className="space-y-3">

                  {alternativas.map(
                    (
                      alt,
                      index
                    ) => {
                      const isSelected =
                        selectedAnswer ===
                        index

                      const isCorrect =
                        index ===
                        corretaIndex

                      const showCorrect =
                        showResult &&
                        isCorrect

                      const showWrong =
                        showResult &&
                        isSelected &&
                        !isCorrect

                      return (
                        <button
                          key={
                            index
                          }
                          onClick={() =>
                            handleSelect(
                              index
                            )
                          }
                          disabled={
                            showResult
                          }
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

                            showWrong &&
                              "border-rose-500 bg-rose-500/10",

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

                              showCorrect &&
                                "bg-emerald-500 text-white",

                              showWrong &&
                                "bg-rose-500 text-white"
                            )}
                          >
                            {showCorrect ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : showWrong ? (
                              <XCircle className="h-5 w-5" />
                            ) : (
                              String.fromCharCode(
                                65 +
                                  index
                              )
                            )}
                          </span>

                          <span className="flex-1 text-sm sm:text-base text-foreground">
                            {alt}
                          </span>

                        </button>
                      )
                    }
                  )}

                </div>

              ) : (

                /* QUESTÃO ABERTA */

                <div className="space-y-4">

                  <textarea
                    value={
                      openAnswer
                    }
                    onChange={(e) =>
                      setOpenAnswer(
                        e.target
                          .value
                      )
                    }
                    disabled={
                      showResult
                    }
                    placeholder="Digite sua resposta aqui..."
                    className="min-h-36 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-sky-500 disabled:opacity-70"
                  />

                  {!showResult && (
                    <p className="text-xs text-muted-foreground">
                      Depois de responder, clique em confirmar para ver a resposta comentada.
                    </p>
                  )}

                </div>

              )}

              {/* RESULTADO DA QUESTÃO */}

              {showResult && (

                <div className="mt-6 space-y-4">

                  {tipoQuestao ===
                  "aberta" ? (

                    <>
                      <div className="rounded-2xl border border-border bg-muted/40 p-4">

                        <p className="mb-1 text-sm font-medium text-foreground">
                          Sua resposta:
                        </p>

                        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {
                            openAnswer
                          }
                        </p>

                      </div>

                      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">

                        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-500 dark:text-sky-400">

                          <Eye className="h-4 w-4" />

                          Resposta comentada:

                        </p>

                        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                          {
                            respostaComentada
                          }
                        </p>

                      </div>
                    </>

                  ) : (

                    <div className="rounded-2xl border border-border bg-muted/50 p-4">

                      <p className="text-sm font-medium text-foreground mb-1">
                        Comentário:
                      </p>

                      <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                        {comentario ||
                          "Sem comentário cadastrado."}
                      </p>

                    </div>

                  )}

                </div>

              )}

            </div>

            {/* CONTROLES */}

            <div className="px-5 sm:px-8 py-4 border-t border-border bg-muted/30 flex flex-col sm:flex-row sm:justify-between gap-3">

              <Button
                type="button"
                variant="outline"
                disabled={
                  currentQuestion ===
                  0
                }
                onClick={
                  irParaAnterior
                }
              >
                Voltar
              </Button>

              <div className="flex flex-col sm:flex-row justify-end gap-3">

                {!showResult && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      irParaProxima
                    }
                  >
                    Pular

                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}

                {!showResult ? (

                  <Button
                    onClick={
                      handleConfirm
                    }
                    disabled={
                      tipoQuestao ===
                      "fechada"
                        ? selectedAnswer ===
                          null
                        : !openAnswer.trim()
                    }
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    Confirmar
                  </Button>

                ) : (

                  <Button
                    onClick={
                      handleNext
                    }
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    {currentQuestion <
                    totalQuestions -
                      1 ? (
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

            </div>

          </section>

        </div>

      </main>
    </div>
  )
}
