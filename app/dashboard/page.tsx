"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  Monitor,
  MousePointerClick,
  RefreshCw,
  Smartphone,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { supabase } from "@/lib/supabase"
import { isAdminEmail } from "@/lib/admin"

type AnalyticsMetadata = Record<string, any> | null

type AnalyticsEvent = {
  id: string
  created_at: string
  event_type: string
  page_path: string | null
  section: string | null
  slug: string | null
  title: string | null
  visitor_id: string | null
  session_id: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  referrer: string | null
  duration_seconds: number | null

  content_id: string | null
  content_type: string | null
  success: boolean | null
  value: number | null
  metadata: AnalyticsMetadata
}

type Periodo =
  | "hoje"
  | "7d"
  | "30d"
  | "90d"
  | "todos"
  | "personalizado"

type ItemContagem = {
  nome: string
  total: number
}

type QuestaoDificil = {
  id: string
  titulo: string
  tema: string
  respostas: number
  acertos: number
  erros: number
  taxa: number
}

type ResumoEngajamento = {
  id: string
  titulo: string
  inicios: number
  conclusoes: number
  taxaConclusao: number
  tempoMedio: number
  etapaMedia: number
  totalEtapas: number
  abandonos: number
}

type FunilResumoItem = {
  nome: string
  total: number
  percentual: number
}

type AbandonoResumoItem = {
  nome: string
  total: number
}

