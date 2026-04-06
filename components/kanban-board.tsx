"use client"

import { useEffect, useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  getLeads,
  getLeadsCount,
  updateLeadBasicInfo,
  updateLeadStage,
  generateResumoComercial,
  deleteLead,
  type Lead,
  ESTAGIO_LABELS,
  ESTAGIO_COLORS,
  VALID_ESTAGIOS,
  formatCurrency,
} from "@/lib/leads"
import { getVendedores, type Vendedor } from "@/lib/agendamentos"
import { getCurrentUser } from "@/lib/auth"
import {
  Search,
  Filter,
  Phone,
  User,
  Calendar,
  CreditCard,
  MapPin,
  Car,
  LayoutGrid,
  List,
  DollarSign,
  FileText,
  Sparkles,
  Loader2,
  Move,
  AlertTriangle,
  Trash2,
  Pencil,
} from "lucide-react"
import { LeadsListView } from "./leads-list-view"
import { EditableValueField } from "./editable-value-field"
import { EditableObservacaoField } from "./editable-observacao-field"
import { EditableVeiculoField } from "./editable-veiculo-field"
import { EditableCpfField } from "./editable-cpf-field"
import { EditableDataNascimentoField } from "./editable-data-nascimento-field"

const COLUNAS_ADMIN = [
  "novos_leads",
  "em_qualificacao",
  "oportunidade",
  "em_negociacao",
  "follow_up",
  "resgate",
  "fechado",
  "nao_fechou",
]

const COLUNAS_VENDEDOR = [
  "oportunidade",
  "em_negociacao",
  "follow_up",
  "resgate",
  "fechado",
  "nao_fechou",
]

