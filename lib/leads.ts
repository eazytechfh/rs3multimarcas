import { createClient } from "@/utils/supabase/client"

export interface Lead {
  id: number
  id_empresa: number
  nome: string
  telefone?: string
  email?: string
  cpf?: string
  data_nascimento?: string
  origem?: string
  vendedor?: string
  veiculo_interesse?: string
  resumo_qualificacao?: string
  estagio_lead: string
  resumo_comercial?: string
  valor: number
  observacao_vendedor?: string
  created_at: string
  updated_at: string
}

export const ESTAGIO_LABELS = {
  novos_leads: "Novos Leads",
  oportunidade: "Oportunidade",
  em_qualificacao: "Em Qualificação",
  em_negociacao: "Em Negociação",
  resgate: "Resgate",
  fechado: "Fechado",
  nao_fechou: "Não Fechou",
  follow_up: "Follow Up",
}

export const ESTAGIO_COLORS = {
  oportunidade: "bg-blue-100 text-blue-800",
  em_qualificacao: "bg-yellow-100 text-yellow-800",
  em_negociacao: "bg-green-100 text-green-800",
  resgate: "bg-purple-100 text-purple-800",
  fechado: "bg-emerald-100 text-emerald-800",
  nao_fechou: "bg-red-100 text-red-800",
  pesquisa_atendimento: "bg-orange-100 text-orange-800",
  follow_up: "bg-indigo-100 text-indigo-800",
}

// Lista dos estágios válidos para validação
export const VALID_ESTAGIOS = [
  "oportunidade",
  "em_qualificacao",
  "em_negociacao",
  "resgate",
  "fechado",
  "nao_fechou",
  "pesquisa_atendimento",
  "follow_up",
]

export async function getLeads(idEmpresa: number): Promise<Lead[]> {
  const supabase = createClient()
  const pageSize = 1000
  let from = 0
  const allLeads: Lead[] = []

  while (true) {
    const { data, error } = await supabase
      .from("BASE_DE_LEADS")
      .select("*, nome:nome_lead")
      .eq("id_empresa", idEmpresa)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error("Error fetching leads:", error)
      return []
    }

    const pageData = (data as Lead[]) || []
    allLeads.push(...pageData)

    if (pageData.length < pageSize) {
      break
    }

    from += pageSize
  }

  return allLeads
}

export async function getLeadsCount(idEmpresa: number): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from("BASE_DE_LEADS")
    .select("*", { count: "exact", head: true })
    .eq("id_empresa", idEmpresa)

  if (error) {
    console.error("Error fetching leads count:", error)
    return 0
  }

  return count ?? 0
}

export async function updateLeadStage(leadId: number, newStage: string): Promise<boolean> {
  // Validar se o estágio é válido
  if (!VALID_ESTAGIOS.includes(newStage)) {
    console.error("Invalid stage:", newStage)
    return false
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        estagio_lead: newStage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      // ✅ Alias também no retorno do update (senão lead.nome vem undefined)
      .select("*, nome:nome_lead")

    if (error) {
      console.error("Error updating lead stage:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return false
    }

    if (!data || data.length === 0) {
      console.error("No lead found with ID:", leadId)
      return false
    }

    console.log("Lead stage updated successfully:", {
      leadId,
      newStage,
      updatedLead: data[0],
    })

    if (newStage === "em_negociacao") {
      try {
        const lead = data[0] as Lead
        console.log("[v0] Lead moved to em_negociacao, creating agendamento for lead:", leadId)

        // Check if agendamento already exists for this lead
        const { data: existingAgendamentos, error: checkError } = await supabase
          .from("AGENDAMENTOS")
          .select("id")
          .eq("lead_id", leadId.toString())

        if (!checkError && !existingAgendamentos?.length) {
          const agendamentoData = {
            id_empresa: lead.id_empresa,
            lead_id: leadId.toString(),
            titulo: `Agendamento - ${lead.nome}`,
            descricao: lead.veiculo_interesse ? `Interesse: ${lead.veiculo_interesse}` : null,
            data_agendamento: new Date().toISOString(),
            status: "Agendado",
            tipo: "visita",
            local: null,
          }

          const { data: newAgendamento, error: agendamentoError } = await supabase
            .from("AGENDAMENTOS")
            .insert([agendamentoData])
            .select()

          if (agendamentoError) {
            console.error("[v0] Error creating agendamento:", agendamentoError)
          } else {
            console.log("[v0] Agendamento created successfully:", newAgendamento?.[0])
          }
        } else {
          console.log("[v0] Agendamento already exists for lead:", leadId)
        }
      } catch (agendamentoError) {
        console.error("[v0] Unexpected error in auto-sync agendamento creation:", agendamentoError)
      }
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead stage:", error)
    return false
  }
}

export async function updateLeadValue(leadId: number, newValue: number): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        valor: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error updating lead value:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead value:", error)
    return false
  }
}

