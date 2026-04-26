"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, Save, Stethoscope, User, Activity, AlertTriangle } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { supabase } from "@/lib/supabase"

const dificuldadeColors: Record<string, string> = {
  "Básico": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Intermediário": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Avançado": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

export default function NovoCasoPage() {
  return (
    <AdminOnly>
      <FormNovoCaso />
    </AdminOnly>
  )
}

function FormNovoCaso() {
  const router = useRouter()
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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function gerarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.titulo || !form.dificuldade || !form.sistema) {
      alert("Preencha título, dificuldade e sistema.")
      return
    }

    setSalvando(true)

    const slug = gerarSlug(form.titulo)

    const { error } = await supabase.from("casos_clinicos").insert([
      {
        ...form,
        slug,
      },
    ])

    setSalvando(false)

    if (error) {
      alert("Erro ao salvar o caso clínico.")
      console.error(error)
      return
    }

    router.push(`/casos-clinicos/${slug}`)
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <Link
            href="/casos-clinicos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar para Casos Clínicos
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Novo Caso Clínico
            </h1>
            <p className="text-muted-foreground">
              Cadastre um novo caso clínico e veja a prévia antes de salvar.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Formulário */}
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
                placeholder="Sistema (Cardiovascular, Endócrino...)"
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
                className="w-full min-h-28 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
              />

              <textarea
                name="exame"
                placeholder="Exame físico"
                value={form.exame}
                onChange={handleChange}
                className="w-full min-h-28 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
              />

              <textarea
                name="conduta"
                placeholder="Conduta"
                value={form.conduta}
                onChange={handleChange}
                className="w-full min-h-28 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
              />

              <textarea
                name="discussao"
                placeholder="Discussão farmacológica"
                value={form.discussao}
                onChange={handleChange}
                className="w-full min-h-32 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={salvando}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {salvando ? "Salvando..." : "Salvar Caso"}
              </button>
            </form>

            {/* Prévia */}
            <div className="lg:sticky lg:top-8 h-fit">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <Eye className="h-4 w-4" />
                Prévia
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                    <Stethoscope className="h-6 w-6" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground">
                      {form.titulo || "Título do caso clínico"}
                    </h2>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      dificuldadeColors[form.dificuldade] ||
                      "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {form.dificuldade || "Dificuldade"}
                  </span>

                  <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {form.sistema || "Sistema"}
                  </span>
                </div>

                <div className="space-y-4">
                  {sections.map(({ key, label, icon: Icon }) => (
                    <div
                      key={key}
                      className="overflow-hidden rounded-2xl border border-border bg-background"
                    >
                      <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
                        <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-semibold text-foreground">{label}</h3>
                      </div>

                      <div className="p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {(form as any)[key] || "Ainda não informado."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}