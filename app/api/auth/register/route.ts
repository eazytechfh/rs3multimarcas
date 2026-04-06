import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/admin"

const AUTH_TABLE = "AUTORIZACAO"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome_empresa, nome_usuario, email, telefone, senha, confirmar_senha } = body

    if (!nome_empresa || !nome_usuario || !email || !senha) {
      return NextResponse.json({ error: "Todos os campos obrigatorios devem ser preenchidos." }, { status: 400 })
    }

    if (senha !== confirmar_senha) {
      return NextResponse.json({ error: "As senhas nao coincidem." }, { status: 400 })
    }

    if (senha.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: existingUser, error: existingUserError } = await supabase
      .from(AUTH_TABLE)
      .select("id")
      .ilike("email", email)
      .maybeSingle()

    if (existingUserError) {
      console.error("[register] Error checking existing user:", existingUserError)
      return NextResponse.json({ error: "Erro ao validar e-mail informado." }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: "Este e-mail ja esta cadastrado no sistema." }, { status: 400 })
    }

    const { data: newUser, error: createUserError } = await supabase
      .from(AUTH_TABLE)
      .insert({
        nome_empresa,
        nome_usuario,
        email,
        telefone: telefone || null,
        senha,
        plano: "gratuito",
        status: "ativo",
        cargo: "gestor",
        id_empresa: 1,
      })
      .select("id, nome_usuario, email, nome_empresa")
      .single()

    if (createUserError || !newUser) {
      console.error("[register] Error creating user:", createUserError)
      return NextResponse.json({ error: "Erro ao criar usuario." }, { status: 500 })
    }

    const { error: updateCompanyError } = await supabase.from(AUTH_TABLE).update({ id_empresa: newUser.id }).eq("id", newUser.id)

    if (updateCompanyError) {
      console.error("[register] Error updating company id:", updateCompanyError)
      return NextResponse.json({ error: "Usuario criado, mas houve erro ao finalizar o cadastro." }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Conta criada com sucesso. Voce pode fazer login agora.",
        user: {
          id: newUser.id,
          nome_usuario: newUser.nome_usuario,
          email: newUser.email,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[register] Unexpected error:", error)
    return NextResponse.json({ error: "Erro ao processar solicitacao. Tente novamente." }, { status: 500 })
  }
}
