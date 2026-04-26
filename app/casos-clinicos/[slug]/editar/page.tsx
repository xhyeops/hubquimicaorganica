"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { supabase } from "@/lib/supabase"

export default function EditarCasoPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <AdminOnly>
      <EditarCasoForm params={params} />
    </AdminOnly>
  )
}

function EditarCasoForm({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    titulo: "",
    dificuldade: "Básico",
    sistema: "",
    paciente: "",
    queixa: "",
    historia: "",
    exame: "",
    conduta: "",
    discussao: "",
  })

  useEffect(() => {
    async function fetchCaso() {
      const { data, error } = await supabase
        .from("casos_clinicos")
        .select("*")
        .eq("slug", slug)
        .single()

      if (error) {
        console.error("Erro ao buscar caso:", error)
        setLoading(false)
        return
      }

      setForm({
        titulo: data.titulo || "",
        dificuldade: data.dificuldade || "Básico",
        sistema: data.sistema || "",
        paciente: data.paciente || "",
        queixa: data.queixa || "",
        historia: data.historia || "",
        exame: data.exame || "",
        conduta: data.conduta || "",
        discussao: data.discussao || "",
      })

      setLoading(false)
    }

    fetchCaso()
  }, [slug])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.titulo || !form.dificuldade || !form.sistema) {
      alert("Preencha título, dificuldade e sistema.")
      return
    }

    setSalvando(true)

    const { error } = await supabase
      .from("casos_clinicos")
      .update(form)
      .eq("slug", slug)

    setSalvando(false)

    if (error) {
      alert("Erro ao salvar alterações.")
      console.error(error)
      return
    }

    router.push(`/casos-clinicos/${slug}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
            <p className="text-muted-foreground">Carregando caso...</p>
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
            href={`/casos-clinicos/${slug}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar para o caso
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Editar Caso Clínico
            </h1>
            <p className="text-muted-foreground">
              Atualize as informações do caso clínico.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="titulo"
              placeholder="Título"
              value={form.titulo}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
            />

            <select
              name="dificuldade"
              value={form.dificuldade}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
            >
              <option value="Básico">Básico</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>

            <input
              name="sistema"
              placeholder="Sistema"
              value={form.sistema}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
            />

            <textarea
              name="paciente"
              placeholder="Paciente"
              value={form.paciente}
              onChange={handleChange}
              className="w-full min-h-24 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
            />

            <textarea
              name="queixa"
              placeholder="Queixa principal"
              value={form.queixa}
              onChange={handleChange}
              className="w-full min-h-24 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
            />

            <textarea
              name="historia"
              placeholder="História clínica"
              value={form.historia}
              onChange={handleChange}
              className="w-full min-h-32 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
            />

            <textarea
              name="exame"
              placeholder="Exame físico"
              value={form.exame}
              onChange={handleChange}
              className="w-full min-h-32 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
            />

            <textarea
              name="conduta"
              placeholder="Conduta"
              value={form.conduta}
              onChange={handleChange}
              className="w-full min-h-32 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
            />

            <textarea
              name="discussao"
              placeholder="Discussão farmacológica"
              value={form.discussao}
              onChange={handleChange}
              className="w-full min-h-40 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
            />

            <button
              type="submit"
              disabled={salvando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}