export default function DashboardPage() {
  const router = useRouter()

  const [events, setEvents] = useState<AnalyticsEvent[]>([])

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")

  const [periodo, setPeriodo] =
    useState<Periodo>("30d")

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const [secao, setSecao] = useState("todos")
  const [dispositivo, setDispositivo] =
    useState("todos")

  const [tipoEvento, setTipoEvento] =
    useState("todos")

  /*
   * ============================================================
   * DATAS
   * ============================================================
   */

  function obterDataInicial(periodoSelecionado: Periodo) {
    const agora = new Date()

    if (periodoSelecionado === "todos") {
      return null
    }

    if (periodoSelecionado === "personalizado") {
      if (!dataInicio) return null

      const data = new Date(`${dataInicio}T00:00:00`)

      return data.toISOString()
    }

    if (periodoSelecionado === "hoje") {
      const data = new Date()

      data.setHours(0, 0, 0, 0)

      return data.toISOString()
    }

    const dias =
      periodoSelecionado === "7d"
        ? 7
        : periodoSelecionado === "30d"
          ? 30
          : 90

    agora.setDate(agora.getDate() - dias)

    agora.setHours(0, 0, 0, 0)

    return agora.toISOString()
  }

  function obterDataFinal(periodoSelecionado: Periodo) {
    if (
      periodoSelecionado !== "personalizado" ||
      !dataFim
    ) {
      return null
    }

    const data = new Date(`${dataFim}T23:59:59.999`)

    return data.toISOString()
  }

  /*
   * ============================================================
   * CARREGAMENTO DOS DADOS
   * ============================================================
   */

  const carregarDashboard = useCallback(async () => {
    setLoading(true)
    setErro("")

    try {
      const { data: userData } =
        await supabase.auth.getUser()

      const email = userData.user?.email

      if (!email || !isAdminEmail(email)) {
        router.push("/")
        return
      }

      const inicio = obterDataInicial(periodo)
      const fim = obterDataFinal(periodo)

      /*
       * O Supabase normalmente retorna no máximo
       * 1000 registros por consulta.
       *
       * Aqui buscamos em lotes para não limitar
       * o dashboard aos últimos 1000 eventos.
       */
      const tamanhoLote = 1000

      let inicioLote = 0
      let continuar = true

      const todosEventos: AnalyticsEvent[] = []

      while (continuar) {
        let query = supabase
          .from("site_analytics")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .range(
            inicioLote,
            inicioLote + tamanhoLote - 1
          )

        if (inicio) {
          query = query.gte("created_at", inicio)
        }

        if (fim) {
          query = query.lte("created_at", fim)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        const lote =
          (data || []) as AnalyticsEvent[]

        todosEventos.push(...lote)

        if (lote.length < tamanhoLote) {
          continuar = false
        } else {
          inicioLote += tamanhoLote
        }
      }

      setEvents(todosEventos)
    } catch (error) {
      console.error(error)

      setErro(
        "Não foi possível carregar os dados de analytics."
      )
    } finally {
      setLoading(false)
    }
  }, [
    router,
    periodo,
    dataInicio,
    dataFim,
  ])

  useEffect(() => {
    if (
      periodo === "personalizado" &&
      (!dataInicio || !dataFim)
    ) {
      return
    }

    carregarDashboard()
  }, [carregarDashboard])

  /*
   * ============================================================
   * OPÇÕES DOS FILTROS
   * ============================================================
   */

  const tiposDeEvento = useMemo(() => {
    return Array.from(
      new Set(
        events
          .map((evento) => evento.event_type)
          .filter(Boolean)
      )
    ).sort()
  }, [events])

  /*
   * ============================================================
   * FILTROS LOCAIS
   * ============================================================
   */

  const eventosFiltrados = useMemo(() => {
    return events.filter((evento) => {
      if (
        secao !== "todos" &&
        evento.section !== secao
      ) {
        return false
      }

      if (
        dispositivo !== "todos" &&
        evento.device_type !== dispositivo
      ) {
        return false
      }

      if (
        tipoEvento !== "todos" &&
        evento.event_type !== tipoEvento
      ) {
        return false
      }

      return true
    })
  }, [
    events,
    secao,
    dispositivo,
    tipoEvento,
  ])

  /*
   * ============================================================
   * CÁLCULOS
   * ============================================================
   */

  const dados = useMemo(() => {
    /*
     * Eventos que representam alguma visualização
     * real de página ou conteúdo.
     *
     * Assim um clique em "próximo flashcard",
     * por exemplo, não é contado como uma nova
     * visita ao site.
     */
    const eventosDeAcesso =
      eventosFiltrados.filter((evento) =>
        [
          "page_view",
          "resumo_view",
          "flashcards_view",
          "quiz_view",
          "questoes_view",
        ].includes(evento.event_type)
      )

    const totalAcessos =
      eventosDeAcesso.length

    const totalEventos =
      eventosFiltrados.length

    const visitantesUnicos = new Set(
      eventosFiltrados
        .map((evento) => evento.visitor_id)
        .filter(Boolean)
    ).size

    const sessoes = new Set(
      eventosFiltrados
        .map((evento) => evento.session_id)
        .filter(Boolean)
    ).size

    /*
     * Tempo médio.
     *
     * Damos preferência a eventos que realmente
     * representam uma duração completa.
     */
    const eventosTempo =
      eventosFiltrados.filter(
        (evento) =>
          typeof evento.duration_seconds === "number" &&
          Number(evento.duration_seconds) >= 0 &&
          [
            "resumo_exit",
            "quiz_completed",
            "question_answered",
          ].includes(evento.event_type)
      )

    const tempoMedio =
      eventosTempo.length > 0
        ? Math.round(
            eventosTempo.reduce(
              (soma, evento) =>
                soma +
                Number(
                  evento.duration_seconds || 0
                ),
              0
            ) / eventosTempo.length
          )
        : 0

    /*
     * ========================================================
     * RESUMOS / LEITURA POR ETAPAS
     * ========================================================
     */

    const resumoViews =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type === "resumo_view"
      )

    const resumoOpens =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type === "resumo_open"
      )

    const resumoStepViews =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type === "resumo_step_view"
      )

    const resumoCompletes =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type === "resumo_complete"
      )

    const resumoExits =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type === "resumo_exit"
      )

    const resumoLegacyComplete =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type === "resumo_read_progress" &&
          Number(evento.value) === 100
      )

    function resumoId(evento: AnalyticsEvent) {
      return (
        evento.content_id ||
        evento.slug ||
        evento.title ||
        "resumo-desconhecido"
      )
    }

    function chaveLeitura(evento: AnalyticsEvent) {
      const conteudo = resumoId(evento)

      if (evento.session_id) {
        return `${conteudo}::session::${evento.session_id}`
      }

      if (evento.visitor_id) {
        return `${conteudo}::visitor::${evento.visitor_id}`
      }

      return `${conteudo}::event::${evento.id}`
    }

    const leiturasIniciadasSet = new Set(
      resumoViews.map(chaveLeitura)
    )

    const leiturasConcluidasSet = new Set([
      ...resumoCompletes.map(chaveLeitura),
      ...resumoLegacyComplete.map(chaveLeitura),
    ])

    const leiturasIniciadas = leiturasIniciadasSet.size
    const leiturasConcluidas = leiturasConcluidasSet.size

    const taxaConclusaoResumo =
      leiturasIniciadas > 0
        ? Math.min(
            100,
            Math.round(
              (leiturasConcluidas / leiturasIniciadas) * 100
            )
          )
        : 0

    const resumoExitsComDuracao = resumoExits.filter(
      (evento) =>
        typeof evento.duration_seconds === "number" &&
        Number(evento.duration_seconds) >= 0
    )

    const tempoMedioResumo =
      resumoExitsComDuracao.length > 0
        ? Math.round(
            resumoExitsComDuracao.reduce(
              (acc, evento) =>
                acc + Number(evento.duration_seconds || 0),
              0
            ) / resumoExitsComDuracao.length
          )
        : 0

    /*
     * Maior etapa alcançada por leitura.
     */
    const progressoPorLeitura = new Map<
      string,
      {
        etapa: number
        totalEtapas: number
        resumo: string
        titulo: string
      }
    >()

    resumoStepViews.forEach((evento) => {
      const chave = chaveLeitura(evento)
      const etapa = Math.max(
        1,
        Number(evento.value || evento.metadata?.etapa || 1)
      )
      const totalEtapas = Math.max(
        etapa,
        Number(evento.metadata?.total_etapas || etapa)
      )

      const atual = progressoPorLeitura.get(chave)

      if (!atual || etapa > atual.etapa) {
        progressoPorLeitura.set(chave, {
          etapa,
          totalEtapas: Math.max(
            totalEtapas,
            atual?.totalEtapas || 0
          ),
          resumo: resumoId(evento),
          titulo:
            evento.title ||
            evento.slug ||
            "Resumo",
        })
      }
    })

    const progressoLeituras = Array.from(
      progressoPorLeitura.values()
    )

    const etapaMediaResumo =
      progressoLeituras.length > 0
        ? Number(
            (
              progressoLeituras.reduce(
                (acc, item) => acc + item.etapa,
                0
              ) / progressoLeituras.length
            ).toFixed(1)
          )
        : 0

    const totalEtapasMedio =
      progressoLeituras.length > 0
        ? Number(
            (
              progressoLeituras.reduce(
                (acc, item) => acc + item.totalEtapas,
                0
              ) / progressoLeituras.length
            ).toFixed(1)
          )
        : 0

    /*
     * Funil global de etapas.
     * Cada leitura é contada apenas uma vez em cada etapa.
     */
    const maxEtapas = Math.min(
      12,
      Math.max(
        0,
        ...progressoLeituras.map(
          (item) => item.totalEtapas
        )
      )
    )

    const funilEtapas: FunilResumoItem[] = []

    if (leiturasIniciadas > 0) {
      funilEtapas.push({
        nome: "Iniciaram",
        total: leiturasIniciadas,
        percentual: 100,
      })

      for (let etapa = 2; etapa <= maxEtapas; etapa++) {
        const total = Array.from(
          progressoPorLeitura.values()
        ).filter(
          (item) => item.etapa >= etapa
        ).length

        funilEtapas.push({
          nome: `Etapa ${etapa}`,
          total,
          percentual: Math.min(
            100,
            Math.round(
              (total / leiturasIniciadas) * 100
            )
          ),
        })
      }

      funilEtapas.push({
        nome: "Concluíram",
        total: leiturasConcluidas,
        percentual: Math.min(
          100,
          Math.round(
            (leiturasConcluidas / leiturasIniciadas) * 100
          )
        ),
      })
    }

    /*
     * Onde as leituras são interrompidas.
     * Usa resumo_exit e etapa_maxima registrada pelo novo leitor.
     */
    const abandonosMapa = new Map<number, Set<string>>()

    resumoExits.forEach((evento) => {
      const chave = chaveLeitura(evento)

      if (leiturasConcluidasSet.has(chave)) {
        return
      }

      const etapaMaxima = Number(
        evento.metadata?.etapa_maxima || 0
      )

      if (etapaMaxima <= 0) return

      if (!abandonosMapa.has(etapaMaxima)) {
        abandonosMapa.set(etapaMaxima, new Set())
      }

      abandonosMapa.get(etapaMaxima)!.add(chave)
    })

    const abandonosPorEtapa: AbandonoResumoItem[] =
      Array.from(abandonosMapa.entries())
        .map(([etapa, chaves]) => ({
          nome: `Após a etapa ${etapa}`,
          total: chaves.size,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)

    /*
     * Desempenho individual de cada resumo.
     */
    const mapaResumos = new Map<
      string,
      {
        id: string
        titulo: string
        inicios: Set<string>
        conclusoes: Set<string>
        duracoes: number[]
        progresso: Map<string, { etapa: number; total: number }>
      }
    >()

    function garantirResumo(evento: AnalyticsEvent) {
      const id = resumoId(evento)

      if (!mapaResumos.has(id)) {
        mapaResumos.set(id, {
          id,
          titulo:
            evento.title ||
            evento.slug ||
            "Resumo",
          inicios: new Set(),
          conclusoes: new Set(),
          duracoes: [],
          progresso: new Map(),
        })
      }

      return mapaResumos.get(id)!
    }

    resumoViews.forEach((evento) => {
      garantirResumo(evento).inicios.add(
        chaveLeitura(evento)
      )
    })

    ;[...resumoCompletes, ...resumoLegacyComplete].forEach(
      (evento) => {
        garantirResumo(evento).conclusoes.add(
          chaveLeitura(evento)
        )
      }
    )

    resumoExitsComDuracao.forEach((evento) => {
      garantirResumo(evento).duracoes.push(
        Number(evento.duration_seconds || 0)
      )
    })

    resumoStepViews.forEach((evento) => {
      const resumoItem = garantirResumo(evento)
      const chave = chaveLeitura(evento)
      const etapa = Math.max(
        1,
        Number(evento.value || evento.metadata?.etapa || 1)
      )
      const total = Math.max(
        etapa,
        Number(evento.metadata?.total_etapas || etapa)
      )
      const atual = resumoItem.progresso.get(chave)

      if (!atual || etapa > atual.etapa) {
        resumoItem.progresso.set(chave, {
          etapa,
          total: Math.max(total, atual?.total || 0),
        })
      }
    })

    const desempenhoResumos: ResumoEngajamento[] =
      Array.from(mapaResumos.values())
        .map((item) => {
          const progresso = Array.from(
            item.progresso.values()
          )
          const inicios = item.inicios.size
          const conclusoes = item.conclusoes.size
          const tempoMedio =
            item.duracoes.length > 0
              ? Math.round(
                  item.duracoes.reduce(
                    (acc, valor) => acc + valor,
                    0
                  ) / item.duracoes.length
                )
              : 0
          const etapaMedia =
            progresso.length > 0
              ? Number(
                  (
                    progresso.reduce(
                      (acc, valor) => acc + valor.etapa,
                      0
                    ) / progresso.length
                  ).toFixed(1)
                )
              : 0
          const totalEtapas = Math.max(
            0,
            ...progresso.map((valor) => valor.total)
          )

          return {
            id: item.id,
            titulo: item.titulo,
            inicios,
            conclusoes,
            taxaConclusao:
              inicios > 0
                ? Math.min(
                    100,
                    Math.round(
                      (conclusoes / inicios) * 100
                    )
                  )
                : 0,
            tempoMedio,
            etapaMedia,
            totalEtapas,
            abandonos: Math.max(
              0,
              inicios - conclusoes
            ),
          }
        })
        .filter(
          (item) =>
            item.inicios > 0 ||
            item.conclusoes > 0
        )
        .sort((a, b) => b.inicios - a.inicios)

    /*
     * ========================================================
     * FLASHCARDS
     * ========================================================
     */

    const flashcardViews =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type === "flashcards_view"
      ).length

    const flashcardFlips =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type === "flashcard_flip" &&
          evento.success === true
      )

    const flashcardNext =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type === "flashcard_next"
      ).length

    /*
     * ========================================================
     * QUESTÕES
     * ========================================================
     */

    const quizzesAbertos =
      eventosFiltrados.filter(
        (evento) =>
          ["quiz_view", "quiz_open"].includes(
            evento.event_type
          )
      )

    const quizzesConcluidos =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type === "quiz_completed"
      )

    const questoesRespondidas =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type ===
          "question_answered"
      )

    const questoesFechadasRespondidas =
      questoesRespondidas.filter(
        (evento) =>
          evento.success === true ||
          evento.success === false
      )

    const acertos =
      questoesFechadasRespondidas.filter(
        (evento) => evento.success === true
      ).length

    const erros =
      questoesFechadasRespondidas.filter(
        (evento) => evento.success === false
      ).length

    const puladas =
      eventosFiltrados.filter(
        (evento) =>
          evento.event_type ===
          "question_skipped"
      ).length

    const taxaAcerto =
      questoesFechadasRespondidas.length > 0
        ? Math.round(
            (acertos /
              questoesFechadasRespondidas.length) *
              100
          )
        : 0

    const taxaConclusaoQuiz =
      quizzesAbertos.length > 0
        ? Math.min(
            100,
            Math.round(
              (quizzesConcluidos.length /
                quizzesAbertos.length) *
                100
            )
          )
        : 0

    /*
     * ========================================================
     * FUNÇÕES DE CONTAGEM
     * ========================================================
     */

    function contar(
      lista: AnalyticsEvent[],
      obterNome: (evento: AnalyticsEvent) => string
    ): ItemContagem[] {
      const mapa: Record<string, number> = {}

      lista.forEach((evento) => {
        const nome =
          obterNome(evento) ||
          "Não identificado"

        mapa[nome] =
          (mapa[nome] || 0) + 1
      })

      return Object.entries(mapa)
        .map(([nome, total]) => ({
          nome,
          total,
        }))
        .sort((a, b) => b.total - a.total)
    }

    /*
     * ========================================================
     * RESUMOS MAIS ACESSADOS
     * ========================================================
     */

    const resumosMaisAcessados = contar(
      resumoViews,
      (evento) =>
        evento.title ||
        evento.slug ||
        "Resumo"
    ).slice(0, 8)

    /*
     * ========================================================
     * FLASHCARDS MAIS UTILIZADOS
     * ========================================================
     */

    const flashcardsMaisUsados = contar(
      flashcardFlips,
      (evento) =>
        evento.title ||
        evento.content_id ||
        "Flashcard"
    ).slice(0, 8)

    /*
     * ========================================================
     * QUIZZES MAIS ACESSADOS
     * ========================================================
     */

    const quizzesMaisAcessados = contar(
      quizzesAbertos,
      (evento) =>
        evento.metadata?.tema_titulo ||
        evento.title ||
        evento.slug ||
        "Quiz"
    ).slice(0, 8)

    /*
     * ========================================================
     * QUESTÕES MAIS DIFÍCEIS
     * ========================================================
     */

    const mapaQuestoes = new Map<
      string,
      {
        titulo: string
        tema: string
        respostas: number
        acertos: number
        erros: number
      }
    >()

    questoesFechadasRespondidas.forEach(
      (evento) => {
        const id =
          evento.content_id ||
          evento.title ||
          evento.id

        if (!mapaQuestoes.has(id)) {
          mapaQuestoes.set(id, {
            titulo:
              evento.title ||
              "Questão sem título",

            tema:
              evento.metadata?.tema_titulo ||
              evento.slug ||
              "Sem tema",

            respostas: 0,
            acertos: 0,
            erros: 0,
          })
        }

        const item =
          mapaQuestoes.get(id)!

        item.respostas += 1

        if (evento.success) {
          item.acertos += 1
        } else {
          item.erros += 1
        }
      }
    )

    const questoesDificeis: QuestaoDificil[] =
      Array.from(
        mapaQuestoes.entries()
      )
        .map(([id, item]) => ({
          id,

          titulo: item.titulo,

          tema: item.tema,

          respostas: item.respostas,

          acertos: item.acertos,

          erros: item.erros,

          taxa:
            item.respostas > 0
              ? Math.round(
                  (item.acertos /
                    item.respostas) *
                    100
                )
              : 0,
        }))
        .filter(
          (item) =>
            item.respostas > 0
        )
        .sort(
          (a, b) =>
            a.taxa - b.taxa
        )
        .slice(0, 8)

    /*
     * ========================================================
     * DISPOSITIVOS
     * ========================================================
     */

    const dispositivos = contar(
      eventosDeAcesso,
      (evento) =>
        evento.device_type ||
        "Não identificado"
    )

    const navegadores = contar(
      eventosDeAcesso,
      (evento) =>
        evento.browser ||
        "Não identificado"
    )

    const sistemas = contar(
      eventosDeAcesso,
      (evento) =>
        evento.os ||
        "Não identificado"
    )

    /*
     * ========================================================
     * ORIGENS
     * ========================================================
     */

    const origens = contar(
      eventosDeAcesso,
      (evento) => {
        if (!evento.referrer) {
          return "Acesso direto"
        }

        try {
          const hostname =
            new URL(
              evento.referrer
            ).hostname

          return hostname.replace(
            /^www\./,
            ""
          )
        } catch {
          return evento.referrer
        }
      }
    ).slice(0, 8)

    /*
     * ========================================================
     * GRÁFICO DE ACESSOS POR DIA
     * ========================================================
     */

    const acessosPorDiaMap:
      Record<string, number> = {}

    eventosDeAcesso.forEach(
      (evento) => {
        const data = new Date(
          evento.created_at
        )

        const chave =
          `${data.getFullYear()}-` +
          `${String(
            data.getMonth() + 1
          ).padStart(2, "0")}-` +
          `${String(
            data.getDate()
          ).padStart(2, "0")}`

        acessosPorDiaMap[chave] =
          (acessosPorDiaMap[chave] ||
            0) + 1
      }
    )

    const acessosPorDia =
      Object.entries(
        acessosPorDiaMap
      )
        .map(([data, total]) => ({
          data,
          total,
        }))
        .sort((a, b) =>
          a.data.localeCompare(b.data)
        )

    /*
     * ========================================================
     * HORÁRIOS
     * ========================================================
     */

    const horarios = Array.from(
      { length: 24 },
      (_, hora) => ({
        hora,
        total: 0,
      })
    )

    eventosDeAcesso.forEach(
      (evento) => {
        const hora = new Date(
          evento.created_at
        ).getHours()

        horarios[hora].total += 1
      }
    )

    return {
      totalAcessos,
      totalEventos,
      visitantesUnicos,
      sessoes,
      tempoMedio,

      resumoViews:
        resumoViews.length,

      resumoOpens:
        resumoOpens.length,

      leiturasIniciadas,
      leiturasConcluidas,
      taxaConclusaoResumo,
      tempoMedioResumo,
      etapaMediaResumo,
      totalEtapasMedio,
      funilEtapas,
      abandonosPorEtapa,
      desempenhoResumos,

      flashcardViews,
      flashcardFlips:
        flashcardFlips.length,
      flashcardNext,

      quizzesAbertos:
        quizzesAbertos.length,

      quizzesConcluidos:
        quizzesConcluidos.length,

      questoesRespondidas:
        questoesRespondidas.length,

      acertos,
      erros,
      puladas,
      taxaAcerto,
      taxaConclusaoQuiz,

      resumosMaisAcessados,
      flashcardsMaisUsados,
      quizzesMaisAcessados,
      questoesDificeis,

      dispositivos,
      navegadores,
      sistemas,
      origens,

      acessosPorDia,
      horarios,
    }
  }, [eventosFiltrados])

  /*
   * ============================================================
   * FORMATAÇÃO
   * ============================================================
   */

  function formatarTempo(segundos: number) {
    if (!segundos) return "0s"

    if (segundos < 60) {
      return `${segundos}s`
    }

    const minutos =
      Math.floor(segundos / 60)

    const resto =
      segundos % 60

    if (minutos < 60) {
      return resto > 0
        ? `${minutos}m ${resto}s`
        : `${minutos}m`
    }

    const horas =
      Math.floor(minutos / 60)

    const minutosRestantes =
      minutos % 60

    return `${horas}h ${minutosRestantes}m`
  }

  function limparFiltros() {
    setSecao("todos")
    setDispositivo("todos")
    setTipoEvento("todos")
  }

  /*
   * ============================================================
   * CARREGAMENTO
   * ============================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Sidebar />

        <div className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

            <div className="flex min-h-[60vh] flex-col items-center justify-center">

              <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />

              <p className="mt-4 text-sm text-muted-foreground">
                Carregando analytics...
              </p>

            </div>

          </div>
        </div>
      </main>
    )
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-background">
        <Sidebar />

        <div className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6">

              <p className="text-sm text-rose-400">
                {erro}
              </p>

              <button
                onClick={
                  carregarDashboard
                }
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>

            </div>

          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Sidebar />

      <div className="lg:pl-64 pt-14 lg:pt-0">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">

          {/* ================================================== */}
          {/* CABEÇALHO                                          */}
          {/* ================================================== */}

          <div className="flex flex-col gap-4 mb-7 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2 mb-1">

                <div className="h-2 w-2 rounded-full bg-sky-400" />

                <p className="text-xs font-medium text-sky-400">
                  Administração
                </p>

              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Analytics
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Acompanhe como os alunos utilizam o hub de estudos.
              </p>

            </div>

            <button
              onClick={
                carregarDashboard
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-sky-500/30 hover:text-sky-400"
            >
              <RefreshCw className="h-4 w-4" />

              Atualizar
            </button>

          </div>

          {/* ================================================== */}
          {/* FILTROS                                            */}
          {/* ================================================== */}

          <section className="mb-6 rounded-2xl border border-border bg-card p-4">

            <div className="mb-4 flex items-center gap-2">

              <Filter className="h-4 w-4 text-sky-400" />

              <h2 className="text-sm font-semibold text-foreground">
                Filtros
              </h2>

            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <SelectFiltro
                label="Período"
                value={periodo}
                onChange={(value) =>
                  setPeriodo(
                    value as Periodo
                  )
                }
                options={[
                  {
                    value: "hoje",
                    label: "Hoje",
                  },
                  {
                    value: "7d",
                    label: "Últimos 7 dias",
                  },
                  {
                    value: "30d",
                    label: "Últimos 30 dias",
                  },
                  {
                    value: "90d",
                    label: "Últimos 90 dias",
                  },
                  {
                    value: "todos",
                    label: "Todo o período",
                  },
                  {
                    value: "personalizado",
                    label: "Personalizado",
                  },
                ]}
              />

              <SelectFiltro
                label="Seção"
                value={secao}
                onChange={setSecao}
                options={[
                  {
                    value: "todos",
                    label: "Todas",
                  },
                  {
                    value: "home",
                    label: "Início",
                  },
                  {
                    value: "resumos",
                    label: "Resumos",
                  },
                  {
                    value: "flashcards",
                    label: "Flashcards",
                  },
                  {
                    value: "questoes",
                    label: "Questões",
                  },
                ]}
              />

              <SelectFiltro
                label="Dispositivo"
                value={dispositivo}
                onChange={
                  setDispositivo
                }
                options={[
                  {
                    value: "todos",
                    label: "Todos",
                  },
                  {
                    value: "mobile",
                    label: "Celular",
                  },
                  {
                    value: "tablet",
                    label: "Tablet",
                  },
                  {
                    value: "desktop",
                    label: "Desktop",
                  },
                ]}
              />

              <SelectFiltro
                label="Evento"
                value={tipoEvento}
                onChange={
                  setTipoEvento
                }
                options={[
                  {
                    value: "todos",
                    label: "Todos os eventos",
                  },
                  ...tiposDeEvento.map(
                    (evento) => ({
                      value: evento,
                      label: evento,
                    })
                  ),
                ]}
              />

            </div>

            {periodo ===
              "personalizado" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 max-w-lg">

                <div>

                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Data inicial
                  </label>

                  <input
                    type="date"
                    value={
                      dataInicio
                    }
                    onChange={(e) =>
                      setDataInicio(
                        e.target.value
                      )
                    }
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-sky-500"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    Data final
                  </label>

                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) =>
                      setDataFim(
                        e.target.value
                      )
                    }
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-sky-500"
                  />

                </div>

              </div>
            )}

            {(secao !== "todos" ||
              dispositivo !== "todos" ||
              tipoEvento !== "todos") && (
              <button
                onClick={
                  limparFiltros
                }
                className="mt-4 text-xs font-medium text-sky-400 hover:text-sky-300"
              >
                Limpar filtros adicionais
              </button>
            )}

          </section>

          {/* ================================================== */}
          {/* MÉTRICAS PRINCIPAIS                                */}
          {/* ================================================== */}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

            <Card
              titulo="Acessos"
              valor={
                dados.totalAcessos
              }
              descricao="Visualizações"
              icon={<Eye />}
            />

            <Card
              titulo="Visitantes"
              valor={
                dados.visitantesUnicos
              }
              descricao="Usuários únicos"
              icon={<Users />}
            />

            <Card
              titulo="Sessões"
              valor={dados.sessoes}
              descricao="Sessões registradas"
              icon={<BarChart3 />}
            />

            <Card
              titulo="Tempo médio"
              valor={formatarTempo(
                dados.tempoMedio
              )}
              descricao="Eventos com duração"
              icon={<Clock />}
            />

            <Card
              titulo="Eventos"
              valor={
                dados.totalEventos
              }
              descricao="Interações registradas"
              icon={<Activity />}
            />

          </section>

          {/* ================================================== */}
          {/* GRÁFICO PRINCIPAL                                  */}
          {/* ================================================== */}

          <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">

            <Painel titulo="Acessos ao longo do tempo">

              <GraficoAcessos
                dados={
                  dados.acessosPorDia
                }
              />

            </Painel>

            <Painel titulo="Horários de acesso">

              <GraficoHorarios
                dados={dados.horarios}
              />

            </Painel>

          </section>

          {/* ================================================== */}
          {/* ÁREAS DO SITE                                      */}
          {/* ================================================== */}

          <div className="mt-8 mb-3">

            <h2 className="text-lg font-bold text-foreground">
              Uso dos conteúdos
            </h2>

            <p className="text-xs text-muted-foreground">
              Métricas específicas de cada área do hub
            </p>

          </div>

          <section className="grid gap-4 lg:grid-cols-3">

            {/* RESUMOS */}

            <Painel
              titulo="Resumos"
              icon={
                <FileText className="h-4 w-4" />
              }
            >

              <div className="grid grid-cols-2 gap-3">

                <MiniMetrica
                  titulo="Leituras iniciadas"
                  valor={dados.leiturasIniciadas}
                />

                <MiniMetrica
                  titulo="Concluídas"
                  valor={dados.leiturasConcluidas}
                />

                <MiniMetrica
                  titulo="Taxa de conclusão"
                  valor={`${dados.taxaConclusaoResumo}%`}
                />

                <MiniMetrica
                  titulo="Tempo médio"
                  valor={formatarTempo(
                    dados.tempoMedioResumo
                  )}
                />

              </div>

            </Painel>

            {/* FLASHCARDS */}

            <Painel
              titulo="Flashcards"
              icon={
                <Layers className="h-4 w-4" />
              }
            >

              <div className="grid grid-cols-2 gap-3">

                <MiniMetrica
                  titulo="Sessões"
                  valor={
                    dados.flashcardViews
                  }
                />

                <MiniMetrica
                  titulo="Respostas abertas"
                  valor={
                    dados.flashcardFlips
                  }
                />

                <MiniMetrica
                  titulo="Próximos cards"
                  valor={
                    dados.flashcardNext
                  }
                />

                <MiniMetrica
                  titulo="Interações"
                  valor={
                    dados.flashcardFlips +
                    dados.flashcardNext
                  }
                />

              </div>

            </Painel>

            {/* QUESTÕES */}

            <Painel
              titulo="Questões"
              icon={
                <HelpCircle className="h-4 w-4" />
              }
            >

              <div className="grid grid-cols-2 gap-3">

                <MiniMetrica
                  titulo="Respondidas"
                  valor={
                    dados.questoesRespondidas
                  }
                />

                <MiniMetrica
                  titulo="Acerto"
                  valor={`${dados.taxaAcerto}%`}
                />

                <MiniMetrica
                  titulo="Acertos"
                  valor={
                    dados.acertos
                  }
                />

                <MiniMetrica
                  titulo="Erros"
                  valor={dados.erros}
                />

              </div>

            </Painel>

          </section>

          {/* ================================================== */}
          {/* DESEMPENHO QUESTÕES                                */}
          {/* ================================================== */}

          <section className="mt-6 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">

            <Painel titulo="Desempenho dos quizzes">

              <div className="space-y-5">

                <Indicador
                  titulo="Taxa de acerto"
                  valor={
                    dados.taxaAcerto
                  }
                  sufixo="%"
                />

                <Indicador
                  titulo="Taxa de conclusão"
                  valor={
                    dados.taxaConclusaoQuiz
                  }
                  sufixo="%"
                />

                <div className="grid grid-cols-3 gap-2 pt-2">

                  <ResumoNumero
                    label="Acertos"
                    valor={
                      dados.acertos
                    }
                    icon={
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    }
                  />

                  <ResumoNumero
                    label="Erros"
                    valor={
                      dados.erros
                    }
                    icon={
                      <XCircle className="h-4 w-4 text-rose-400" />
                    }
                  />

                  <ResumoNumero
                    label="Puladas"
                    valor={
                      dados.puladas
                    }
                    icon={
                      <ChevronDown className="h-4 w-4 text-amber-400" />
                    }
                  />

                </div>

              </div>

            </Painel>

            <Painel
              titulo="Questões com maior dificuldade"
              icon={
                <Target className="h-4 w-4" />
              }
            >

              {dados.questoesDificeis.length ===
              0 ? (
                <Vazio />
              ) : (
                <div className="space-y-1">

                  {dados.questoesDificeis.map(
                    (questao, index) => (
                      <div
                        key={
                          questao.id
                        }
                        className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-muted/40"
                      >

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-xs font-semibold text-rose-400">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-medium text-foreground">
                            {
                              questao.titulo
                            }
                          </p>

                          <p className="truncate text-[10px] text-muted-foreground">
                            {
                              questao.tema
                            }{" "}
                            ·{" "}
                            {
                              questao.respostas
                            }{" "}
                            respostas
                          </p>

                        </div>

                        <div className="text-right shrink-0">

                          <p
                            className={`text-sm font-bold ${
                              questao.taxa <
                              50
                                ? "text-rose-400"
                                : questao.taxa <
                                    70
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                            }`}
                          >
                            {
                              questao.taxa
                            }
                            %
                          </p>

                          <p className="text-[9px] text-muted-foreground">
                            acerto
                          </p>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </Painel>

          </section>

          {/* ================================================== */}
          {/* ENGAJAMENTO DOS RESUMOS                            */}
          {/* ================================================== */}

          <div className="mt-8 mb-3">

            <h2 className="text-lg font-bold text-foreground">
              Engajamento nos resumos
            </h2>

            <p className="text-xs text-muted-foreground">
              Acompanhe até onde os alunos avançam e onde interrompem a leitura
            </p>

          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

            <Painel
              titulo="Funil de leitura"
              icon={<BookOpen className="h-4 w-4" />}
            >
              <FunilResumo dados={dados.funilEtapas} />
            </Painel>

            <Painel
              titulo="Onde os alunos param"
              icon={<TrendingUp className="h-4 w-4" />}
            >
              <Barras dados={dados.abandonosPorEtapa} />
            </Painel>

          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">

            <Painel
              titulo="Desempenho por resumo"
              icon={<FileText className="h-4 w-4" />}
            >
              <TabelaEngajamentoResumos
                dados={dados.desempenhoResumos}
                formatarTempo={formatarTempo}
              />
            </Painel>

            <Painel
              titulo="Leitura média"
              icon={<Target className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <MiniMetrica
                  titulo="Etapa média alcançada"
                  valor={
                    dados.etapaMediaResumo > 0
                      ? dados.totalEtapasMedio > 0
                        ? `${dados.etapaMediaResumo} de ${dados.totalEtapasMedio}`
                        : dados.etapaMediaResumo
                      : "—"
                  }
                />

                <MiniMetrica
                  titulo="Taxa geral de conclusão"
                  valor={`${dados.taxaConclusaoResumo}%`}
                />

                <MiniMetrica
                  titulo="Tempo médio de leitura"
                  valor={formatarTempo(dados.tempoMedioResumo)}
                />
              </div>
            </Painel>

          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-2">

            <Painel
              titulo="Resumos mais acessados"
              icon={<TrendingUp className="h-4 w-4" />}
            >
              <Ranking dados={dados.resumosMaisAcessados} />
            </Painel>

            <Painel
              titulo="Resumos com mais conclusões"
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              <Ranking
                dados={dados.desempenhoResumos
                  .filter((item) => item.conclusoes > 0)
                  .sort((a, b) => b.conclusoes - a.conclusoes)
                  .slice(0, 8)
                  .map((item) => ({
                    nome: item.titulo,
                    total: item.conclusoes,
                  }))}
              />
            </Painel>

          </section>

          {/* ================================================== */}
          {/* RANKINGS                                           */}
          {/* ================================================== */}

          <section className="mt-6 grid gap-5 xl:grid-cols-2">

            <Painel
              titulo="Flashcards mais estudados"
              icon={
                <Layers className="h-4 w-4" />
              }
            >

              <Ranking
                dados={
                  dados.flashcardsMaisUsados
                }
              />

            </Painel>

            <Painel
              titulo="Quizzes mais acessados"
              icon={
                <Target className="h-4 w-4" />
              }
            >

              <Ranking
                dados={
                  dados.quizzesMaisAcessados
                }
              />

            </Painel>

          </section>

          {/* ================================================== */}
          {/* TECNOLOGIA                                         */}
          {/* ================================================== */}

          <div className="mt-8 mb-3">

            <h2 className="text-lg font-bold text-foreground">
              Público e tecnologia
            </h2>

            <p className="text-xs text-muted-foreground">
              Dispositivos e formas de acesso
            </p>

          </div>

          <section className="grid gap-5 xl:grid-cols-4">

            <Painel
              titulo="Dispositivos"
              icon={
                <Smartphone className="h-4 w-4" />
              }
            >
              <Barras
                dados={
                  dados.dispositivos
                }
              />
            </Painel>

            <Painel
              titulo="Navegadores"
              icon={
                <Monitor className="h-4 w-4" />
              }
            >
              <Barras
                dados={
                  dados.navegadores
                }
              />
            </Painel>

            <Painel
              titulo="Sistemas"
              icon={
                <BarChart3 className="h-4 w-4" />
              }
            >
              <Barras
                dados={
                  dados.sistemas
                }
              />
            </Painel>

            <Painel
              titulo="Origem"
              icon={
                <MousePointerClick className="h-4 w-4" />
              }
            >
              <Ranking
                dados={
                  dados.origens
                }
                compacto
              />
            </Painel>

          </section>

          <div className="mt-8 text-center text-[10px] text-muted-foreground">
            Os dados exibidos são calculados a partir dos eventos registrados em site_analytics.
          </div>

        </div>

      </div>
    </main>
  )
}

/*
 * ==============================================================
 * COMPONENTES
 * ==============================================================
 */

function Card({
  titulo,
  valor,
  descricao,
  icon,
}: {
  titulo: string
  valor: string | number
  descricao: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs text-muted-foreground">
            {titulo}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {valor}
          </p>

          <p className="mt-1 text-[10px] text-muted-foreground">
            {descricao}
          </p>

        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
          {icon}
        </div>

      </div>

    </div>
  )
}

function Painel({
  titulo,
  icon,
  children,
}: {
  titulo: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">

      <div className="mb-5 flex items-center gap-2">

        {icon && (
          <div className="text-sky-400">
            {icon}
          </div>
        )}

        <h3 className="text-sm font-semibold text-foreground">
          {titulo}
        </h3>

      </div>

      {children}

    </div>
  )
}

function MiniMetrica({
  titulo,
  valor,
}: {
  titulo: string
  valor: string | number
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">

      <p className="text-[10px] text-muted-foreground">
        {titulo}
      </p>

      <p className="mt-1 text-lg font-bold text-foreground">
        {valor}
      </p>

    </div>
  )
}

function SelectFiltro({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: {
    value: string
    label: string
  }[]
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs text-muted-foreground">
        {label}
      </label>

      <div className="relative">

        <select
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className="h-10 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-9 text-xs text-foreground outline-none transition focus:border-sky-500"
        >
          {options.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {option.label}
              </option>
            )
          )}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      </div>

    </div>
  )
}

function Ranking({
  dados,
  compacto = false,
}: {
  dados: ItemContagem[]
  compacto?: boolean
}) {
  if (dados.length === 0) {
    return <Vazio />
  }

  return (
    <div className="space-y-1">

      {dados.map(
        (item, index) => (
          <div
            key={`${item.nome}-${index}`}
            className={`flex items-center gap-3 rounded-xl transition hover:bg-muted/40 ${
              compacto
                ? "px-1 py-2"
                : "px-2 py-2.5"
            }`}
          >

            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-[10px] font-semibold text-sky-400">
              {index + 1}
            </span>

            <span className="min-w-0 flex-1 truncate text-xs text-foreground">
              {item.nome}
            </span>

            <span className="rounded-lg bg-sky-500/10 px-2 py-1 text-[10px] font-semibold text-sky-400">
              {item.total}
            </span>

          </div>
        )
      )}

    </div>
  )
}

function Barras({
  dados,
}: {
  dados: ItemContagem[]
}) {
  if (dados.length === 0) {
    return <Vazio />
  }

  const maximo = Math.max(
    ...dados.map(
      (item) => item.total
    ),
    1
  )

  return (
    <div className="space-y-4">

      {dados.map((item) => {
        const porcentagem =
          Math.max(
            3,
            (item.total / maximo) *
              100
          )

        return (
          <div key={item.nome}>

            <div className="mb-1.5 flex items-center justify-between gap-3">

              <span className="truncate text-xs text-muted-foreground">
                {item.nome}
              </span>

              <span className="text-xs font-semibold text-foreground">
                {item.total}
              </span>

            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">

              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{
                  width: `${porcentagem}%`,
                }}
              />

            </div>

          </div>
        )
      })}

    </div>
  )
}

function Indicador({
  titulo,
  valor,
  sufixo = "",
}: {
  titulo: string
  valor: number
  sufixo?: string
}) {
  const largura =
    Math.min(
      100,
      Math.max(
        0,
        valor
      )
    )

  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <span className="text-xs text-muted-foreground">
          {titulo}
        </span>

        <span className="text-sm font-bold text-foreground">
          {valor}
          {sufixo}
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-secondary">

        <div
          className="h-full rounded-full bg-sky-500 transition-all"
          style={{
            width: `${largura}%`,
          }}
        />

      </div>

    </div>
  )
}

