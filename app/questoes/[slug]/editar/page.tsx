"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { AdminOnly } from "@/components/AdminOnly"
import { supabase } from "@/lib/supabase"

type Questao = {
  id?: string
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
  ordem: number
}

type Tema = {
  id: string
  titulo: string
  descricao: string | null
  slug: string
  visivel: boolean
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
  ordem: 1,
}

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

export default function EditarQuestoesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <AdminOnly>
      <EditarQuestoesForm params={params} />
    </AdminOnly>
  )
}

function EditarQuestoesForm({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [tema, setTema] = useState<Tema | null>(null)

  const [formTema, setFormTema] = useState({
    titulo: "",
    descricao: "",
    visivel: true,
  })

  const [questoes, setQuestoes] = useState<Questao[]>([])

  /*
   * ============================================================
   * CARREGAR TEMA + QUESTÕES
   * ============================================================
   */

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)

      const {
        data: temaData,
        error: temaError,
      } = await supabase
        .from("temas_questoes")
        .select("*")
        .eq("slug", slug)
        .single()

      if (
        temaError ||
        !temaData
      ) {
        console.error(
          "Erro ao buscar tema:",
          temaError
        )

        setLoading(false)

        return
      }

      const {
        data: questoesData,
        error: questoesError,
      } = await supabase
        .from("questoes")
        .select("*")
        .eq(
          "tema_id",
          temaData.id
        )
        .order("ordem", {
          ascending: true,
        })

      if (questoesError) {
        console.error(
          "Erro ao buscar questões:",
          questoesError
        )

        setLoading(false)

        return
      }

      const temaFormatado: Tema = {
        id:
          temaData.id,

        titulo:
          temaData.titulo,

        descricao:
          temaData.descricao,

        slug:
          temaData.slug,

        /*
         * Registros antigos sem visivel
         * são tratados como visíveis.
         */
        visivel:
          temaData.visivel !== false,
      }

      setTema(
        temaFormatado
      )

      setFormTema({
        titulo:
          temaData.titulo || "",

        descricao:
          temaData.descricao || "",

        visivel:
          temaData.visivel !== false,
      })

      setQuestoes(
        (questoesData || []).map(
          (
            q: any,
            index: number
          ) => ({
            id:
              q.id,

            tipo:
              q.tipo ||
              "fechada",

            pergunta:
              q.pergunta ||
              q.enunciado ||
              "",

            imagem_url:
              q.imagem_url ||
              "",

            alternativa_a:
              q.alternativa_a ||
              "",

            alternativa_b:
              q.alternativa_b ||
              "",

            alternativa_c:
              q.alternativa_c ||
              "",

            alternativa_d:
              q.alternativa_d ||
              "",

            alternativa_e:
              q.alternativa_e ||
              "",

            correta:
              q.correta ||
              q.resposta_correta ||
              "A",

            resposta_aberta:
              q.resposta_aberta ||
              "",

            comentario:
              q.comentario ||
              q.explicacao ||
              "",

            ordem:
              q.ordem ||
              index + 1,
          })
        )
      )

      setLoading(false)
    }

    carregarDados()
  }, [slug])

  /*
   * ============================================================
   * ALTERAR DADOS DO TEMA
   * ============================================================
   */

  function handleTemaChange(
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >
  ) {
    setFormTema({
      ...formTema,
      [e.target.name]:
        e.target.value,
    })
  }

  /*
   * ============================================================
   * ALTERAR QUESTÃO
   * ============================================================
   */

  function handleQuestaoChange(
    index: number,
    campo: keyof Questao,
    valor: string
  ) {
    const novas = [
      ...questoes,
    ]

    novas[index] = {
      ...novas[index],

      [campo]:
        campo === "ordem"
          ? Number(valor)
          : valor,
    }

    setQuestoes(novas)
  }

  /*
   * ============================================================
   * ADICIONAR QUESTÃO
   * ============================================================
   */

  function adicionarQuestao() {
    setQuestoes([
      ...questoes,

      {
        ...questaoVazia,

        ordem:
          questoes.length + 1,
      },
    ])
  }

  /*
   * ============================================================
   * REMOVER QUESTÃO
   * ============================================================
   */

  async function removerQuestao(
    index: number
  ) {
    const confirmar =
      confirm(
        "Tem certeza que deseja remover esta questão?"
      )

    if (!confirmar) return

    const questao =
      questoes[index]

    /*
     * Se já existe no banco,
     * remove também do Supabase.
     */
    if (questao.id) {
      const { error } =
        await supabase
          .from("questoes")
          .delete()
          .eq(
            "id",
            questao.id
          )

      if (error) {
        alert(
          "Erro ao remover questão."
        )

        console.error(error)

        return
      }
    }

    const novas =
      questoes
        .filter(
          (_, i) =>
            i !== index
        )
        .map(
          (q, i) => ({
            ...q,

            ordem:
              i + 1,
          })
        )

    setQuestoes(novas)
  }

  /*
   * ============================================================
   * SALVAR ALTERAÇÕES
   * ============================================================
   */

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!tema) return

    const titulo =
      formTema.titulo.trim()

    const descricao =
      formTema.descricao.trim()

    const novoSlug =
      gerarSlug(titulo)

    if (!titulo) {
      alert(
        "Preencha o título do tema."
      )

      return
    }

    if (!novoSlug) {
      alert(
        "O título precisa gerar um slug válido."
      )

      return
    }

    if (
      questoes.length === 0
    ) {
      alert(
        "Adicione pelo menos uma questão."
      )

      return
    }

    for (
      const q of questoes
    ) {
      if (
        !q.pergunta.trim()
      ) {
        alert(
          "Preencha o enunciado de todas as questões."
        )

        return
      }

      if (
        q.tipo ===
        "fechada"
      ) {
        if (
          !q.alternativa_a.trim() ||
          !q.alternativa_b.trim() ||
          !q.alternativa_c.trim() ||
          !q.alternativa_d.trim() ||
          !q.correta
        ) {
          alert(
            "Preencha as alternativas e a resposta correta das questões fechadas."
          )

          return
        }
      }

      if (
        q.tipo ===
          "aberta" &&
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
     * ==========================================================
     * ATUALIZAR TEMA
     * ==========================================================
     */

    const {
      error: temaError,
    } = await supabase
      .from("temas_questoes")
      .update({
        titulo,

        descricao:
          descricao || null,

        slug:
          novoSlug,

        /*
         * Agora também atualiza
         * a visibilidade.
         */
        visivel:
          formTema.visivel,
      })
      .eq(
        "id",
        tema.id
      )

    if (temaError) {
      setSalvando(false)

      alert(
        "Erro ao salvar tema."
      )

      console.error(
        temaError
      )

      return
    }

    /*
     * ==========================================================
     * ATUALIZAR / CRIAR QUESTÕES
     * ==========================================================
     */

    for (
      const [
        index,
        q,
      ] of questoes.entries()
    ) {
      const dadosQuestao = {
        tema_id:
          tema.id,

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
      }

      /*
       * QUESTÃO EXISTENTE
       */
      if (q.id) {
        const { error } =
          await supabase
            .from("questoes")
            .update(
              dadosQuestao
            )
            .eq(
              "id",
              q.id
            )

        if (error) {
          setSalvando(false)

          alert(
            "Erro ao atualizar uma questão."
          )

          console.error(
            error
          )

          return
        }
      }

      /*
       * NOVA QUESTÃO
       */
      else {
        const { error } =
          await supabase
            .from("questoes")
            .insert([
              dadosQuestao,
            ])

        if (error) {
          setSalvando(false)

          alert(
            "Erro ao criar uma questão."
          )

          console.error(
            error
          )

          return
        }
      }
    }

    setSalvando(false)

    /*
     * Usa o slug novo porque
     * o título pode ter sido alterado.
     */
    router.push(
      `/questoes/${novoSlug}`
    )
  }

  /*
   * ============================================================
   * CARREGAMENTO
   * ============================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">

            <p className="text-muted-foreground">
              Carregando edição...
            </p>

          </div>
        </main>
      </div>
    )
  }

  /*
   * ============================================================
   * TEMA NÃO ENCONTRADO
   * ============================================================
   */

  if (!tema) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">

            <p className="text-muted-foreground">
              Tema não encontrado.
            </p>

          </div>
        </main>
      </div>
    )
  }

  /*
   * ============================================================
   * INTERFACE
   * ============================================================
   */

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

          {/* CABEÇALHO */}
          <div className="mb-8">

            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Editar Questões
            </h1>

            <p className="text-muted-foreground">
              Edite questões fechadas, abertas, imagens e comentários.
            </p>

          </div>

          <form
            onSubmit={
              handleSubmit
            }
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

              {/* ================================================= */}
              {/* VISIBILIDADE                                      */}
              {/* ================================================= */}

              <div className="pt-2">

                <div className="mb-3">

                  <p className="text-sm font-medium text-foreground">
                    Visibilidade
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Controle se este tema aparece para os alunos.
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
                            ? "Este tema está disponível normalmente na página de questões."
                            : "Somente administradores conseguem visualizar e acessar este tema."}

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

                {/* AVISO QUANDO OCULTO */}
                {!formTema.visivel && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400">

                    <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                    <p>
                      O conteúdo continuará salvo e poderá ser editado normalmente, mas não aparecerá para os alunos.
                    </p>

                  </div>
                )}

              </div>

            </div>

            {/* ================================================== */}
            {/* QUESTÕES                                           */}
            {/* ================================================== */}

            <div className="flex items-center justify-between gap-4">

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

            {/* ================================================== */}
            {/* LISTA DE QUESTÕES                                  */}
            {/* ================================================== */}

            <div className="space-y-6">

              {questoes.map(
                (
                  q,
                  index
                ) => (

                  <div
                    key={
                      q.id ||
                      index
                    }
                    className="rounded-2xl border border-border bg-card p-6 space-y-4"
                  >

                    {/* CABEÇALHO */}
                    <div className="flex items-center justify-between gap-4">

                      <h3 className="font-semibold text-foreground">
                        Questão{" "}
                        {index + 1}
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
                      value={
                        q.tipo
                      }
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

                    {/* ENUNCIADO */}
                    <textarea
                      placeholder="Enunciado da questão"
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
                      className="w-full min-h-24 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-sky-500"
                    />

                    {/* IMAGEM */}
                    <div>

                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">

                        <ImageIcon className="h-4 w-4 text-sky-400" />

                        Imagem da questão

                      </div>

                      <input
                        placeholder="Cole aqui a URL da imagem"
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
                          alt="Prévia da imagem"
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

                        {/* CORRETA */}
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
                            Resposta correta: A
                          </option>

                          <option value="B">
                            Resposta correta: B
                          </option>

                          <option value="C">
                            Resposta correta: C
                          </option>

                          <option value="D">
                            Resposta correta: D
                          </option>

                          <option value="E">
                            Resposta correta: E
                          </option>

                        </select>

                      </>

                    ) : (

                      /* QUESTÃO ABERTA */

                      <textarea
                        placeholder="Resposta esperada da questão aberta"
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
                      placeholder="Comentário/explicação que aparece após a resposta"
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

            {/* ================================================== */}
            {/* SALVAR                                             */}
            {/* ================================================== */}

            <button
              type="submit"
              disabled={
                salvando
              }
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition disabled:opacity-60 ${
                formTema.visivel
                  ? "bg-sky-500 hover:bg-sky-600"
                  : "bg-amber-500 hover:bg-amber-600"
              }`}
            >

              <Save className="h-4 w-4" />

              {salvando
                ? "Salvando..."
                : formTema.visivel
                  ? "Salvar e manter publicado"
                  : "Salvar como oculto"}

            </button>

          </form>

        </div>

      </main>
    </div>
  )
}
