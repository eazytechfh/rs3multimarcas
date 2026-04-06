import { createClient } from "@/utils/supabase/client"

const AUTH_TABLE = "AUTORIZACAO"

export interface User {
  id: number
  id_empresa: number
  nome_empresa: string
  nome_usuario: string
  email: string
  telefone?: string
  plano: string
  status: "ativo" | "pendente" | "inativo"
  cargo: "administrador" | "convidado" | "sdr" | "gestor" | "vendedor"
  created_at: string
  updated_at: string
}

export const STATUS_LABELS = {
  ativo: "Ativo",
  pendente: "Pendente",
  inativo: "Inativo",
}

export const STATUS_COLORS = {
  ativo: "bg-green-100 text-green-800",
  pendente: "bg-yellow-100 text-yellow-800",
  inativo: "bg-red-100 text-red-800",
}

export const CARGO_LABELS = {
  administrador: "Administrador",
  convidado: "Convidado",
  sdr: "SDR",
  gestor: "Gestor",
  vendedor: "Vendedor",
}

export const CARGO_COLORS = {
  administrador: "bg-green-100 text-green-800",
  convidado: "bg-blue-100 text-blue-800",
  sdr: "bg-purple-100 text-purple-800",
  gestor: "bg-orange-100 text-orange-800",
  vendedor: "bg-cyan-100 text-cyan-800",
}

export async function signIn(email: string, senha: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from(AUTH_TABLE).select("*").ilike("email", email).eq("senha", senha)

  if (error) {
    console.error("Login query error:", error)
    return null
  }

  if (!data || data.length !== 1) {
    return null
  }

  const user = data[0] as User
  if (user.status.toLowerCase() !== "ativo") {
    return null
  }

  localStorage.setItem("altuza_digital_user", JSON.stringify(user))
  return user
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userData = localStorage.getItem("altuza_digital_user")
  return userData ? JSON.parse(userData) : null
}

export function signOut() {
  localStorage.removeItem("altuza_digital_user")
}

export function isAdmin(user: User | null): boolean {
  return user?.cargo === "administrador"
}

export function canManageMembers(user: User | null): boolean {
  return isAdmin(user)
}

export async function updateUser(userId: number, userData: Partial<User>): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from(AUTH_TABLE)
    .update({
      nome_usuario: userData.nome_usuario,
      email: userData.email,
      telefone: userData.telefone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("Error updating user:", error)
    return false
  }

  const currentUser = getCurrentUser()
  if (currentUser) {
    const updatedUser = { ...currentUser, ...userData }
    localStorage.setItem("altuza_digital_user", JSON.stringify(updatedUser))
  }

  return true
}

export async function getCompanyMembers(idEmpresa: number): Promise<User[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(AUTH_TABLE)
    .select("*")
    .eq("id_empresa", idEmpresa)
    .order("cargo", { ascending: false })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching company members:", error)
    return []
  }

  return data || []
}