function ResumoNumero({
  label,
  valor,
  icon,
}: {
  label: string
  valor: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">

      <div className="mb-2">
        {icon}
      </div>

      <p className="text-lg font-bold text-foreground">
        {valor}
      </p>

      <p className="text-[9px] text-muted-foreground">
        {label}
      </p>

    </div>
  )
}

function GraficoAcessos({
  dados,
}: {
  dados: {
    data: string
    total: number
  }[]
}) {
  if (dados.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center">
        <Vazio />
      </div>
    )
  }

  const dadosExibidos =
    dados.length > 30
      ? dados.slice(-30)
      : dados

  const maiorValor =
    Math.max(
      ...dadosExibidos.map(
        (item) => item.total
      ),
      1
    )

  return (
    <div>

      <div className="flex h-52 items-end gap-1.5 sm:gap-2">

        {dadosExibidos.map(
          (item) => {
            const altura =
              Math.max(
                4,
                (item.total /
                  maiorValor) *
                  100
              )

            const data =
              new Date(
                `${item.data}T12:00:00`
              )

            return (
              <div
                key={
                  item.data
                }
                className="group relative flex h-full min-w-0 flex-1 items-end"
              >

                <div
                  className="w-full rounded-t-md bg-sky-500/70 transition hover:bg-sky-400"
                  style={{
                    height: `${altura}%`,
                  }}
                />

                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-lg group-hover:block">

                  {data.toLocaleDateString(
                    "pt-BR"
                  )}{" "}
                  · {item.total} acessos

                </div>

              </div>
            )
          }
        )}

      </div>

      <div className="mt-3 flex justify-between text-[9px] text-muted-foreground">

        <span>
          {new Date(
            `${dadosExibidos[0].data}T12:00:00`
          ).toLocaleDateString(
            "pt-BR",
            {
              day: "2-digit",
              month: "short",
            }
          )}
        </span>

        <span>
          {new Date(
            `${dadosExibidos[
              dadosExibidos.length -
                1
            ].data}T12:00:00`
          ).toLocaleDateString(
            "pt-BR",
            {
              day: "2-digit",
              month: "short",
            }
          )}
        </span>

      </div>

    </div>
  )
}

