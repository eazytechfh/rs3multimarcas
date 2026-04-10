"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser, signOut, CARGO_LABELS } from "@/lib/auth"
import { LayoutDashboard, Settings, LogOut, Menu, X, Shield, Car, Calendar, MessageCircle, Users, Zap } from "lucide-react"

const allNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, vendorAccess: false },
  { name: "Negociacoes", href: "/negociacoes", icon: Users, vendorAccess: true },
  { name: "Agendamentos", href: "/agendamentos", icon: Calendar, vendorAccess: true },
  { name: "Estoque", href: "/estoque", icon: Car, vendorAccess: false },
  { name: "Configuracoes", href: "/configuracoes", icon: Settings, vendorAccess: false },
]

export function SidebarNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const user = getCurrentUser()

  const navigation = user?.cargo === "vendedor" ? allNavigation.filter((item) => item.vendorAccess) : allNavigation

  const handleSignOut = () => {
    signOut()
    router.push("/")
  }

  return (
    <>
      <style>{`
        .sidebar-brand,
        .sidebar-brand span,
        .sidebar-brand svg,
        .sidebar-brand img {
          color: #ffffff !important;
          fill: #ffffff !important;
          stroke: #ffffff !important;
        }
      `}</style>

      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white text-[#6D28D9] border-[#D8CCFF] hover:bg-[#F5F3FF]"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <div
        className={`
          sidebar fixed inset-y-0 left-0 z-40 w-64
          bg-white text-[#312E81] shadow-2xl border-r border-[#E9E2FF]
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-[#7C3AED] to-[#60A5FA] border-b border-[#C4B5FD]">
            <div className="sidebar-brand flex items-center space-x-2">
              <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
              <span className="text-xl font-bold tracking-tight text-[#FFFFFF] [text-shadow:0_1px_2px_rgba(0,0,0,0.18)]">Eazy Click</span>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-[#E9E2FF] bg-[#F8F7FF]">
            <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Codigo do Cliente</div>
            <div className="text-lg font-mono font-bold text-[#8B5CF6]">598.322</div>
          </div>

          {user && (
            <div className="p-4 border-b border-[#E9E2FF]">
              <div className="text-sm font-medium text-[#1F2937]">{user.nome_usuario}</div>
              <div className="text-xs text-[#6B7280]">{user.nome_empresa}</div>
              <div className="mt-2">
                <Badge className="text-xs bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#E9D5FF]">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {CARGO_LABELS[user.cargo]}
                  </div>
                </Badge>
              </div>
            </div>
          )}

          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const IconComponent = item.href === "/negociacoes" ? Users : item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#F3E8FF] text-[#7C3AED] border border-[#C4B5FD] font-semibold"
                      : "text-[#4B5563] hover:bg-[#F5F3FF] hover:border hover:border-[#E9E2FF]"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <IconComponent className={`mr-3 h-5 w-5 shrink-0 ${isActive ? "text-[#7C3AED]" : "text-[#6B7280]"}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {user?.cargo !== "vendedor" && (
              <a
                href="https://conexao.eazy.tec.br/login"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-[#4B5563] hover:bg-[#F5F3FF] hover:border hover:border-[#E9E2FF]"
                onClick={() => setSidebarOpen(false)}
              >
                <MessageCircle className="mr-3 h-5 w-5 text-[#6B7280]" />
                Conexao Whatsapp
              </a>
            )}
          </nav>

          <div className="p-4 border-t border-[#E9E2FF]">
            <Button className="w-full justify-start bg-[#8B5CF6] text-white hover:bg-[#7C3AED] font-semibold" onClick={handleSignOut}>
              <LogOut className="mr-3 h-5 w-5 text-white" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-[#312E81]/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </>
  )
}
