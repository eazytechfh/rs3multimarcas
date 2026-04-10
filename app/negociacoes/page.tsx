"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { KanbanBoard } from "@/components/kanban-board"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/utils/supabase/client"

const supabase = createClient()

export default function Negociacoes() {
  const router = useRouter()
  const [empresaId, setEmpresaId] = useState<number | null>(null)
  const [abrirNovoLead, setAbrirNovoLead] = useState(false)
  const [vendedores, setVendedores] = useState<any[]>([])
  const [salvando, setSalvando] = useState(false)
  const [reloadKanbanKey, setReloadKanbanKey] = useState(0)

  const [novoLead, setNovoLead] = useState({
    nome_lead: "",
    telefone: "",
    email: "",
    origem: "",
    vendedor: "",
    veiculo_interesse: "",
    observacao_vendedor: "",
    cpf: "",
    data_nascimento: "",
    resumo_qualificacao: "",
    bot_ativo: false,
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }

    setEmpresaId(user.id_empresa)
    carregarVendedores(user.id_empresa)
  }, [router])

  async function carregarVendedores(companyId: number) {
    const { data, error } = await supabase
      .from("VENDEDORES")
      .select("ID_VENDEDOR, NOME")
      .eq("ATIVO", true)
      .eq("ID_EMPRESA", companyId)
      .order("NOME", { ascending: true })

    if (!error) {
      setVendedores(data || [])
    }
  }

  function atualizarCampo(campo: string, valor: any) {
    setNovoLead((prev) => ({ ...prev, [campo]: valor }))
  }

  function limparFormulario() {
    setNovoLead({
      nome_lead: "",
      telefone: "",
      email: "",
      origem: "",
      vendedor: "",
      veiculo_interesse: "",
      observacao_vendedor: "",
      cpf: "",
      data_nascimento: "",
      resumo_qualificacao: "",
      bot_ativo: false,
    })
  }

  async function salvarLead() {
    try {
      if (!empresaId) {
        alert("Empresa nao identificada.")
        return
      }

      if (!novoLead.nome_lead.trim()) {
        alert("Preencha o nome do lead.")
        return
      }

      setSalvando(true)

      const payload = {
        id_empresa: empresaId,
        nome_lead: novoLead.nome_lead.trim() || null,
        telefone: novoLead.telefone.trim() || null,
        email: novoLead.email.trim() || null,
        origem: novoLead.origem.trim() || null,
        vendedor: novoLead.vendedor.trim() || null,
        veiculo_interesse: novoLead.veiculo_interesse.trim() || null,
        resumo_qualificacao: novoLead.resumo_qualificacao.trim() || null,
        observacao_vendedor: novoLead.observacao_vendedor.trim() || null,
        cpf: novoLead.cpf.trim() || null,
        data_nascimento: novoLead.data_nascimento || null,
        estagio_lead: "oportunidade",
        bot_ativo: novoLead.bot_ativo,
        valor: 0,
      }

      const { error } = await supabase.from("BASE_DE_LEADS").insert([payload])

      if (error) {
        alert(`Erro ao salvar lead: ${error.message}`)
        return
      }

      setAbrirNovoLead(false)
      limparFormulario()
      setReloadKanbanKey((prev) => prev + 1)
      alert("Lead criado com sucesso")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-[#F6F2FF] to-[#EEF4FF]">
      <SidebarNav />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <style>{`
          .bg-black,
          .bg-slate-900,
          .bg-slate-950,
          .bg-card,
          .bg-muted,
          .bg-white,
          .kanban-column,
          .kanban-card,
          [class*="bg-black"],
          [class*="bg-slate"],
          [class*="bg-card"],
          [class*="surface"] {
            background-color: #ffffff !important;
            border-color: #ddd6fe !important;
          }

          .text-gray-400,
          .text-gray-500,
          .text-gray-600,
          .text-gray-700,
          .text-gray-900,
          .text-muted-foreground {
            color: #4b5563 !important;
          }

          input, select, textarea {
            background-color: #ffffff !important;
            color: #1f2937 !important;
            border: 1px solid #c4b5fd !important;
          }

          .view-toggle-btn-active,
          button.bg-\\[\\#22C55E\\] {
            background-color: #8b5cf6 !important;
            color: #ffffff !important;
            border-color: #8b5cf6 !important;
          }

          .view-toggle-btn-outline {
            color: #8b5cf6 !important;
            border-color: #c4b5fd !important;
          }

          .bg-green-50,
          .bg-green-100,
          .bg-blue-50,
          .kanban-info {
            background-color: #faf8ff !important;
            border-color: #d8ccff !important;
            color: #1f2937 !important;
          }

          .border-green-300,
          .border-green-500,
          .border-\\[\\#22C55E\\] {
            border-color: #d8ccff !important;
          }

          .text-green-600,
          .text-green-700,
          .text-green-800,
          .text-\\[\\#22C55E\\] {
            color: #7c3aed !important;
          }
        `}</style>

        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#7C3AED]">Negociações</h1>
                <p className="text-[#6B7280]">Gerencie seus leads através do funil de vendas</p>
              </div>

              <Button onClick={() => setAbrirNovoLead(true)} className="bg-[#8B5CF6] text-white hover:bg-[#7C3AED]">
                Novo Lead
              </Button>
            </div>

            <Dialog open={abrirNovoLead} onOpenChange={setAbrirNovoLead}>
              <DialogContent className="max-w-4xl bg-white border border-[#D8CCFF] text-[#1F2937] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-[#7C3AED] text-2xl">Criar novo lead</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input placeholder="Nome do lead" value={novoLead.nome_lead} onChange={(e) => atualizarCampo("nome_lead", e.target.value)} />
                  <Input placeholder="Telefone" value={novoLead.telefone} onChange={(e) => atualizarCampo("telefone", e.target.value)} />
                  <Input placeholder="Email" value={novoLead.email} onChange={(e) => atualizarCampo("email", e.target.value)} />
                  <Input placeholder="Origem" value={novoLead.origem} onChange={(e) => atualizarCampo("origem", e.target.value)} />

                  <select className="h-10 rounded-md px-3" value={novoLead.vendedor} onChange={(e) => atualizarCampo("vendedor", e.target.value)}>
                    <option value="">Selecione um vendedor</option>
                    {vendedores.map((v) => (
                      <option key={v.ID_VENDEDOR} value={v.NOME}>
                        {v.NOME}
                      </option>
                    ))}
                  </select>

                  <Input placeholder="Veículo interesse" value={novoLead.veiculo_interesse} onChange={(e) => atualizarCampo("veiculo_interesse", e.target.value)} />
                  <Input placeholder="CPF" value={novoLead.cpf} onChange={(e) => atualizarCampo("cpf", e.target.value)} />
                  <Input type="date" value={novoLead.data_nascimento} onChange={(e) => atualizarCampo("data_nascimento", e.target.value)} />

                  <Textarea
                    placeholder="Observação vendedor"
                    className="col-span-1 min-h-[90px] md:col-span-2"
                    value={novoLead.observacao_vendedor}
                    onChange={(e) => atualizarCampo("observacao_vendedor", e.target.value)}
                  />

                  <Textarea
                    placeholder="Resumo qualificação"
                    className="col-span-1 min-h-[90px] md:col-span-2"
                    value={novoLead.resumo_qualificacao}
                    onChange={(e) => atualizarCampo("resumo_qualificacao", e.target.value)}
                  />

                  <div className="col-span-1 flex items-center justify-between rounded-lg border border-[#D8CCFF] bg-[#FAF8FF] p-4 md:col-span-2">
                    <span className="text-[#1F2937]">Ativar IA</span>
                    <Button type="button" onClick={() => atualizarCampo("bot_ativo", !novoLead.bot_ativo)} className="bg-[#8B5CF6] text-white hover:bg-[#7C3AED]">
                      {novoLead.bot_ativo ? "IA Ativada" : "IA Desativada"}
                    </Button>
                  </div>

                  <div className="col-span-1 flex justify-end gap-3 md:col-span-2">
                    <Button variant="outline" onClick={() => setAbrirNovoLead(false)} className="border-[#C4B5FD] text-[#8B5CF6] bg-transparent hover:bg-[#F3E8FF]">
                      Cancelar
                    </Button>
                    <Button onClick={salvarLead} disabled={salvando} className="bg-[#8B5CF6] text-white hover:bg-[#7C3AED]">
                      {salvando ? "Salvando..." : "Salvar Lead"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {empresaId && <KanbanBoard key={reloadKanbanKey} empresaId={empresaId} />}
          </div>
        </main>
      </div>
    </div>
  )
}
