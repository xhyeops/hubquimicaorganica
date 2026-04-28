"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Save, ArrowLeft } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { supabase } from "@/lib/supabase"
import { isAdminEmail } from "@/lib/admin"

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
  const [categoria, setCategoria] = useState("")
  const [description, setDescription] = useState("")
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
        router.push("/resumos")
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
      categoria: categoria || null,
      description: description || null,
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
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64 pt-14 lg:pt-0 flex items-center justify-center">
          <p className="text-muted-foreground">Verificando acesso...</p>
        </main>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64 pt-14 lg:pt-0 flex items-center justify-center">
          <p className="text-muted-foreground">Acesso negado.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <Link
            href="/resumos"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-sky-400 transition"
          >
            <ArrowLeft size={16} />
            Voltar para resumos
          </Link>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">
              Novo resumo
            </h1>

            <p className="mb-6 text-sm text-muted-foreground">
              Crie um material em markdown para a monitoria.
            </p>

            <form onSubmit={salvarResumo} className="space-y-5">
              {/* TÍTULO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Título
                </label>

                <input
                  value={titulo}
                  onChange={(e) => handleTituloChange(e.target.value)}
                  required
                  placeholder="Ex: Reações de substituição"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                />
              </div>

              {/* SLUG */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Slug
                </label>

                <input
                  value={slug}
                  onChange={(e) => setSlug(gerarSlug(e.target.value))}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                />
              </div>

              {/* CATEGORIA */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Categoria
                </label>

                <input
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ex: Funções Orgânicas"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                />
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Descrição
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Resumo curto que aparece na listagem"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                />
              </div>

              {/* CONTEÚDO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Conteúdo (Markdown)
                </label>

                <textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  required
                  rows={18}
                  placeholder={`# Título\n\nDigite seu conteúdo aqui...\n\n## Tópico\n\n- Item 1`}
                  className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm outline-none transition focus:border-sky-500"
                />
              </div>

              {/* ERRO */}
              {erro && (
                <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {erro}
                </p>
              )}

              {/* BOTÃO */}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-60"
              >
                <Save size={18} />
                {loading ? "Salvando..." : "Salvar resumo"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}