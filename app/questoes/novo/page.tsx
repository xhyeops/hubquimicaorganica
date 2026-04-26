"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { supabase } from "@/lib/supabase"

export default function NovoTemaQuestoesPage() {
  return (
    <AdminOnly>
      <NovoTemaForm />
    </AdminOnly>
  )
}

function NovoTemaForm() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
  })

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.titulo) {
      alert("Preencha o título do tema.")
      return
    }

    setSalvando(true)

    const slug = gerarSlug(form.titulo)

    const { error } = await supabase.from("temas_questoes").insert([
      {
        titulo: form.titulo,
        descricao: form.descricao,
        slug,
      },
    ])

    setSalvando(false)

    if (error) {
      alert("Erro ao criar tema.")
      console.error(error)
      return
    }

    router.push(`/questoes/${slug}/editar`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <Link
            href="/questoes"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar para Questões
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Novo Tema de Questões
            </h1>
            <p className="text-muted-foreground">
              Crie um tema e depois adicione as questões.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="titulo"
              placeholder="Título do tema"
              value={form.titulo}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-amber-500"
            />

            <textarea
              name="descricao"
              placeholder="Descrição"
              value={form.descricao}
              onChange={handleChange}
              className="w-full min-h-28 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-amber-500"
            />

            <button
              type="submit"
              disabled={salvando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {salvando ? "Salvando..." : "Criar Tema"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}