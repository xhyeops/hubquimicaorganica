"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { supabase } from "@/lib/supabase"

export default function EditarFlashcardPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [pergunta, setPergunta] = useState("")
  const [resposta, setResposta] = useState("")
  const [categoria, setCategoria] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregarFlashcard() {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("id", id)
        .single()

      if (error || !data) {
        alert("Flashcard não encontrado.")
        router.push("/flashcards")
        return
      }

      setPergunta(data.pergunta)
      setResposta(data.resposta)
      setCategoria(data.categoria || "")
      setCarregando(false)
    }

    carregarFlashcard()
  }, [id, router])

  async function salvarAlteracoes(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    const { error } = await supabase
      .from("flashcards")
      .update({
        pergunta,
        resposta,
        categoria: categoria || null,
      })
      .eq("id", id)

    setSalvando(false)

    if (error) {
      alert("Erro ao salvar alterações.")
      console.error(error)
      return
    }

    router.push("/flashcards")
  }

  async function excluirFlashcard() {
    const confirmar = confirm("Tem certeza que deseja excluir este flashcard?")
    if (!confirmar) return

    const { error } = await supabase.from("flashcards").delete().eq("id", id)

    if (error) {
      alert("Erro ao excluir flashcard.")
      console.error(error)
      return
    }

    router.push("/flashcards")
  }

  return (
    <AdminOnly>
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-16">
            <Link
              href="/flashcards"
              className="inline-flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-sky-400 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para flashcards
            </Link>

            <h1 className="text-3xl font-bold mb-2">Editar flashcard</h1>
            <p className="text-muted-foreground mb-8">
              Atualize ou exclua este flashcard.
            </p>

            {carregando ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : (
              <form onSubmit={salvarAlteracoes} className="space-y-5">
                <input
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Categoria"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-sky-500"
                />

                <textarea
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  required
                  className="min-h-32 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-sky-500"
                />

                <textarea
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  required
                  className="min-h-40 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-sky-500"
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={salvando}
                    className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-60"
                  >
                    {salvando ? "Salvando..." : "Salvar alterações"}
                  </button>

                  <Link
                    href="/flashcards"
                    className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition hover:border-sky-500/40 hover:text-sky-400"
                  >
                    Cancelar
                  </Link>

                  <button
                    type="button"
                    onClick={excluirFlashcard}
                    className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    Excluir
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </AdminOnly>
  )
}