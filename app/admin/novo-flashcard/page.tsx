"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { supabase } from "@/lib/supabase"

export default function NovoFlashcardPage() {
  const router = useRouter()
  const [pergunta, setPergunta] = useState("")
  const [resposta, setResposta] = useState("")
  const [categoria, setCategoria] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function salvarFlashcard(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)

    const { error } = await supabase.from("flashcards").insert({
      pergunta,
      resposta,
      categoria: categoria || null,
    })

    setSalvando(false)

    if (error) {
      alert("Erro ao salvar flashcard.")
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

            <h1 className="text-3xl font-bold mb-2">Novo flashcard</h1>
            <p className="text-muted-foreground mb-8">
              Cadastre pergunta, resposta e categoria.
            </p>

            <form onSubmit={salvarFlashcard} className="space-y-5">
              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Categoria, ex: Álcoois"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-sky-500"
              />

              <textarea
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                placeholder="Pergunta"
                required
                className="min-h-32 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-sky-500"
              />

              <textarea
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                placeholder="Resposta"
                required
                className="min-h-40 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-sky-500"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar flashcard"}
                </button>

                <Link
                  href="/flashcards"
                  className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition hover:border-sky-500/40 hover:text-sky-400"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </AdminOnly>
  )
}