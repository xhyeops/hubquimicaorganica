"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Clock, Eye, FileText, HelpCircle, Layers, Monitor, Smartphone, Users } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { supabase } from "@/lib/supabase"
import { isAdminEmail } from "@/lib/admin"

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
}

export default function DashboardPage() {
  const router = useRouter()

  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")

  useEffect(() => {
    async function carregarDashboard() {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()
      const email = userData.user?.email

      if (!email || !isAdminEmail(email)) {
        router.push("/")
        return
      }

      const { data, error } = await supabase
        .from("site_analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000)

      if (error) {
        console.error(error)
        setErro("Erro ao carregar analytics.")
        setLoading(false)
        return
      }

      setEvents(data || [])
      setLoading(false)
    }

    carregarDashboard()
  }, [router])

  const dados = useMemo(() => {
    const totalAcessos = events.length

    const visitantesUnicos = new Set(
      events.map((e) => e.visitor_id).filter(Boolean)
    ).size

    const sessoes = new Set(
      events.map((e) => e.session_id).filter(Boolean)
    ).size

    const resumos = events.filter((e) => e.section === "resumos").length
    const flashcards = events.filter((e) => e.section === "flashcards").length
    const questoes = events.filter((e) => e.section === "questoes").length

    const eventosComDuracao = events.filter(
      (e) => typeof e.duration_seconds === "number"
    )

    const tempoMedio =
      eventosComDuracao.length > 0
        ? Math.round(
            eventosComDuracao.reduce(
              (acc, item) => acc + Number(item.duration_seconds || 0),
              0
            ) / eventosComDuracao.length
          )
        : 0

    function contarPorTitulo(section?: string) {
      const mapa: Record<string, number> = {}

      events
        .filter((e) => (section ? e.section === section : true))
        .forEach((e) => {
          const nome = e.title || e.slug || e.page_path || "Sem título"
          mapa[nome] = (mapa[nome] || 0) + 1
        })

      return Object.entries(mapa)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
    }

    function contarPorCampo(campo: keyof AnalyticsEvent) {
      const mapa: Record<string, number> = {}

      events.forEach((e) => {
        const valor = String(e[campo] || "Não identificado")
        mapa[valor] = (mapa[valor] || 0) + 1
      })

      return Object.entries(mapa)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6)
    }

    return {
      totalAcessos,
      visitantesUnicos,
      sessoes,
      resumos,
      flashcards,
      questoes,
      tempoMedio,
      maisAcessados: contarPorTitulo(),
      resumosMaisAcessados: contarPorTitulo("resumos"),
      flashcardsMaisAcessados: contarPorTitulo("flashcards"),
      questoesMaisAcessadas: contarPorTitulo("questoes"),
      dispositivos: contarPorCampo("device_type"),
      navegadores: contarPorCampo("browser"),
      sistemas: contarPorCampo("os"),
    }
  }, [events])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <div className="p-6 md:ml-64">
          <p>Carregando dashboard...</p>
        </div>
      </main>
    )
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <div className="p-6 md:ml-64">
          <p className="text-red-400">{erro}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <div className="p-6 md:ml-64">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-slate-400">
            Acompanhe os acessos e uso das abas do site.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card titulo="Total de acessos" valor={dados.totalAcessos} icon={<Eye />} />
          <Card titulo="Visitantes únicos" valor={dados.visitantesUnicos} icon={<Users />} />
          <Card titulo="Sessões" valor={dados.sessoes} icon={<BarChart3 />} />
          <Card titulo="Tempo médio" valor={`${dados.tempoMedio}s`} icon={<Clock />} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card titulo="Resumos" valor={dados.resumos} icon={<FileText />} />
          <Card titulo="Flashcards" valor={dados.flashcards} icon={<Layers />} />
          <Card titulo="Questões" valor={dados.questoes} icon={<HelpCircle />} />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <Tabela titulo="Mais acessados no geral" dados={dados.maisAcessados} />
          <Tabela titulo="Resumos mais acessados" dados={dados.resumosMaisAcessados} />
          <Tabela titulo="Flashcards mais acessados" dados={dados.flashcardsMaisAcessados} />
          <Tabela titulo="Questões mais acessadas" dados={dados.questoesMaisAcessadas} />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          <Tabela titulo="Dispositivos" dados={dados.dispositivos} icon={<Smartphone />} />
          <Tabela titulo="Navegadores" dados={dados.navegadores} icon={<Monitor />} />
          <Tabela titulo="Sistemas operacionais" dados={dados.sistemas} />
        </div>
      </div>
    </main>
  )
}

function Card({
  titulo,
  valor,
  icon,
}: {
  titulo: string
  valor: string | number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{titulo}</p>
        <div className="text-blue-400">{icon}</div>
      </div>

      <p className="text-3xl font-bold">{valor}</p>
    </div>
  )
}

function Tabela({
  titulo,
  dados,
  icon,
}: {
  titulo: string
  dados: { nome: string; total: number }[]
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow">
      <div className="mb-4 flex items-center gap-2">
        {icon && <div className="text-blue-400">{icon}</div>}
        <h2 className="text-lg font-semibold">{titulo}</h2>
      </div>

      {dados.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum dado encontrado.</p>
      ) : (
        <div className="space-y-3">
          {dados.map((item) => (
            <div
              key={item.nome}
              className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2 last:border-0"
            >
              <span className="line-clamp-1 text-sm text-slate-300">
                {item.nome}
              </span>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-300">
                {item.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}