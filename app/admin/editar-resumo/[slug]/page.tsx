"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import {
  ArrowLeft,
  Save,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Image,
  List,
  ListOrdered,
  Quote,
  LinkIcon,
  Minus,
  Code,
} from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { supabase } from "@/lib/supabase"
import { isAdminEmail } from "@/lib/admin"

export default function EditarResumoPage() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const [titulo, setTitulo] = useState("")
  const [categoria, setCategoria] = useState("")
  const [description, setDescription] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    async function carregarResumo() {
      if (!slug) return

      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push("/login")
        return
      }

      if (!isAdminEmail(userData.user.email)) {
        router.push("/resumos")
        return
      }

      const { data, error } = await supabase
        .from("resumos")
        .select("*")
        .eq("slug", slug)
        .single()

      if (error || !data) {
        setErro(error?.message || "Resumo não encontrado.")
        setLoading(false)
        return
      }

      setTitulo(data.titulo || "")
      setCategoria(data.categoria || "")
      setDescription(data.description || "")
      setConteudo(data.conteudo || "")
      setLoading(false)
    }

    carregarResumo()
  }, [slug, router])

  function inserirMarkdown(antes: string, depois = "", placeholder = "") {
    const textarea = textareaRef.current
    if (!textarea) return

    const inicio = textarea.selectionStart
    const fim = textarea.selectionEnd
    const selecionado = conteudo.substring(inicio, fim)
    const texto = selecionado || placeholder

    const novoConteudo =
      conteudo.substring(0, inicio) +
      antes +
      texto +
      depois +
      conteudo.substring(fim)

    setConteudo(novoConteudo)

    setTimeout(() => {
      textarea.focus()
      const novaPosicaoInicio = inicio + antes.length
      const novaPosicaoFim = novaPosicaoInicio + texto.length
      textarea.setSelectionRange(novaPosicaoInicio, novaPosicaoFim)
    }, 0)
  }

  async function salvarResumo(e: React.FormEvent) {
    e.preventDefault()
    if (!slug) return

    setSaving(true)
    setErro("")

    const { error } = await supabase
      .from("resumos")
      .update({
        titulo,
        categoria: categoria || null,
        description: description || null,
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
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="min-h-screen flex items-center justify-center text-muted-foreground">
            Carregando resumo...
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <Link
            href={`/resumos/${slug}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-sky-400 transition"
          >
            <ArrowLeft size={16} />
            Voltar para o resumo
          </Link>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Editar resumo
              </h1>
              <p className="text-sm text-muted-foreground">
                Use as ferramentas para formatar o texto e veja a prévia em tempo real.
              </p>
            </div>

            <button
              form="form-editar"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/30 disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>

          {erro && (
            <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {erro}
            </p>
          )}

          <form
            id="form-editar"
            onSubmit={salvarResumo}
            className="grid gap-6 lg:grid-cols-2 lg:items-start"
          >
            <section className="rounded-2xl border border-border bg-card p-5">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Título
              </label>

              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="mb-5 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-sky-500"
              />

              <label className="mb-2 block text-sm font-medium text-foreground">
                Categoria
              </label>

              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Funções Orgânicas"
                className="mb-5 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-sky-500"
              />

              <label className="mb-2 block text-sm font-medium text-foreground">
                Descrição
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Resumo curto que aparece na listagem"
                className="mb-5 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-sky-500"
              />

              <label className="mb-2 block text-sm font-medium text-foreground">
                Conteúdo
              </label>

              <div className="mb-3 flex flex-wrap gap-2 rounded-2xl border border-border bg-background/70 p-2">
                <ToolbarButton title="Negrito" onClick={() => inserirMarkdown("**", "**", "texto em negrito")}>
                  <Bold size={16} />
                </ToolbarButton>

                <ToolbarButton title="Itálico" onClick={() => inserirMarkdown("*", "*", "texto em itálico")}>
                  <Italic size={16} />
                </ToolbarButton>

                <ToolbarButton title="Título 2" onClick={() => inserirMarkdown("## ", "", "Título")}>
                  <Heading2 size={16} />
                </ToolbarButton>

                <ToolbarButton title="Título 3" onClick={() => inserirMarkdown("### ", "", "Subtítulo")}>
                  <Heading3 size={16} />
                </ToolbarButton>

                <ToolbarButton title="Link" onClick={() => inserirMarkdown("[", "](https://link.com)", "texto do link")}>
                  <LinkIcon size={16} />
                </ToolbarButton>

                <ToolbarButton title="Imagem" onClick={() => inserirMarkdown("![", "](https://link-da-imagem.com/imagem.jpg)", "descrição da imagem")}>
                  <Image size={16} />
                </ToolbarButton>

                <ToolbarButton title="Lista" onClick={() => inserirMarkdown("- ", "", "item da lista")}>
                  <List size={16} />
                </ToolbarButton>

                <ToolbarButton title="Lista numerada" onClick={() => inserirMarkdown("1. ", "", "item da lista")}>
                  <ListOrdered size={16} />
                </ToolbarButton>

                <ToolbarButton title="Citação" onClick={() => inserirMarkdown("> ", "", "citação")}>
                  <Quote size={16} />
                </ToolbarButton>

                <ToolbarButton title="Código" onClick={() => inserirMarkdown("`", "`", "código")}>
                  <Code size={16} />
                </ToolbarButton>

                <ToolbarButton title="Separador" onClick={() => inserirMarkdown("\n\n---\n\n")}>
                  <Minus size={16} />
                </ToolbarButton>
              </div>

              <textarea
                ref={textareaRef}
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                required
                className="min-h-[760px] w-full resize-y rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm leading-relaxed text-foreground outline-none transition focus:border-sky-500"
              />
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-6">
              <p className="mb-4 text-sm font-medium text-foreground">
                Prévia
              </p>

              <div className="min-h-[760px] max-h-[900px] overflow-y-auto rounded-xl border border-border bg-background p-5 sm:p-6">
                <div className="mb-5">
                  <span className="inline-flex rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-500 dark:text-sky-400">
                    {categoria || "Geral"}
                  </span>

                  <h1 className="mt-3 text-2xl font-bold text-foreground">
                    {titulo || "Título do resumo"}
                  </h1>

                  {description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>

                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold mb-4 text-foreground">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold mt-6 mb-3 text-foreground">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold mt-5 mb-2 text-foreground">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed text-foreground">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 mb-4 space-y-1 text-foreground">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 mb-4 space-y-1 text-foreground">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-foreground">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-sky-500 dark:text-sky-400">
                        {children}
                      </strong>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-sky-500/60 pl-4 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-sm text-sky-500 dark:text-sky-400">
                        {children}
                      </code>
                    ),
                    hr: () => <hr className="my-6 border-border" />,
                    img: ({ src, alt }) => (
                      <img
                        src={src || ""}
                        alt={alt || ""}
                        className="my-6 max-w-full rounded-xl border border-border shadow-lg"
                      />
                    ),
                  }}
                >
                  {conteudo || "Digite o conteúdo do resumo para ver a prévia."}
                </ReactMarkdown>
              </div>
            </section>
          </form>
        </div>
      </main>
    </div>
  )
}

function ToolbarButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-sky-500/10 hover:text-sky-500"
    >
      {children}
    </button>
  )
}