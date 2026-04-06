"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signIn } from "@/lib/auth"
import { Loader2, AlertCircle } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [registerNomeEmpresa, setRegisterNomeEmpresa] = useState("")
  const [registerNomeUsuario, setRegisterNomeUsuario] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerTelefone, setRegisterTelefone] = useState("")
  const [registerSenha, setRegisterSenha] = useState("")
  const [registerConfirmSenha, setRegisterConfirmSenha] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState("")
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const user = await signIn(email, senha)

      if (user) {
        if (user.cargo === "vendedor") {
          router.push("/negociacoes")
        } else {
          router.push("/dashboard")
        }
      } else {
        setError("Credenciais invalidas ou usuario nao esta ativo.")
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterLoading(true)
    setRegisterError("")
    setRegisterSuccess(false)

    const senhaLimpa = registerSenha.trim()
    const confirmSenhaLimpa = registerConfirmSenha.trim()

    if (senhaLimpa !== confirmSenhaLimpa) {
      setRegisterError("As senhas nao coincidem.")
      setRegisterLoading(false)
      return
    }

    if (senhaLimpa.length < 6) {
      setRegisterError("A senha deve ter pelo menos 6 caracteres.")
      setRegisterLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_empresa: registerNomeEmpresa,
          nome_usuario: registerNomeUsuario,
          email: registerEmail,
          telefone: registerTelefone,
          senha: senhaLimpa,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setRegisterSuccess(true)
        setRegisterNomeEmpresa("")
        setRegisterNomeUsuario("")
        setRegisterEmail("")
        setRegisterTelefone("")
        setRegisterSenha("")
        setRegisterConfirmSenha("")

        setTimeout(() => {
          setEmail(registerEmail)
        }, 2000)
      } else {
        setRegisterError(result.error || "Erro ao criar conta. Tente novamente.")
      }
    } catch {
      setRegisterError("Erro ao criar conta. Tente novamente.")
    } finally {
      setRegisterLoading(false)
    }
  }

  const inputClass = "border-[#C4B5FD] focus:border-[#8B5CF6] focus:ring-[#8B5CF6] bg-white text-[#1F2937] placeholder:text-gray-400"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#F7F3FF] to-[#EEF4FF] p-4">
      <Card className="w-full max-w-md shadow-2xl border border-[#D8CCFF] bg-white">
        <CardHeader className="text-center py-4 space-y-2">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-2xl font-bold text-[#7C3AED]">Eazy Click</h1>
          </div>

          <CardTitle className="text-xl text-[#7C3AED]">Plataforma de Gestao de Leads</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#F3F4F6]">
              <TabsTrigger value="login" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-gray-500">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-gray-500">
                Registro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <CardDescription className="text-gray-500 text-center mb-4">Faca login para acessar sua plataforma</CardDescription>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    E-mail
                  </Label>
                  <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-gray-700">
                    Senha
                  </Label>
                  <Input id="senha" type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} required className={inputClass} />
                </div>

                {error && (
                  <Alert className="border-red-300 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold py-2.5" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <CardDescription className="text-gray-500 text-center mb-4">Crie sua conta para comecar</CardDescription>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-empresa" className="text-gray-700">
                    Nome da Empresa
                  </Label>
                  <Input id="register-empresa" type="text" placeholder="Sua Empresa Ltda" value={registerNomeEmpresa} onChange={(e) => setRegisterNomeEmpresa(e.target.value)} required className={inputClass} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-nome" className="text-gray-700">
                    Seu Nome
                  </Label>
                  <Input id="register-nome" type="text" placeholder="Joao Silva" value={registerNomeUsuario} onChange={(e) => setRegisterNomeUsuario(e.target.value)} required className={inputClass} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-gray-700">
                    E-mail
                  </Label>
                  <Input id="register-email" type="email" placeholder="seu@email.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required className={inputClass} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-telefone" className="text-gray-700">
                    Telefone (opcional)
                  </Label>
                  <Input id="register-telefone" type="tel" placeholder="(11) 99999-9999" value={registerTelefone} onChange={(e) => setRegisterTelefone(e.target.value)} className={inputClass} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-senha" className="text-gray-700">
                    Senha
                  </Label>
                  <Input
                    id="register-senha"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    value={registerSenha}
                    onChange={(e) => {
                      setRegisterSenha(e.target.value)
                      if (registerError) setRegisterError("")
                    }}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-senha" className="text-gray-700">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="register-confirm-senha"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={registerConfirmSenha}
                    onChange={(e) => {
                      setRegisterConfirmSenha(e.target.value)
                      if (registerError) setRegisterError("")
                    }}
                    required
                    className={inputClass}
                  />
                </div>

                {registerError && (
                  <Alert className="border-red-300 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-700">{registerError}</AlertDescription>
                  </Alert>
                )}

                {registerSuccess && (
                  <Alert className="border-[#D8CCFF] bg-[#F3E8FF]">
                    <AlertDescription className="text-[#6D28D9]">Conta criada com sucesso! Use a aba Login para acessar.</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold py-2.5" disabled={registerLoading || registerSuccess}>
                  {registerLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
