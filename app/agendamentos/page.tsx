"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { AgendamentosKanban } from "@/components/agendamentos-kanban"
import { AgendamentosListView } from "@/components/agendamentos-list-view"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function Agendamentos() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
    }
  }, [router])

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-[#F6F2FF] to-[#EEF4FF]">
      <SidebarNav />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <style>{`
          body, main, div, section, .container, .flex-1 {
            background-color: #fff !important;
          }

          .bg-black,
          .bg-slate-900,
          .bg-slate-950,
          [class*="bg-black"],
          [class*="bg-slate"] {
            background-color: #fff !important;
            border-color: #ddd6fe !important;
          }

          h1, h2, h3, h4, h5, h6, p, span, label, strong,
          .text-gray-600, .text-gray-900 {
            color: #1f2937 !important;
          }

          input, select, textarea {
            background-color: #fff !important;
            color: #1f2937 !important;
            border: 1px solid #c4b5fd !important;
          }

          .btn-green-active {
            background-color: #8b5cf6 !important;
            color: #fff !important;
            border: 1px solid #8b5cf6 !important;
          }

          .btn-green-outline {
            background-color: transparent !important;
            color: #8b5cf6 !important;
            border: 1px solid #c4b5fd !important;
          }

          .btn-green-outline:hover {
            background-color: #f3e8ff !important;
            color: #7c3aed !important;
          }
        `}</style>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-[#7C3AED]">Agendamentos</h1>
              <p className="text-[#6B7280]">Gerencie os agendamentos de visitas com clientes</p>
            </div>

            <Card className="mb-6 bg-white border border-[#DDD6FE]">
              <div className="p-4">
                <div className="flex gap-2">
                  <Button variant={viewMode === "kanban" ? "default" : "outline"} size="sm" onClick={() => setViewMode("kanban")} className={`flex items-center gap-2 ${viewMode === "kanban" ? "btn-green-active" : "btn-green-outline"}`}>
                    <LayoutGrid className="h-4 w-4" />
                    Kanban
                  </Button>

                  <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className={`flex items-center gap-2 ${viewMode === "list" ? "btn-green-active" : "btn-green-outline"}`}>
                    <List className="h-4 w-4" />
                    Lista
                  </Button>
                </div>
              </div>
            </Card>

            {viewMode === "kanban" ? <AgendamentosKanban /> : <AgendamentosListView />}
          </div>
        </main>
      </div>
    </div>
  )
}