function normalizeSellerName(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

interface KanbanBoardProps {
  empresaId: number
}

export function KanbanBoard({ empresaId }: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOrigem, setFilterOrigem] = useState("")
  const [filterEstagio, setFilterEstagio] = useState("")
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [generatingResumo, setGeneratingResumo] = useState(false)
  const [resumoMessage, setResumoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [movingLead, setMovingLead] = useState<number | null>(null)
  const [deletingLead, setDeletingLead] = useState<number | null>(null)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUNAS_ADMIN)
  const [totalLeadsCount, setTotalLeadsCount] = useState(0)
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [isEditingLeadInfo, setIsEditingLeadInfo] = useState(false)
  const [savingLeadInfo, setSavingLeadInfo] = useState(false)
  const [editLeadNome, setEditLeadNome] = useState("")
  const [editLeadVendedor, setEditLeadVendedor] = useState("")

  const ESTAGIOS_OCULTOS_UI = ["pesquisa_atendimento"]
  const ESTAGIOS_UI = VALID_ESTAGIOS.filter((s) => !ESTAGIOS_OCULTOS_UI.includes(s))
  const ESTAGIO_LABELS_UI = Object.entries(ESTAGIO_LABELS).filter(([key]) => !ESTAGIOS_OCULTOS_UI.includes(key))

  useEffect(() => {
    loadLeads()

    const user = getCurrentUser()
    const cargo = (user?.cargo || "").toLowerCase()

    if (cargo === "vendedor") {
      setVisibleColumns(COLUNAS_VENDEDOR)
    } else {
      setVisibleColumns(COLUNAS_ADMIN)
    }
  }, [])

  useEffect(() => {
    filterLeads()
  }, [leads, searchTerm, filterOrigem, filterEstagio])

  useEffect(() => {
    if (!selectedLead) {
      setIsEditingLeadInfo(false)
      setEditLeadNome("")
      setEditLeadVendedor("")
      return
    }

    setEditLeadNome(selectedLead.nome || "")
    setEditLeadVendedor(selectedLead.vendedor || "")
  }, [selectedLead])

  const loadLeads = async () => {
    const user = getCurrentUser()

    if (user) {
      const [leadsData, totalCount, vendedoresData] = await Promise.all([
        getLeads(user.id_empresa),
        getLeadsCount(user.id_empresa),
        getVendedores(user.id_empresa),
      ])

      let data = leadsData

      if ((user.cargo || "").toLowerCase() === "vendedor") {
        const currentSeller = normalizeSellerName(user.nome_usuario)
        data = data.filter((lead) => normalizeSellerName(lead.vendedor) === currentSeller)
      }

      setLeads(data)
      setTotalLeadsCount(totalCount)
      setVendedores(vendedoresData)
    }

    setLoading(false)
  }

  const filterLeads = () => {
    let filtered = [...leads]

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.telefone?.includes(searchTerm) ||
          lead.vendedor?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterOrigem && filterOrigem !== "all") {
      filtered = filtered.filter((lead) => lead.origem === filterOrigem)
    }

    if (filterEstagio && filterEstagio !== "all") {
      filtered = filtered.filter((lead) => lead.estagio_lead === filterEstagio)
    }

    setFilteredLeads(filtered)
  }

  const handleDragStart = (start: any) => {
    const leadId = Number.parseInt(start.draggableId)
    const lead = leads.find((l) => l.id === leadId)
    setDraggedLead(lead || null)
  }

  const handleDragEnd = async (result: any) => {
    setDraggedLead(null)

    if (!result.destination) {
      return
    }

    const { source, destination, draggableId } = result

    if (source.droppableId === destination.droppableId) {
      return
    }

    const leadId = Number.parseInt(draggableId)
    const newStage = destination.droppableId
    const oldStage = source.droppableId

    if (!VALID_ESTAGIOS.includes(newStage)) {
      console.error("Invalid stage:", newStage)
      setResumoMessage({
        type: "error",
        text: `Estágio inválido: ${newStage}. Recarregue a página e tente novamente.`,
      })
      setTimeout(() => setResumoMessage(null), 5000)
      return
    }

    console.log("Moving lead:", {
      leadId,
      from: oldStage,
      to: newStage,
      validStages: VALID_ESTAGIOS,
    })

    setMovingLead(leadId)

    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, estagio_lead: newStage, updated_at: new Date().toISOString() } : lead,
      ),
    )

    try {
      const success = await updateLeadStage(leadId, newStage)

      if (!success) {
        setLeads((prevLeads) =>
          prevLeads.map((lead) => (lead.id === leadId ? { ...lead, estagio_lead: oldStage } : lead)),
        )

        setResumoMessage({
          type: "error",
          text: "Erro ao mover o lead. Verifique o console para mais detalhes e tente novamente.",
        })

        setTimeout(() => setResumoMessage(null), 5000)
      } else {
        console.log("Lead moved successfully")
      }
    } catch (error) {
      console.error("Unexpected error moving lead:", error)

      setLeads((prevLeads) =>
        prevLeads.map((lead) => (lead.id === leadId ? { ...lead, estagio_lead: oldStage } : lead)),
      )

      setResumoMessage({
        type: "error",
        text: "Erro inesperado ao mover o lead. Tente novamente.",
      })

      setTimeout(() => setResumoMessage(null), 5000)
    } finally {
      setMovingLead(null)
    }
  }

  const handleValueUpdate = (leadId: number, newValue: number) => {
    setLeads((prevLeads) => prevLeads.map((lead) => (lead.id === leadId ? { ...lead, valor: newValue } : lead)))

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, valor: newValue })
    }
  }

  const handleObservacaoUpdate = (leadId: number, newObservacao: string) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => (lead.id === leadId ? { ...lead, observacao_vendedor: newObservacao } : lead)),
    )

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, observacao_vendedor: newObservacao })
    }
  }

  const handleVeiculoUpdate = (leadId: number, newVeiculo: string) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => (lead.id === leadId ? { ...lead, veiculo_interesse: newVeiculo } : lead)),
    )

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, veiculo_interesse: newVeiculo })
    }
  }

  const handleCpfUpdate = (leadId: number, newCpf: string) => {
    setLeads((prevLeads) => prevLeads.map((lead) => (lead.id === leadId ? { ...lead, cpf: newCpf } : lead)))

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, cpf: newCpf })
    }
  }

  const handleDataNascimentoUpdate = (leadId: number, newDataNascimento: string) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => (lead.id === leadId ? { ...lead, data_nascimento: newDataNascimento } : lead)),
    )

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, data_nascimento: newDataNascimento })
    }
  }

  const handleGenerateResumo = async () => {
    if (!selectedLead) return

    setGeneratingResumo(true)
    setResumoMessage(null)
    setShowProgressDialog(true)
    setProgressValue(0)

    const duration = 30000
    const intervalTime = 100
    const increment = (100 / duration) * intervalTime

    const progressInterval = setInterval(() => {
      setProgressValue((prev) => {
        const next = prev + increment
        if (next >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return next
      })
    }, intervalTime)

    try {
      const success = await generateResumoComercial(selectedLead)

      await new Promise((resolve) => setTimeout(resolve, duration))

      if (success) {
        setResumoMessage({
          type: "success",
          text: "Resumo comercial gerado com sucesso!",
        })
      } else {
        setResumoMessage({
          type: "error",
          text: "Erro ao gerar resumo comercial. Tente novamente.",
        })
      }
    } catch (error) {
      setResumoMessage({
        type: "error",
        text: "Erro ao processar solicitação. Verifique sua conexão.",
      })
    } finally {
      setGeneratingResumo(false)
      setShowProgressDialog(false)
      setProgressValue(0)

      setTimeout(() => {
        setResumoMessage(null)
      }, 5000)
    }
  }

  const handleDeleteLead = async (leadId: number) => {
    if (!confirm("Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.")) {
      return
    }

    setDeletingLead(leadId)

    try {
      const success = await deleteLead(leadId)

      if (success) {
        setLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== leadId))

        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(null)
        }

        setResumoMessage({
          type: "success",
          text: "Lead excluído com sucesso!",
        })
      } else {
        setResumoMessage({
          type: "error",
          text: "Erro ao excluir o lead. Tente novamente.",
        })
      }
    } catch (error) {
      setResumoMessage({
        type: "error",
        text: "Erro inesperado ao excluir o lead.",
      })
    } finally {
      setDeletingLead(null)

      setTimeout(() => {
        setResumoMessage(null)
      }, 5000)
    }
  }

  const handleSaveLeadInfo = async () => {
    if (!selectedLead) return

    const normalizedNome = editLeadNome.trim()
    if (!normalizedNome) return

    setSavingLeadInfo(true)

    try {
      const success = await updateLeadBasicInfo(selectedLead.id, normalizedNome, editLeadVendedor)

      if (success) {
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead.id === selectedLead.id ? { ...lead, nome: normalizedNome, vendedor: editLeadVendedor } : lead,
          ),
        )
        setSelectedLead({ ...selectedLead, nome: normalizedNome, vendedor: editLeadVendedor })
        setIsEditingLeadInfo(false)
      } else {
        setResumoMessage({
          type: "error",
          text: "Erro ao editar lead. Tente novamente.",
        })
        setTimeout(() => setResumoMessage(null), 4000)
      }
    } catch (error) {
      setResumoMessage({
        type: "error",
        text: "Erro inesperado ao editar lead.",
      })
      setTimeout(() => setResumoMessage(null), 4000)
    } finally {
      setSavingLeadInfo(false)
    }
  }

  const getLeadsByStage = (stage: string) => {
    return filteredLeads.filter((lead) => lead.estagio_lead === stage)
  }

  const getStageTotal = (stage: string) => {
    const stageLeads = getLeadsByStage(stage)
    return stageLeads.reduce((total, lead) => total + (lead.valor || 0), 0)
  }

  const origens = [...new Set(leads.map((lead) => lead.origem).filter(Boolean))]
  const vendedoresFallback = [...new Set(leads.map((lead) => lead.vendedor).filter(Boolean))]
    .map((nome) => ({ id: `lead-${nome}`, nome: nome as string }))
  const vendedoresOptions = vendedores.length > 0 ? vendedores : vendedoresFallback

  const handleLeadsUpdate = () => {
    loadLeads()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {visibleColumns.map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 w-24 rounded bg-gray-200"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded bg-gray-100"></div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Visualização
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-2 ${
                  viewMode === "kanban" ? "view-toggle-btn-active" : "view-toggle-btn-outline"
                }`}
                style={{ display: "inline-flex", visibility: "visible", opacity: 1 }}
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 ${
                  viewMode === "list" ? "view-toggle-btn-active" : "view-toggle-btn-outline"
                }`}
                style={{ display: "inline-flex", visibility: "visible", opacity: 1 }}
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {resumoMessage && (
        <Alert className={`${resumoMessage.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className={resumoMessage.type === "success" ? "text-green-700" : "text-red-700"}>
            {resumoMessage.text}
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="bg-slate-900 border-[#22C55E]">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-[#22C55E] animate-spin" />
              Gerando Resumo Comercial
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Aguarde enquanto analisamos as informações do lead...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={progressValue} className="h-3" />
            <p className="text-center text-sm text-gray-400">{Math.round(progressValue)}% completo</p>
          </div>
        </DialogContent>
      </Dialog>

      {viewMode === "list" ? (
        <LeadsListView
          empresaId={empresaId}
          leads={leads}
          totalLeadsCount={totalLeadsCount}
          onLeadsUpdate={handleLeadsUpdate}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, telefone ou vendedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterOrigem} onValueChange={setFilterOrigem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as origens</SelectItem>
                    {origens.map((origem) => (
                      <SelectItem key={origem} value={origem!}>
                        {origem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterEstagio} onValueChange={setFilterEstagio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estágios</SelectItem>
                    {ESTAGIO_LABELS_UI.map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#22C55E]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Move className="h-5 w-5 text-[#22C55E]" />
                <div>
                  <p className="text-sm font-medium text-black">
                    💡 <strong>Como usar:</strong> Arraste e solte os cards dos leads entre as colunas para alterar o estágio
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    As alterações são salvas automaticamente no banco de dados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-3">
              <div className="text-xs text-gray-600">
                <strong>Debug:</strong> Estágios válidos: {ESTAGIOS_UI.join(", ")}
                {movingLead && <span className="ml-4 text-orange-600">Movendo lead ID: {movingLead}</span>}
              </div>
            </CardContent>
          </Card>

          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="overflow-x-auto">
              <div className="flex min-w-max gap-4 pb-4">
                {visibleColumns.map((stage) => (
                  <Droppable key={stage} droppableId={stage}>
                    {(provided, snapshot) => (
                      <Card
                        className={`w-80 h-[70vh] min-h-[500px] flex flex-col flex-shrink-0 overflow-hidden transition-all duration-200 ${
                          snapshot.isDraggingOver
                            ? "bg-gradient-to-b from-blue-50 to-blue-100 border-blue-300 shadow-lg transform scale-105"
                            : "hover:shadow-md"
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              {snapshot.isDraggingOver && <Move className="h-4 w-4 text-blue-500 animate-pulse" />}
                              {ESTAGIO_LABELS[stage as keyof typeof ESTAGIO_LABELS] ?? stage}
                            </span>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {getLeadsByStage(stage).length}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                {formatCurrency(getStageTotal(stage))}
                              </Badge>
                            </div>
                          </CardTitle>
                          {snapshot.isDraggingOver && (
                            <div className="text-xs text-blue-600 font-medium animate-pulse">
                              ↓ Solte aqui para mover
                            </div>
                          )}
                        </CardHeader>

                        <CardContent
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex-1 space-y-2 overflow-y-scroll pr-2"
                        >
                          {getLeadsByStage(stage).map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                    snapshot.isDragging
                                      ? "shadow-2xl rotate-3 scale-105 bg-white border-blue-300 z-50"
                                      : "hover:shadow-md hover:-translate-y-1"
                                  } ${movingLead === lead.id ? "opacity-50" : ""}`}
                                  onClick={() => {
                                    if (!snapshot.isDragging) setSelectedLead(lead)
                                  }}
                                >
                                  <CardContent className="p-3">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-foreground">
                                        <h4 className="font-medium text-sm text-gray-900 truncate flex-1">{lead.nome}</h4>
                                        <div className="flex items-center gap-1">
                                          {movingLead === lead.id && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                                          <Move className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                        </div>
                                      </div>

                                      <div className="border border-gray-200 rounded p-1" onClick={(e) => e.stopPropagation()}>
                                        <EditableValueField
                                          leadId={lead.id}
                                          currentValue={lead.valor || 0}
                                          onValueUpdate={(newValue) => handleValueUpdate(lead.id, newValue)}
                                        />
                                      </div>

                                      {lead.telefone && (
                                        <p className="text-xs text-gray-600 flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {lead.telefone}
                                        </p>
                                      )}

                                      {lead.veiculo_interesse && (
                                        <p className="text-xs text-gray-600 flex items-center gap-1 truncate">
                                          <Car className="h-3 w-3 flex-shrink-0" />
                                          <span className="truncate">{lead.veiculo_interesse}</span>
                                        </p>
                                      )}

                                      <div className="flex justify-between items-center">
                                        {lead.origem && (
                                          <Badge variant="outline" className="text-xs">
                                            {lead.origem}
                                          </Badge>
                                        )}
                                        {lead.vendedor && (
                                          <span className="text-xs text-gray-500 truncate ml-2">{lead.vendedor}</span>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}

                          {provided.placeholder}

                          {getLeadsByStage(stage).length === 0 && (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                              <div className="text-xs">Nenhum lead neste estágio</div>
                              <div className="text-xs mt-1">Arraste leads aqui</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </Droppable>
                ))}
              </div>
            </div>
          </DragDropContext>

          <Dialog
            open={!!selectedLead}
            onOpenChange={() => {
              setSelectedLead(null)
              setIsEditingLeadInfo(false)
            }}
          >
            <DialogContent className="max-w-5xl max-h-[95vh] w-[95vw] overflow-hidden">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center gap-2">
                    <User className="h-6 w-6" />
                    Detalhes do Lead
                  </div>

                  {selectedLead && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setIsEditingLeadInfo((prev) => !prev)}
                        className="flex items-center gap-2 bg-[#22C55E] text-black hover:bg-[#16A34A]"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar Lead
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteLead(selectedLead.id)}
                        disabled={deletingLead === selectedLead.id}
                        className="flex items-center gap-2"
                      >
                        {deletingLead === selectedLead.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Excluir Lead
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </DialogTitle>
              </DialogHeader>

              {selectedLead && (
                <div className="flex flex-col h-full max-h-[80vh]">
                  <div className="flex-shrink-0 space-y-4 pb-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-2xl">{selectedLead.nome}</h3>
                        <Badge className={`mt-2 ${ESTAGIO_COLORS[selectedLead.estagio_lead as keyof typeof ESTAGIO_COLORS]}`}>
                          {ESTAGIO_LABELS[selectedLead.estagio_lead as keyof typeof ESTAGIO_LABELS]}
                        </Badge>
                      </div>
                    </div>

                    {isEditingLeadInfo && (
                      <div className="p-4 border border-green-300 rounded-lg bg-green-50 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-green-900">Nome do Lead</label>
                            <Input
                              value={editLeadNome}
                              onChange={(e) => setEditLeadNome(e.target.value)}
                              placeholder="Digite o nome do lead"
                              className="mt-1"
                              disabled={savingLeadInfo}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-green-900">Vendedor</label>
                            <Select
                              value={editLeadVendedor || "__none__"}
                              onValueChange={(value) => setEditLeadVendedor(value === "__none__" ? "" : value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione um vendedor" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Sem vendedor</SelectItem>
                                {vendedoresOptions.map((v) => (
                                  <SelectItem key={v.id} value={v.nome}>
                                    {v.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditLeadNome(selectedLead.nome || "")
                              setEditLeadVendedor(selectedLead.vendedor || "")
                              setIsEditingLeadInfo(false)
                            }}
                            disabled={savingLeadInfo}
                          >
                            Cancelar
                          </Button>

                          <Button
                            onClick={handleSaveLeadInfo}
                            disabled={savingLeadInfo || !editLeadNome.trim()}
                            className="bg-[#22C55E] text-black hover:bg-[#16A34A]"
                          >
                            {savingLeadInfo ? "Salvando..." : "Salvar alterações"}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedLead.telefone && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{selectedLead.telefone}</span>
                        </div>
                      )}

                      {selectedLead.cpf && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium truncate">{selectedLead.cpf}</span>
                        </div>
                      )}

                      {selectedLead.data_nascimento && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {new Date(`${selectedLead.data_nascimento.split("T")[0]}T00:00:00`).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      )}

                      {selectedLead.origem && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{selectedLead.origem}</span>
                        </div>
                      )}

                      {selectedLead.vendedor && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{selectedLead.vendedor}</span>
                        </div>
                      )}

                      {selectedLead.veiculo_interesse && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <Car className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{selectedLead.veiculo_interesse}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {new Date(selectedLead.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 mt-4">
                    <div className="space-y-6 pr-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="text-lg font-semibold text-green-800">Valor do Negócio</span>
                          </div>
                          <EditableValueField
                            leadId={selectedLead.id}
                            currentValue={selectedLead.valor || 0}
                            onValueUpdate={(newValue) => handleValueUpdate(selectedLead.id, newValue)}
                            className="text-xl"
                          />
                        </div>

                        <div>
                          <EditableObservacaoField
                            leadId={selectedLead.id}
                            currentObservacao={selectedLead.observacao_vendedor || ""}
                            onObservacaoUpdate={(newObservacao) =>
                              handleObservacaoUpdate(selectedLead.id, newObservacao)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <EditableVeiculoField
                            leadId={selectedLead.id}
                            currentVeiculo={selectedLead.veiculo_interesse || ""}
                            onVeiculoUpdate={(newVeiculo) => handleVeiculoUpdate(selectedLead.id, newVeiculo)}
                          />
                        </div>

                        <div>
                          <EditableCpfField
                            leadId={selectedLead.id}
                            currentCpf={selectedLead.cpf || ""}
                            onCpfUpdate={(newCpf) => handleCpfUpdate(selectedLead.id, newCpf)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <EditableDataNascimentoField
                            leadId={selectedLead.id}
                            currentDataNascimento={selectedLead.data_nascimento || ""}
                            onDataNascimentoUpdate={(newDataNascimento) =>
                              handleDataNascimentoUpdate(selectedLead.id, newDataNascimento)
                            }
                          />
                        </div>
                      </div>

                      {selectedLead.resumo_qualificacao && (
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            Resumo de Qualificação
                          </h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                              {selectedLead.resumo_qualificacao}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-500" />
                            Resumo Comercial
                          </h4>

                          <Button
                            onClick={handleGenerateResumo}
                            disabled={generatingResumo}
                            className="bg-gradient-to-r from-green-600 to-gray-900 hover:from-green-700 hover:to-black text-white"
                            size="sm"
                          >
                            {generatingResumo ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Gerar Resumo Comercial
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                            {selectedLead.resumo_comercial || (
                              <span className="text-gray-500 italic">
                                Nenhum resumo comercial disponível. Clique em "Gerar Resumo Comercial" para criar um.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="h-4"></div>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}