"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardCharts } from "@/components/dashboard-charts"

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
    }
  }, [router])

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-[#F6F2FF] to-[#EEF4FF]">
      <SidebarNav />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <header className="bg-white/90 border-b border-[#E9E2FF] backdrop-blur">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-[#7C3AED]">Dashboard Inteligente</h1>
                <p className="text-[#6B7280] mt-2 text-lg">Analise completa dos seus leads e performance em tempo real</p>
              </div>

              <div className="hidden md:flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#60A5FA] shadow-md shadow-[#C4B5FD]">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">EC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-12">
              <DashboardStats />
            </div>

            <DashboardCharts />
          </div>
        </main>

        <footer className="bg-white/80 border-t border-[#E9E2FF] py-4">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between text-sm text-[#6B7280]">
              <p>© 2025 Altuza Digital - Plataforma de Leads</p>
              <p>Ultima atualizacao: {new Date().toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