export async function updateLeadObservacao(leadId: number, newObservacao: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        observacao_vendedor: newObservacao,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error updating lead observacao:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead observacao:", error)
    return false
  }
}

export async function updateLeadVeiculo(leadId: number, newVeiculo: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        veiculo_interesse: newVeiculo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error updating lead veiculo:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead veiculo:", error)
    return false
  }
}

export async function updateLeadEmail(leadId: number, newEmail: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        email: newEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error updating lead email:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead email:", error)
    return false
  }
}

function toBrasiliaTime(date: Date): string {
  // Criar nova data com offset de -3 horas (Brasília)
  const brasiliaOffset = -3 * 60 // -3 horas em minutos
  const utc = date.getTime() + date.getTimezoneOffset() * 60000
  const brasiliaTime = new Date(utc + brasiliaOffset * 60000)

  return brasiliaTime.toISOString()
}

export async function generateResumoComercial(lead: Lead): Promise<boolean> {
  try {
    console.log("[v0] Starting webhook call for lead:", lead.id)

    const webhookUrl = "https://n8n.eazy.tec.br/webhook/4472d3f7-7177-473c-bc8a-a527ed52a01d"

    const now = new Date()
    const brasiliaTimestamp = toBrasiliaTime(now)

    // Converter created_at e updated_at para horário de Brasília
    const createdAtBrasilia = toBrasiliaTime(new Date(lead.created_at))
    const updatedAtBrasilia = toBrasiliaTime(new Date(lead.updated_at))

    const payload = {
      id: lead.id,
      id_empresa: lead.id_empresa,
      nome_lead: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      origem: lead.origem,
      vendedor: lead.vendedor,
      veiculo_interesse: lead.veiculo_interesse,
      resumo_qualificacao: lead.resumo_qualificacao,
      estagio_lead: lead.estagio_lead,
      resumo_comercial: lead.resumo_comercial,
      valor: lead.valor,
      observacao_vendedor: lead.observacao_vendedor,
      created_at: createdAtBrasilia,
      updated_at: updatedAtBrasilia,
      timestamp: brasiliaTimestamp,
    }

    console.log("[v0] Webhook payload:", payload)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CRM-Atual-Veiculos/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      mode: "cors", // Explicitly set CORS mode
    })

    clearTimeout(timeoutId)

    console.log("[v0] Webhook response status:", response.status)
    console.log("[v0] Webhook response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error response")
      console.error("[v0] Webhook error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const responseData = await response.text().catch(() => "No response body")
    console.log("[v0] Webhook success response:", responseData)

    return true
  } catch (error) {
    console.error("[v0] Error sending webhook:", error)

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("[v0] Webhook request timed out after 30 seconds")
      } else if (error.message.includes("Failed to fetch")) {
        console.error("[v0] Network error - check if webhook URL is accessible and CORS is configured")
      }
      console.error("[v0] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
    }

    return false
  }
}

