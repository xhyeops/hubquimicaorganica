"use client"

import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { Pill, ArrowRight, Search, Beaker } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Farmaco = {
  id: string
  nome: string
  classe: string
  categoria: string
}

export default function FarmacosPage() {
  const [busca, setBusca] = useState("")
  const [farmacos, setFarmacos] = useState<Farmaco[]>([])

  useEffect(() => {
    async function carregarFarmacos() {
      const { data, error } = await supabase
        .from("farmacos")
        .select("id, nome, classe, categoria")
        .order("nome", { ascending: true })

      if (error) {
        console.error("Erro ao carregar fármacos:", error)
        return
      }

      setFarmacos(data || [])
    }

    carregarFarmacos()
  }, [])

  const farmacosFiltrados = farmacos.filter((farmaco) =>
    farmaco.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    farmaco.classe?.toLowerCase().includes(busca.toLowerCase()) ||
    farmaco.categoria?.toLowerCase().includes(busca.toLowerCase())
  )

  function criarSlug(nome: string) {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-medium">
              <Pill className="h-3.5 w-3.5" />
              <span>Consulta Rápida</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Fármacos
            </h1>

            <p className="text-muted-foreground">
              Consulte rapidamente mecanismos de ação, indicações e efeitos adversos.
            </p>
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar fármaco, classe ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {farmacosFiltrados.map((farmaco) => (
              <Link
                key={farmaco.id}
                href={`/farmacos/${criarSlug(farmaco.nome)}`}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border p-5 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/5 hover:-translate-y-0.5 hover:border-rose-500/30"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg mb-3">
                  <Beaker className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <h2 className="font-semibold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {farmaco.nome}
                  </h2>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {farmaco.classe}
                  </p>

                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">
                    {farmaco.categoria}
                  </span>
                </div>

                <ArrowRight className="absolute top-5 right-5 h-4 w-4 text-muted-foreground group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>

          {farmacosFiltrados.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-4">
                <Pill className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                Nenhum fármaco encontrado
              </h3>
              <p className="text-sm text-muted-foreground">
                Tente buscar por outro termo.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}