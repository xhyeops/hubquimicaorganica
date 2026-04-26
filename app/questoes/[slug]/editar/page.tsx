"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { supabase } from "@/lib/supabase"

type Questao = {
  id?: string
  pergunta: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  correta: string
  comentario: string
  ordem: number
}

const questaoVazia: Questao = {
  pergunta: "",
  alternativa_a: "",
  alternativa_b: "",
  alternativa_c: "",
  alternativa_d: "",
  correta: "A",
  comentario: "",
  ordem: 1,
}

export default function EditarQuestoesPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <AdminOnly>
      <EditarQuestoesForm params={params} />
    </AdminOnly>
  )
}

function EditarQuestoesForm({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [tema, setTema] = useState<any>(null)

  const [formTema, setFormTema] = useState({
    titulo: "",
    descricao: "",
  })

  const [questoes, setQuestoes] = useState<Questao[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data: temaData, error: temaError } = await supabase
        .from("temas_questoes")
        .select("*")
        .eq("slug", slug)
        .single()

      if (temaError) {
        console.error("Erro ao buscar tema:", temaError)
        setLoading(false)
        return
      }

      const { data: questoesData, error: questoesError } = await supabase
        .from("questoes")
        .select("*")
        .eq("tema_id", temaData.id)
        .order("ordem", { ascending: true })

      if (questoesError) {
        console.error("Erro ao buscar questões:", questoesError)
        setLoading(false)
        return
      }

      setTema(temaData)
      setFormTema({
        titulo: temaData.titulo || "",
        descricao: temaData.descricao || "",
      })
      setQuestoes(questoesData || [])
      setLoading(false)
    }

    fetchData()
  }, [slug])

  function handleTemaChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormTema({ ...formTema, [e.target.name]: e.target.value })
  }

  function handleQuestaoChange(index: number, campo: keyof Questao, valor: string) {
    const novas = [...questoes]

    novas[index] = {
      ...novas[index],
      [campo]: campo === "ordem" ? Number(valor) : valor,
    }

    setQuestoes(novas)
  }

  function adicionarQuestao() {
    setQuestoes([
      ...questoes,
      {
        ...questaoVazia,
        ordem: questoes.length + 1,
      },
    ])
  }

  async function removerQuestao(index: number) {
    const questao = questoes[index]

    if (!confirm("Tem certeza que deseja remover esta questão?")) return

    if (questao.id) {
      const { error } = await supabase
        .from("questoes")
        .delete()
        .eq("id", questao.id)

      if (error) {
        alert("Erro ao remover questão.")
        console.error(error)
        return
      }
    }

    setQuestoes(questoes.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!tema) return

    if (!formTema.titulo) {
      alert("Preencha o título do tema.")
      return
    }

    for (const q of questoes) {
      if (
        !q.pergunta ||
        !q.alternativa_a ||
        !q.alternativa_b ||
        !q.alternativa_c ||
        !q.alternativa_d ||
        !q.correta
      ) {
        alert("Preencha todos os campos obrigatórios das questões.")
        return
      }
    }

    setSalvando(true)

    const { error: temaError } = await supabase
      .from("temas_questoes")
      .update({
        titulo: formTema.titulo,
        descricao: formTema.descricao,
      })
      .eq("id", tema.id)

    if (temaError) {
      setSalvando(false)
      alert("Erro ao salvar tema.")
      console.error(temaError)
      return
    }

    for (const q of questoes) {
      if (q.id) {
        const { error } = await supabase
          .from("questoes")
          .update({
            pergunta: q.pergunta,
            alternativa_a: q.alternativa_a,
            alternativa_b: q.alternativa_b,
            alternativa_c: q.alternativa_c,
            alternativa_d: q.alternativa_d,
            correta: q.correta,
            comentario: q.comentario,
            ordem: q.ordem,
          })
          .eq("id", q.id)

        if (error) {
          setSalvando(false)
          alert("Erro ao atualizar uma questão.")
          console.error(error)
          return
        }
      } else {
        const { error } = await supabase.from("questoes").insert([
          {
            tema_id: tema.id,
            pergunta: q.pergunta,
            alternativa_a: q.alternativa_a,
            alternativa_b: q.alternativa_b,
            alternativa_c: q.alternativa_c,
            alternativa_d: q.alternativa_d,
            correta: q.correta,
            comentario: q.comentario,
            ordem: q.ordem,
          },
        ])

        if (error) {
          setSalvando(false)
          alert("Erro ao criar uma questão.")
          console.error(error)
          return
        }
      }
    }

    setSalvando(false)
    router.push(`/questoes/${slug}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
            <p className="text-muted-foreground">Carregando edição...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <Link
            href={`/questoes/${slug}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar para o quiz
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Editar Questões
            </h1>
            <p className="text-muted-foreground">
              Edite o tema, adicione, remova ou altere questões.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Tema</h2>

              <input
                name="titulo"
                placeholder="Título do tema"
                value={formTema.titulo}
                onChange={handleTemaChange}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-amber-500"
              />

              <textarea
                name="descricao"
                placeholder="Descrição"
                value={formTema.descricao}
                onChange={handleTemaChange}
                className="w-full min-h-24 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Questões
              </h2>

              <button
                type="button"
                onClick={adicionarQuestao}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
              >
                <Plus className="h-4 w-4" />
                Adicionar Questão
              </button>
            </div>

            <div className="space-y-6">
              {questoes.map((q, index) => (
                <div
                  key={q.id || index}
                  className="rounded-2xl border border-border bg-card p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-foreground">
                      Questão {index + 1}
                    </h3>

                    <button
                      type="button"
                      onClick={() => removerQuestao(index)}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </button>
                  </div>

                  <input
                    type="number"
                    min={1}
                    placeholder="Ordem"
                    value={q.ordem}
                    onChange={(e) => handleQuestaoChange(index, "ordem", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-amber-500"
                  />

                  <textarea
                    placeholder="Pergunta"
                    value={q.pergunta}
                    onChange={(e) => handleQuestaoChange(index, "pergunta", e.target.value)}
                    className="w-full min-h-24 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-amber-500"
                  />

                  <input
                    placeholder="Alternativa A"
                    value={q.alternativa_a}
                    onChange={(e) => handleQuestaoChange(index, "alternativa_a", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-amber-500"
                  />

                  <input
                    placeholder="Alternativa B"
                    value={q.alternativa_b}
                    onChange={(e) => handleQuestaoChange(index, "alternativa_b", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-amber-500"
                  />

                  <input
                    placeholder="Alternativa C"
                    value={q.alternativa_c}
                    onChange={(e) => handleQuestaoChange(index, "alternativa_c", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-amber-500"
                  />

                  <input
                    placeholder="Alternativa D"
                    value={q.alternativa_d}
                    onChange={(e) => handleQuestaoChange(index, "alternativa_d", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-amber-500"
                  />

                  <select
                    value={q.correta}
                    onChange={(e) => handleQuestaoChange(index, "correta", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-amber-500"
                  >
                    <option value="A">Correta: A</option>
                    <option value="B">Correta: B</option>
                    <option value="C">Correta: C</option>
                    <option value="D">Correta: D</option>
                  </select>

                  <textarea
                    placeholder="Comentário da questão"
                    value={q.comentario}
                    onChange={(e) => handleQuestaoChange(index, "comentario", e.target.value)}
                    className="w-full min-h-28 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
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