export async function sendPesquisaAtendimentoWebhook(lead: Lead): Promise<boolean> {
  try {
    console.log("[v0] Starting pesquisa atendimento webhook call for lead:", lead.id)

    const webhookUrl = "https://eazytech-n8n.gsl3ku.easypanel.host/webhook/7f1e49f9-a476-49b7-9883-8a01fe6622e2"

    const now = new Date()
    const brasiliaTimestamp = toBrasiliaTime(now)

    // Converter created_at e updated_at para horário de Brasília
    const createdAtBrasilia = toBrasiliaTime(new Date(lead.created_at))
    const updatedAtBrasilia = toBrasiliaTime(new Date(lead.updated_at))

    const payload = {
      id: lead.id,
      id_empresa: lead.id_empresa,
      nome_lead: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      origem: lead.origem,
      vendedor: lead.vendedor,
      nome_vendedor: lead.vendedor, // adicionando nome_vendedor como campo separado
      veiculo_interesse: lead.veiculo_interesse,
      resumo_qualificacao: lead.resumo_qualificacao,
      estagio_lead: lead.estagio_lead,
      resumo_comercial: lead.resumo_comercial,
      valor: lead.valor,
      observacao_vendedor: lead.observacao_vendedor,
      created_at: createdAtBrasilia,
      updated_at: updatedAtBrasilia,
      timestamp: brasiliaTimestamp,
      action: "moved_to_pesquisa_atendimento", // identificador da ação
    }

    console.log("[v0] Pesquisa atendimento webhook payload:", payload)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CRM-Atual-Veiculos/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      mode: "cors",
    })

    clearTimeout(timeoutId)

    console.log("[v0] Pesquisa atendimento webhook response status:", response.status)
    console.log("[v0] Pesquisa atendimento webhook response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error response")
      console.error("[v0] Pesquisa atendimento webhook error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const responseData = await response.text().catch(() => "No response body")
    console.log("[v0] Pesquisa atendimento webhook success response:", responseData)

    return true
  } catch (error) {
    console.error("[v0] Error sending pesquisa atendimento webhook:", error)

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("[v0] Pesquisa atendimento webhook request timed out after 30 seconds")
      } else if (error.message.includes("Failed to fetch")) {
        console.error("[v0] Network error - check if webhook URL is accessible and CORS is configured")
      }
      console.error("[v0] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
    }

    return false
  }
}

export async function sendFollowUpWebhook(lead: Lead): Promise<boolean> {
  try {
    console.log("[v0] Starting follow up webhook call for lead:", lead.id)

    const webhookUrl = "https://n8n.eazy.tec.br/webhook/d26d34c4-6c45-4993-94a5-d9005b0d22ae"

    const now = new Date()
    const brasiliaTimestamp = toBrasiliaTime(now)
    const createdAtBrasilia = toBrasiliaTime(new Date(lead.created_at))
    const updatedAtBrasilia = toBrasiliaTime(new Date(lead.updated_at))

    const payload = {
      id: lead.id,
      id_empresa: lead.id_empresa,
      nome_lead: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      origem: lead.origem,
      vendedor: lead.vendedor,
      veiculo_interesse: lead.veiculo_interesse,
      estagio_lead: lead.estagio_lead,
      valor: lead.valor,
      observacao_vendedor: lead.observacao_vendedor,
      created_at: createdAtBrasilia,
      updated_at: updatedAtBrasilia,
      timestamp: brasiliaTimestamp,
      action: "follow_up",
    }

    console.log("[v0] Follow up webhook payload:", payload)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CRM-Atual-Veiculos/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      mode: "cors",
    })

    clearTimeout(timeoutId)

    console.log("[v0] Follow up webhook response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error response")
      console.error("[v0] Follow up webhook error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    return true
  } catch (error) {
    console.error("[v0] Error sending follow up webhook:", error)
    return false
  }
}