export async function addCompanyMember(memberData: {
  id_empresa: number
  nome_empresa: string
  nome_usuario: string
  email: string
  senha: string
  telefone?: string
  status?: "ativo" | "pendente" | "inativo"
  cargo?: "administrador" | "convidado" | "sdr" | "gestor" | "vendedor"
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const email = memberData.email.trim().toLowerCase()
  const nomeUsuario = memberData.nome_usuario.trim()
  const senha = memberData.senha.trim()
  const telefone = memberData.telefone?.trim() || null
  const cargo = memberData.cargo || "convidado"

  if (!nomeUsuario || !email || !senha) {
    return { success: false, error: "Preencha nome, e-mail e senha para adicionar o membro." }
  }

  if (senha.length < 6) {
    return { success: false, error: "A senha deve ter pelo menos 6 caracteres." }
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from(AUTH_TABLE)
    .select("email")
    .ilike("email", email)
    .maybeSingle()

  if (existingUserError) {
    console.error("Error checking existing member e-mail:", existingUserError)
    return { success: false, error: "Erro ao validar e-mail do membro. Tente novamente." }
  }

  if (existingUser) {
    return { success: false, error: "Este e-mail ja esta cadastrado no sistema." }
  }

  const { data: createdMember, error } = await supabase
    .from(AUTH_TABLE)
    .insert({
      id_empresa: memberData.id_empresa,
      nome_empresa: memberData.nome_empresa,
      nome_usuario: nomeUsuario,
      email,
      senha,
      telefone,
      plano: "gratuito",
      status: memberData.status || "ativo",
      cargo,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error adding company member:", error)
    if (error.code === "23505") {
      return { success: false, error: "Este e-mail ja esta cadastrado no sistema." }
    }

    const errorMessage = (error.message || "").toLowerCase()
    if (errorMessage.includes("cargo") && errorMessage.includes("check")) {
      return { success: false, error: "Cargo nao permitido pelo banco atual." }
    }

    if (errorMessage.includes("status") && errorMessage.includes("check")) {
      return { success: false, error: "Status invalido para o banco atual." }
    }

    return { success: false, error: `Erro ao adicionar membro: ${error.message}` }
  }

  if (cargo === "vendedor") {
    const { error: vendedorError } = await supabase.from("VENDEDORES").insert({
      NOME: nomeUsuario,
      TELEFONE: telefone,
      EMAIL: email,
      CARGO: cargo,
      ID_EMPRESA: memberData.id_empresa,
      ATIVO: true,
      atender: "espera",
      quantos_lead: 0,
    })

    if (vendedorError) {
      console.error("Error adding vendedor in VENDEDORES:", vendedorError)

      if (createdMember?.id) {
        const { error: rollbackError } = await supabase.from(AUTH_TABLE).delete().eq("id", createdMember.id)
        if (rollbackError) {
          console.error("Error rolling back member creation:", rollbackError)
        }
      }

      return { success: false, error: `Erro ao criar vendedor na tabela VENDEDORES: ${vendedorError.message}` }
    }
  }

  return { success: true }
}

export async function updateMemberStatus(
  memberId: number,
  status: "ativo" | "pendente" | "inativo",
  currentUser: User,
): Promise<{ success: boolean; error?: string }> {
  if (!canManageMembers(currentUser)) {
    return { success: false, error: "Voce nao tem permissao para alterar status de membros." }
  }

  const supabase = createClient()
  const { data: memberData, error: memberError } = await supabase
    .from(AUTH_TABLE)
    .select("status, cargo, email, nome_usuario")
    .eq("id", memberId)
    .eq("id_empresa", currentUser.id_empresa)
    .maybeSingle()

  if (memberError || !memberData) {
    return { success: false, error: "Membro nao encontrado para atualizacao de status." }
  }

  const { error } = await supabase
    .from(AUTH_TABLE)
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("id_empresa", currentUser.id_empresa)

  if (error) {
    console.error("Error updating member status:", error)
    return { success: false, error: "Erro ao atualizar status do membro." }
  }

  if (status === "inativo" && memberData.cargo === "vendedor") {
    let vendedorQuery = supabase.from("VENDEDORES").update({
      ATIVO: false,
      atender: null,
      UPDATED_AT: new Date().toISOString(),
    })

    if (memberData.email) {
      vendedorQuery = vendedorQuery.eq("EMAIL", memberData.email)
    } else {
      vendedorQuery = vendedorQuery.eq("NOME", memberData.nome_usuario)
    }

    const { error: vendedorUpdateError } = await vendedorQuery.eq("ID_EMPRESA", currentUser.id_empresa)

    if (vendedorUpdateError) {
      const { error: rollbackError } = await supabase
        .from(AUTH_TABLE)
        .update({
          status: memberData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", memberId)
        .eq("id_empresa", currentUser.id_empresa)

      if (rollbackError) {
        console.error("Error rolling back member status after vendedor sync failure:", rollbackError)
      }

      return { success: false, error: "Erro ao sincronizar vendedor na tabela VENDEDORES." }
    }
  }

  return { success: true }
}

export async function updateMemberCargo(
  memberId: number,
  cargo: "administrador" | "convidado" | "sdr" | "gestor" | "vendedor",
  currentUser: User,
): Promise<{ success: boolean; error?: string }> {
  if (!canManageMembers(currentUser)) {
    return { success: false, error: "Voce nao tem permissao para alterar cargos." }
  }

  const supabase = createClient()
  const { error } = await supabase
    .from(AUTH_TABLE)
    .update({
      cargo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("id_empresa", currentUser.id_empresa)

  if (error) {
    console.error("Error updating member cargo:", error)
    return { success: false, error: "Erro ao atualizar cargo do membro." }
  }

  return { success: true }
}

export async function deleteMember(memberId: number, currentUser: User): Promise<{ success: boolean; error?: string }> {
  if (!canManageMembers(currentUser)) {
    return { success: false, error: "Voce nao tem permissao para excluir membros." }
  }

  if (memberId === currentUser.id) {
    return { success: false, error: "Voce nao pode excluir sua propria conta." }
  }

  const supabase = createClient()
  const { error } = await supabase.from(AUTH_TABLE).delete().eq("id", memberId).eq("id_empresa", currentUser.id_empresa)

  if (error) {
    console.error("Error deleting member:", error)
    return { success: false, error: "Erro ao excluir membro." }
  }

  return { success: true }
}
