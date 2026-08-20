"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { supabase } from "@/lib/supabase"

type Questao = {
  tipo: "fechada" | "aberta"
  pergunta: string
  imagem_url: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  correta: string
  resposta_aberta: string
  comentario: string
}

const questaoVazia: Questao = {
  tipo: "fechada",
  pergunta: "",
  imagem_url: "",
  alternativa_a: "",
  alternativa_b: "",
  alternativa_c: "",
  alternativa_d: "",
  alternativa_e: "",
  correta: "A",
  resposta_aberta: "",
  comentario: "",
}

export default function NovaQuestaoPage() {
  return (
    <AdminOnly>
      <NovaQuestaoForm />
    </AdminOnly>
  )
}

function NovaQuestaoForm() {
  const router = useRouter()

  const [salvando, setSalvando] = useState(false)

  const [formTema, setFormTema] = useState({
    titulo: "",
    descricao: "",
    visivel: true,
  })

  const [questoes, setQuestoes] = useState<Questao[]>([
    { ...questaoVazia },
  ])

  function gerarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
  }

  function handleTemaChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    setFormTema({
      ...formTema,
      [e.target.name]: e.target.value,
    })
  }

  function handleQuestaoChange(
    index: number,
    campo: keyof Questao,
    valor: string
  ) {
    const novas = [...questoes]

    novas[index] = {
      ...novas[index],
      [campo]: valor,
    }

    setQuestoes(novas)
  }

  function adicionarQuestao() {
    setQuestoes([
      ...questoes,
      { ...questaoVazia },
    ])
  }

  function removerQuestao(index: number) {
    if (questoes.length === 1) {
      alert(
        "O tema precisa ter pelo menos uma questão."
      )
      return
    }

    const confirmar = confirm(
      "Deseja remover esta questão?"
    )

    if (!confirmar) return

    setQuestoes(
      questoes.filter(
        (_, i) => i !== index
      )
    )
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    const titulo =
      formTema.titulo.trim()

    const descricao =
      formTema.descricao.trim()

    if (!titulo) {
      alert("Preencha o título.")
      return
    }

    const slugBase =
      gerarSlug(titulo)

    if (!slugBase) {
      alert("Título inválido.")
      return
    }

    const slug =
      `${slugBase}-${Date.now()}`

    for (const q of questoes) {
      if (!q.pergunta.trim()) {
        alert(
          "Preencha todas as perguntas."
        )

        return
      }

      if (q.tipo === "fechada") {
        if (
          !q.alternativa_a.trim() ||
          !q.alternativa_b.trim() ||
          !q.alternativa_c.trim() ||
          !q.alternativa_d.trim()
        ) {
          alert(
            "Preencha todas as alternativas das questões fechadas."
          )

          return
        }
      }

      if (
        q.tipo === "aberta" &&
        !q.resposta_aberta.trim()
      ) {
        alert(
          "Preencha a resposta esperada das questões abertas."
        )

        return
      }
    }

    setSalvando(true)

    /*
     * ============================================================
     * CRIAÇÃO DO TEMA
     * ============================================================
     */

    const {
      data: temaData,
      error: temaError,
    } = await supabase
      .from("temas_questoes")
      .insert([
        {
          titulo,
          descricao:
            descricao || null,
          slug,

          /*
           * Define se o tema ficará imediatamente
           * disponível para os alunos.
           */
          visivel:
            formTema.visivel,
        },
      ])
      .select()
      .single()

    if (
      temaError ||
      !temaData
    ) {
      setSalvando(false)

      console.error(
        "ERRO AO CRIAR TEMA:",
        temaError
      )

      alert(`
Erro ao criar tema:
${temaError?.message || "Tema não retornado pelo Supabase."}

Código:
${temaError?.code || "sem código"}
      `)

      return
    }

    /*
     * ============================================================
     * FORMATAÇÃO DAS QUESTÕES
     * ============================================================
     */

    const questoesFormatadas =
      questoes.map(
        (q, index) => ({
          tema_id:
            temaData.id,

          tipo:
            q.tipo,

          pergunta:
            q.pergunta.trim(),

          enunciado:
            q.pergunta.trim(),

          imagem_url:
            q.imagem_url.trim() ||
            null,

          alternativa_a:
            q.tipo === "fechada"
              ? q.alternativa_a.trim()
              : null,

          alternativa_b:
            q.tipo === "fechada"
              ? q.alternativa_b.trim()
              : null,

          alternativa_c:
            q.tipo === "fechada"
              ? q.alternativa_c.trim()
              : null,

          alternativa_d:
            q.tipo === "fechada"
              ? q.alternativa_d.trim()
              : null,

          alternativa_e:
            q.tipo === "fechada" &&
            q.alternativa_e.trim()
              ? q.alternativa_e.trim()
              : null,

          correta:
            q.tipo === "fechada"
              ? q.correta
              : null,

          resposta_correta:
            q.tipo === "fechada"
              ? q.correta
              : null,

          resposta_aberta:
            q.tipo === "aberta"
              ? q.resposta_aberta.trim()
              : null,

          comentario:
            q.comentario.trim() ||
            null,

          explicacao:
            q.comentario.trim() ||
            null,

          ordem:
            index + 1,
        })
      )

    /*
     * ============================================================
     * SALVAR QUESTÕES
     * ============================================================
     */

    const {
      error: questoesError,
    } = await supabase
      .from("questoes")
      .insert(
        questoesFormatadas
      )

    setSalvando(false)

    if (questoesError) {
      console.error(
        "ERRO AO SALVAR QUESTÕES:",
        questoesError
      )

      alert(`
Erro ao salvar questões:
${questoesError.message}

Código:
${questoesError.code}
      `)

      return
    }

    /*
     * Mesmo que esteja oculto, o admin
     * consegue abrir o quiz normalmente.
     */
    router.push(
      `/questoes/${slug}`
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">

          <Link
            href="/questoes"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />

            Voltar para Questões
          </Link>

          {/* CABEÇALHO */}
          <div className="mb-8">

            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Novo Tema de Questões
            </h1>

            <p className="text-muted-foreground">
              Crie questões fechadas ou abertas com comentários e imagens.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* ================================================== */}
            {/* TEMA                                               */}
            {/* ================================================== */}

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">

              <h2 className="text-lg font-semibold text-foreground">
                Tema
              </h2>

              <input
                name="titulo"
                placeholder="Título do tema"
                value={
                  formTema.titulo
                }
                onChange={
                  handleTemaChange
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
              />

              <textarea
                name="descricao"
                placeholder="Descrição"
                value={
                  formTema.descricao
                }
                onChange={
                  handleTemaChange
                }
                className="w-full min-h-24 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
              />

              {/* VISIBILIDADE */}
              <div className="pt-2">

                <div className="mb-3">

                  <p className="text-sm font-medium text-foreground">
                    Visibilidade
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Escolha se este tema já deve aparecer para os alunos.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormTema(
                      (prev) => ({
                        ...prev,
                        visivel:
                          !prev.visivel,
                      })
                    )
                  }
                  className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                    formTema.visivel
                      ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15"
                  }`}
                >

                  <div className="flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3">

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          formTema.visivel
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-amber-500/15 text-amber-500"
                        }`}
                      >

                        {formTema.visivel ? (
                          <Eye className="h-5 w-5" />
                        ) : (
                          <EyeOff className="h-5 w-5" />
                        )}

                      </div>

                      <div>

                        <p
                          className={`text-sm font-semibold ${
                            formTema.visivel
                              ? "text-emerald-500"
                              : "text-amber-500"
                          }`}
                        >
                          {formTema.visivel
                            ? "Visível para alunos"
                            : "Oculto para alunos"}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">

                          {formTema.visivel
                            ? "O tema aparecerá normalmente na página de questões."
                            : "Somente administradores poderão visualizar e acessar."}

                        </p>

                      </div>

                    </div>

                    {/* SWITCH */}
                    <div
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                        formTema.visivel
                          ? "bg-emerald-500"
                          : "bg-muted"
                      }`}
                    >

                      <div
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          formTema.visivel
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />

                    </div>

                  </div>

                </button>

              </div>

            </div>

            {/* ================================================== */}
            {/* QUESTÕES                                           */}
            {/* ================================================== */}

            <div className="flex items-center justify-between">

              <h2 className="text-lg font-semibold text-foreground">
                Questões
              </h2>

              <button
                type="button"
                onClick={
                  adicionarQuestao
                }
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
              >
                <Plus className="h-4 w-4" />

                Adicionar Questão
              </button>

            </div>

            <div className="space-y-6">

              {questoes.map(
                (q, index) => (

                  <div
                    key={index}
                    className="rounded-2xl border border-border bg-card p-6 space-y-4"
                  >

                    {/* CABEÇALHO DA QUESTÃO */}
                    <div className="flex items-center justify-between">

                      <h3 className="font-semibold text-foreground">
                        Questão {index + 1}
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          removerQuestao(
                            index
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4 w-4" />

                        Remover
                      </button>

                    </div>

                    {/* TIPO */}
                    <select
                      value={q.tipo}
                      onChange={(e) =>
                        handleQuestaoChange(
                          index,
                          "tipo",
                          e.target.value as
                            | "fechada"
                            | "aberta"
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                    >
                      <option value="fechada">
                        Questão fechada
                      </option>

                      <option value="aberta">
                        Questão aberta
                      </option>

                    </select>

                    {/* PERGUNTA */}
                    <textarea
                      placeholder="Pergunta/enunciado"
                      value={
                        q.pergunta
                      }
                      onChange={(e) =>
                        handleQuestaoChange(
                          index,
                          "pergunta",
                          e.target.value
                        )
                      }
                      className="w-full min-h-28 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                    />

                    {/* IMAGEM */}
                    <div>

                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">

                        <ImageIcon className="h-4 w-4 text-sky-400" />

                        Imagem da questão

                      </div>

                      <input
                        placeholder="Cole a URL da imagem"
                        value={
                          q.imagem_url
                        }
                        onChange={(e) =>
                          handleQuestaoChange(
                            index,
                            "imagem_url",
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                      />

                      {q.imagem_url && (
                        <img
                          src={
                            q.imagem_url
                          }
                          alt="Prévia"
                          className="mt-4 max-h-72 rounded-xl border border-border object-contain"
                        />
                      )}

                    </div>

                    {/* QUESTÃO FECHADA */}
                    {q.tipo ===
                    "fechada" ? (

                      <>

                        <div className="grid gap-4 md:grid-cols-2">

                          <input
                            placeholder="Alternativa A"
                            value={
                              q.alternativa_a
                            }
                            onChange={(e) =>
                              handleQuestaoChange(
                                index,
                                "alternativa_a",
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                          />

                          <input
                            placeholder="Alternativa B"
                            value={
                              q.alternativa_b
                            }
                            onChange={(e) =>
                              handleQuestaoChange(
                                index,
                                "alternativa_b",
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                          />

                          <input
                            placeholder="Alternativa C"
                            value={
                              q.alternativa_c
                            }
                            onChange={(e) =>
                              handleQuestaoChange(
                                index,
                                "alternativa_c",
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                          />

                          <input
                            placeholder="Alternativa D"
                            value={
                              q.alternativa_d
                            }
                            onChange={(e) =>
                              handleQuestaoChange(
                                index,
                                "alternativa_d",
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                          />

                          <input
                            placeholder="Alternativa E opcional"
                            value={
                              q.alternativa_e
                            }
                            onChange={(e) =>
                              handleQuestaoChange(
                                index,
                                "alternativa_e",
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500 md:col-span-2"
                          />

                        </div>

                        <select
                          value={
                            q.correta
                          }
                          onChange={(e) =>
                            handleQuestaoChange(
                              index,
                              "correta",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                        >

                          <option value="A">
                            Correta: A
                          </option>

                          <option value="B">
                            Correta: B
                          </option>

                          <option value="C">
                            Correta: C
                          </option>

                          <option value="D">
                            Correta: D
                          </option>

                          <option value="E">
                            Correta: E
                          </option>

                        </select>

                      </>

                    ) : (

                      /* QUESTÃO ABERTA */

                      <textarea
                        placeholder="Resposta esperada"
                        value={
                          q.resposta_aberta
                        }
                        onChange={(e) =>
                          handleQuestaoChange(
                            index,
                            "resposta_aberta",
                            e.target.value
                          )
                        }
                        className="w-full min-h-28 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                      />

                    )}

                    {/* COMENTÁRIO */}
                    <textarea
                      placeholder="Comentário/explicação"
                      value={
                        q.comentario
                      }
                      onChange={(e) =>
                        handleQuestaoChange(
                          index,
                          "comentario",
                          e.target.value
                        )
                      }
                      className="w-full min-h-28 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                    />

                  </div>

                )
              )}

            </div>

            {/* SALVAR */}
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-medium text-white transition hover:bg-sky-600 disabled:opacity-60"
            >

              <Save className="h-4 w-4" />

              {salvando
                ? "Salvando..."
                : formTema.visivel
                  ? "Salvar e publicar tema"
                  : "Salvar tema oculto"}

            </button>

          </form>

        </div>

      </main>
    </div>
  )
}
