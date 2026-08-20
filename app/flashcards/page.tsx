"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { supabase } from "@/lib/supabase"
import { trackEvent } from "@/lib/analytics"
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react"

type Flashcard = {
  id: string
  pergunta: string
  resposta: string
  categoria: string | null
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    trackEvent({
      event_type: "flashcards_view",
      page_path: "/flashcards",
      section: "flashcards",
      title: "Página de flashcards",
      content_type: "flashcard",
      metadata: {
        pagina: "flashcards",
      },
    })

    async function carregarFlashcards() {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .order("criado_em", { ascending: false })

      if (error) {
        console.error("Erro ao carregar flashcards:", error)
        return
      }

      setFlashcards(data || [])
    }

    carregarFlashcards()
  }, [])

  const currentCard = flashcards[currentIndex]

  function proximoCard() {
    if (!currentCard) return

    trackEvent({
      event_type: "flashcard_next",
      page_path: "/flashcards",
      section: "flashcards",
      slug: currentCard.id,
      title: currentCard.pergunta,

      content_id: currentCard.id,
      content_type: "flashcard",

      value: currentIndex + 1,

      metadata: {
        categoria: currentCard.categoria || "Geral",
        posicao: currentIndex + 1,
        total_cards: flashcards.length,
        estava_virado: isFlipped,
      },
    })

    setIsFlipped(false)

    setCurrentIndex((prev) =>
      prev === flashcards.length - 1 ? 0 : prev + 1
    )
  }

  function cardAnterior() {
    if (!currentCard) return

    trackEvent({
      event_type: "flashcard_prev",
      page_path: "/flashcards",
      section: "flashcards",
      slug: currentCard.id,
      title: currentCard.pergunta,

      content_id: currentCard.id,
      content_type: "flashcard",

      value: currentIndex + 1,

      metadata: {
        categoria: currentCard.categoria || "Geral",
        posicao: currentIndex + 1,
        total_cards: flashcards.length,
        estava_virado: isFlipped,
      },
    })

    setIsFlipped(false)

    setCurrentIndex((prev) =>
      prev === 0 ? flashcards.length - 1 : prev - 1
    )
  }

  function virarCard() {
    if (!currentCard) return

    const novoEstado = !isFlipped

    trackEvent({
      event_type: "flashcard_flip",
      page_path: "/flashcards",
      section: "flashcards",
      slug: currentCard.id,
      title: currentCard.pergunta,

      content_id: currentCard.id,
      content_type: "flashcard",

      success: novoEstado,

      value: currentIndex + 1,

      metadata: {
        categoria: currentCard.categoria || "Geral",
        posicao: currentIndex + 1,
        total_cards: flashcards.length,
        lado_exibido: novoEstado ? "resposta" : "pergunta",
      },
    })

    setIsFlipped(novoEstado)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-16">
          <section className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-sky-500/10 text-sky-400 text-sm font-medium">
              <Layers className="h-3.5 w-3.5" />
              Flashcards
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                  Flashcards de{" "}
                  <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                    Química Orgânica
                  </span>
                </h1>

                <p className="text-muted-foreground">
                  Revise os cards como um baralho de estudo.
                </p>
              </div>

              <AdminOnly>
                <Link
                  href="/admin/novo-flashcard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  <Plus className="h-4 w-4" />
                  Novo flashcard
                </Link>
              </AdminOnly>
            </div>
          </section>

          {flashcards.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Nenhum flashcard cadastrado ainda.
              </p>

              <AdminOnly>
                <Link
                  href="/admin/novo-flashcard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  <Plus className="h-4 w-4" />
                  Criar primeiro flashcard
                </Link>
              </AdminOnly>
            </div>
          ) : (
            <section className="flex flex-col items-center">
              <div className="mb-5 flex w-full max-w-xl items-center justify-between rounded-2xl border border-border bg-card/80 px-5 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Categoria
                  </p>

                  <p className="text-sm font-medium text-sky-400">
                    {currentCard.categoria || "Geral"}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Card
                  </p>

                  <p className="text-sm font-semibold">
                    {currentIndex + 1} / {flashcards.length}
                  </p>
                </div>

                <AdminOnly>
                  <Link
                    href={`/admin/editar-flashcard/${currentCard.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-sky-500/30 bg-background/80 px-2.5 py-1.5 text-xs font-medium text-sky-400 transition hover:bg-sky-500/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                </AdminOnly>
              </div>

              <button
                onClick={virarCard}
                className="w-full max-w-xl cursor-pointer perspective"
              >
                <div
                  className={`relative w-full h-[330px] sm:h-[380px] transition-transform duration-500 preserve-3d ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  <div className="absolute inset-0 backface-hidden rounded-[2rem] border border-border bg-gradient-to-br from-slate-100 to-slate-200 p-8 shadow-xl dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-center">
                    <div>
                      <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Pergunta
                      </p>

                      <h2 className="text-2xl sm:text-3xl font-semibold leading-relaxed text-foreground">
                        {currentCard.pergunta}
                      </h2>
                    </div>
                  </div>

                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[2rem] border border-sky-500/30 bg-gradient-to-br from-sky-100 to-cyan-100 p-8 shadow-xl dark:from-sky-950/60 dark:to-cyan-950/50 flex items-center justify-center text-center">
                    <div>
                      <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-sky-500 dark:text-sky-400">
                        Resposta
                      </p>

                      <h2 className="text-xl sm:text-2xl font-medium leading-relaxed text-foreground">
                        {currentCard.resposta}
                      </h2>
                    </div>
                  </div>
                </div>
              </button>

              <div className="mt-6 flex w-full max-w-md items-center justify-between rounded-3xl border border-border bg-card/80 px-5 py-4">
                <button
                  onClick={cardAnterior}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 transition hover:bg-sky-500/20"
                  aria-label="Card anterior"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>

                <button
                  onClick={virarCard}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-sky-400"
                >
                  <RotateCcw className="h-4 w-4" />
                  Virar
                </button>

                <button
                  onClick={proximoCard}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 transition hover:bg-sky-500/20"
                  aria-label="Próximo card"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