export async function sendMensagemWebhook(lead: Lead, mensagem?: string): Promise<boolean> {
  try {
    console.log("[v0] Starting mensagem webhook call for lead:", lead.id)

    const webhookUrl = "https://n8n.eazy.tec.br/webhook/4df3b0b6-a5a9-49a9-9bab-5fdde4b208cc"

    const now = new Date()
    const brasiliaTimestamp = toBrasiliaTime(now)
    const createdAtBrasilia = toBrasiliaTime(new Date(lead.created_at))
    const updatedAtBrasilia = toBrasiliaTime(new Date(lead.updated_at))

    const payload = {
      id: lead.id,
      id_empresa: lead.id_empresa,
      nome_lead: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      origem: lead.origem,
      vendedor: lead.vendedor,
      veiculo_interesse: lead.veiculo_interesse,
      estagio_lead: lead.estagio_lead,
      valor: lead.valor,
      observacao_vendedor: lead.observacao_vendedor,
      created_at: createdAtBrasilia,
      updated_at: updatedAtBrasilia,
      timestamp: brasiliaTimestamp,
      action: "send_message",
      mensagem: mensagem || "",
    }

    console.log("[v0] Mensagem webhook payload:", payload)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CRM-Atual-Veiculos/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      mode: "cors",
    })

    clearTimeout(timeoutId)

    console.log("[v0] Mensagem webhook response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error response")
      console.error("[v0] Mensagem webhook error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    return true
  } catch (error) {
    console.error("[v0] Error sending mensagem webhook:", error)
    return false
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function parseCurrency(value: string): number {
  if (!value || typeof value !== "string") return 0

  // Remove espaços e caracteres especiais, mantendo apenas números, vírgulas e pontos
  let cleanValue = value.replace(/[^\d,.-]/g, "")

  // Se estiver vazio após limpeza, retorna 0
  if (!cleanValue) return 0

  // Se tem vírgula, assumimos que é separador decimal brasileiro
  if (cleanValue.includes(",")) {
    if (cleanValue.includes(".") && cleanValue.includes(",")) {
      cleanValue = cleanValue.replace(/\./g, "").replace(",", ".")
    } else {
      cleanValue = cleanValue.replace(",", ".")
    }
  } else if (cleanValue.includes(".")) {
    const dotCount = (cleanValue.match(/\./g) || []).length
    if (dotCount > 1) {
      cleanValue = cleanValue.replace(/\./g, "")
    } else {
      const parts = cleanValue.split(".")
      if (parts[1] && parts[1].length > 2) {
        cleanValue = cleanValue.replace(".", "")
      }
    }
  }

  const numericValue = Number.parseFloat(cleanValue)
  return isNaN(numericValue) ? 0 : numericValue
}

export async function getLeadStats(idEmpresa: number) {
  const supabase = createClient()

  const { count: totalLeadsGeral, error: countError } = await supabase
    .from("BASE_DE_LEADS")
    .select("*", { count: "exact", head: true })
    .eq("id_empresa", idEmpresa)

  const { data: leads, error } = await supabase
    .from("BASE_DE_LEADS")
    .select("estagio_lead, origem, valor")
    .eq("id_empresa", idEmpresa)

  if (countError || error || !leads) {
    return {
      totalLeads: 0,
      totalLeadsGeral: 0,
      leadsPorEstagio: {},
      leadsPorOrigem: {},
      conversao: "0",
      valorTotal: 0,
      valorMedio: 0,
    }
  }

  const totalLeads = leads.length
  const leadsPorEstagio = leads.reduce((acc: any, lead) => {
    acc[lead.estagio_lead] = (acc[lead.estagio_lead] || 0) + 1
    return acc
  }, {})

  const leadsPorOrigem = leads.reduce((acc: any, lead) => {
    if (lead.origem) {
      acc[lead.origem] = (acc[lead.origem] || 0) + 1
    }
    return acc
  }, {})

  const fechados = leadsPorEstagio.fechado || 0
  const conversao = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) : "0"

  const valorTotal = leads.reduce((sum, lead) => sum + (lead.valor || 0), 0)
  const valorMedio = totalLeads > 0 ? valorTotal / totalLeads : 0

  return {
    totalLeads,
    totalLeadsGeral: totalLeadsGeral ?? totalLeads,
    leadsPorEstagio,
    leadsPorOrigem,
    conversao,
    valorTotal,
    valorMedio,
  }
}

export async function deleteLead(leadId: number): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("BASE_DE_LEADS").delete().eq("id", leadId)

    if (error) {
      console.error("Error deleting lead:", error)
      return false
    }

    console.log("Lead deleted successfully:", leadId)
    return true
  } catch (error) {
    console.error("Unexpected error deleting lead:", error)
    return false
  }
}

export async function updateLeadCpf(leadId: number, newCpf: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        cpf: newCpf || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error updating lead cpf:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead cpf:", error)
    return false
  }
}

export async function updateLeadBasicInfo(leadId: number, nome: string, vendedor: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        nome_lead: nome,
        vendedor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error updating lead basic info:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead basic info:", error)
    return false
  }
}

export async function updateLeadDataNascimento(leadId: number, newDataNascimento: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("BASE_DE_LEADS")
      .update({
        data_nascimento: newDataNascimento || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error updating lead data_nascimento:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error updating lead data_nascimento:", error)
    return false
  }
}

