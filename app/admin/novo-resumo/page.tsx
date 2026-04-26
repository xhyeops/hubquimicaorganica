"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { isAdminEmail } from "@/lib/admin"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

export default function NovoResumoPage() {
  const router = useRouter()

  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [titulo, setTitulo] = useState("")
  const [slug, setSlug] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    async function verificarAdmin() {
      const { data } = await supabase.auth.getUser()
      const email = data.user?.email

      if (!data.user) {
        router.push("/login")
        return
      }

      if (!isAdminEmail(email)) {
        setIsAdmin(false)
        setChecking(false)
        return
      }

      setIsAdmin(true)
      setChecking(false)
    }

    verificarAdmin()
  }, [router])

  function handleTituloChange(value: string) {
    setTitulo(value)
    setSlug(gerarSlug(value))
  }

  async function salvarResumo(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setLoading(true)

    const { error } = await supabase.from("resumos").insert({
      titulo,
      slug,
      conteudo,
    })

    setLoading(false)

    if (error) {
      setErro(error.message)
      return
    }

    router.push(`/resumos/${slug}`)
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        Verificando acesso...
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <p>Acesso negado.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h1 className="mb-2 text-2xl font-bold">Novo resumo</h1>
          <p className="mb-6 text-sm text-slate-400">
            Crie um material em markdown para a monitoria.
          </p>

          <form onSubmit={salvarResumo} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Título
              </label>
              <input
                value={titulo}
                onChange={(e) => handleTituloChange(e.target.value)}
                required
                placeholder="Ex: Introdução à farmacocinética"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Slug
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(gerarSlug(e.target.value))}
                required
                placeholder="introducao-a-farmacocinetica"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Conteúdo em Markdown
              </label>
              <textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                required
                rows={16}
                placeholder={`# Introdução\n\nDigite seu conteúdo aqui...\n\n## Tópico\n\n- Item 1\n- Item 2`}
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm outline-none focus:border-emerald-500"
              />
            </div>

            {erro && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              <Save size={18} />
              {loading ? "Salvando..." : "Salvar resumo"}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}