function GraficoHorarios({
  dados,
}: {
  dados: {
    hora: number
    total: number
  }[]
}) {
  const maximo =
    Math.max(
      ...dados.map(
        (item) => item.total
      ),
      1
    )

  return (
    <div className="grid grid-cols-6 gap-2">

      {dados.map((item) => {
        const intensidade =
          item.total /
          maximo

        return (
          <div
            key={
              item.hora
            }
            className="group"
          >

            <div
              className="flex aspect-square items-center justify-center rounded-lg bg-sky-500 text-[9px] font-medium text-white transition"
              style={{
                opacity:
                  item.total === 0
                    ? 0.08
                    : Math.max(
                        0.18,
                        intensidade
                      ),
              }}
              title={`${item.hora}h: ${item.total} acessos`}
            >
              {item.hora}h
            </div>

          </div>
        )
      })}

    </div>
  )
}

function FunilResumo({
  dados,
}: {
  dados: FunilResumoItem[]
}) {
  if (dados.length === 0) {
    return <Vazio />
  }

  return (
    <div className="space-y-4">
      {dados.map((item, index) => (
        <div key={`${item.nome}-${index}`}>
          <div className="mb-1.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                {item.nome}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                {item.total}
              </span>
              <span className="w-10 text-right text-[10px] text-muted-foreground">
                {item.percentual}%
              </span>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
              style={{
                width: `${Math.max(2, item.percentual)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function TabelaEngajamentoResumos({
  dados,
  formatarTempo,
}: {
  dados: ResumoEngajamento[]
  formatarTempo: (segundos: number) => string
}) {
  if (dados.length === 0) {
    return <Vazio />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pr-4 font-semibold">Resumo</th>
            <th className="pb-3 px-3 text-center font-semibold">Inícios</th>
            <th className="pb-3 px-3 text-center font-semibold">Conclusões</th>
            <th className="pb-3 px-3 text-center font-semibold">Taxa</th>
            <th className="pb-3 px-3 text-center font-semibold">Etapa média</th>
            <th className="pb-3 pl-3 text-right font-semibold">Tempo médio</th>
          </tr>
        </thead>

        <tbody>
          {dados.slice(0, 10).map((item) => (
            <tr
              key={item.id}
              className="border-b border-border/70 last:border-0"
            >
              <td className="py-3 pr-4">
                <p className="max-w-[260px] truncate text-xs font-medium text-foreground">
                  {item.titulo}
                </p>
              </td>

              <td className="px-3 py-3 text-center text-xs text-foreground">
                {item.inicios}
              </td>

              <td className="px-3 py-3 text-center text-xs text-foreground">
                {item.conclusoes}
              </td>

              <td className="px-3 py-3 text-center">
                <span
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                    item.taxaConclusao >= 70
                      ? "bg-emerald-500/10 text-emerald-400"
                      : item.taxaConclusao >= 40
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {item.taxaConclusao}%
                </span>
              </td>

              <td className="px-3 py-3 text-center text-xs text-muted-foreground">
                {item.etapaMedia > 0
                  ? item.totalEtapas > 0
                    ? `${item.etapaMedia} / ${item.totalEtapas}`
                    : item.etapaMedia
                  : "—"}
              </td>

              <td className="py-3 pl-3 text-right text-xs text-muted-foreground">
                {formatarTempo(item.tempoMedio)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Vazio() {
  return (
    <div className="py-6 text-center">

      <BarChart3 className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />

      <p className="text-xs text-muted-foreground">
        Ainda não há dados suficientes.
      </p>

    </div>
  )
}
