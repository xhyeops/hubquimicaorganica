"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { ArrowLeft, Save } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { isAdminEmail } from "@/lib/admin"

export default function EditarResumoPage() {
  const { slug } = useParams()
  const router = useRouter()

  const [titulo, setTitulo] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    async function carregarResumo() {
      const { data: userData } = await supabase.auth.getUser()

      // 🔐 verifica login
      if (!userData.user) {
        router.push("/login")
        return
      }

      // 🔐 verifica admin
      if (!isAdminEmail(userData.user.email)) {
        router.push("/resumos")
        return
      }

      // 📦 busca resumo
      const { data, error } = await supabase
        .from("resumos")
        .select("*")
        .eq("slug", slug)
        .single()

      if (error) {
        setErro(error.message)
        setLoading(false)
        return
      }

      setTitulo(data.titulo || "")
      setConteudo(data.conteudo || "")
      setLoading(false)
    }

    if (slug) carregarResumo()
  }, [slug, router])

  async function salvarResumo(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErro("")

    const { error } = await supabase
      .from("resumos")
      .update({
        titulo,
        conteudo,
      })
      .eq("slug", slug)

    setSaving(false)

    if (error) {
      setErro(error.message)
      return
    }

    router.push(`/resumos/${slug}`)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        Carregando...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">

        <Link
          href={`/resumos/${slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar para o resumo
        </Link>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Editar resumo</h1>
            <p className="text-sm text-slate-400">
              Edite e veja a prévia em tempo real.
            </p>
          </div>

          <button
            form="form-editar"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>

        {erro && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {erro}
          </p>
        )}

        <form
          id="form-editar"
          onSubmit={salvarResumo}
          className="grid gap-6 lg:grid-cols-2"
        >

          {/* EDITOR */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <label className="mb-2 block text-sm text-slate-300">
              Título
            </label>

            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="mb-5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-500"
            />

            <label className="mb-2 block text-sm text-slate-300">
              Conteúdo
            </label>

            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={24}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono outline-none focus:border-emerald-500"
            />

          </section>

          {/* PREVIEW */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <p className="mb-4 text-sm text-slate-300">
              Prévia
            </p>

            <div className="prose prose-invert max-w-none bg-slate-950 p-6 rounded-xl border border-slate-800">
              <h1>{titulo}</h1>
              <ReactMarkdown>{conteudo}</ReactMarkdown>
            </div>

          </section>

        </form>
      </div>
    </main>
  )
}