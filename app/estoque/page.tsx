"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SidebarNav } from "@/components/sidebar-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdicionarVeiculoForm } from "@/components/adicionar-veiculo-form"
import { ListaVeiculos } from "@/components/lista-veiculos"

export default function Estoque() {
  const router = useRouter()

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

          h1, h2, h3, h4, h5, h6, p, span, label, strong, .text-gray-600, .text-gray-900 {
            color: #1f2937 !important;
          }

          input, select, textarea {
            background-color: #fff !important;
            color: #1f2937 !important;
            border: 1px solid #c4b5fd !important;
          }
        `}</style>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-[#7C3AED]">Estoque</h1>
              <p className="text-[#6B7280]">Gerencie o estoque de veículos da sua concessionária</p>
            </div>

            <Tabs defaultValue="adicionar" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-transparent">
                <TabsTrigger
                  value="adicionar"
                  className="
                    border
                    data-[state=active]:bg-[#8B5CF6]
                    data-[state=active]:text-white
                    data-[state=active]:border-[#8B5CF6]
                    data-[state=inactive]:bg-transparent
                    data-[state=inactive]:text-[#8B5CF6]
                    data-[state=inactive]:border-[#C4B5FD]
                    hover:bg-[#F3E8FF]
                    hover:text-[#7C3AED]
                  "
                >
                  Adicionar Veículo ao Estoque
                </TabsTrigger>

                <TabsTrigger
                  value="gerenciar"
                  className="
                    border
                    data-[state=active]:bg-[#8B5CF6]
                    data-[state=active]:text-white
                    data-[state=active]:border-[#8B5CF6]
                    data-[state=inactive]:bg-transparent
                    data-[state=inactive]:text-[#8B5CF6]
                    data-[state=inactive]:border-[#C4B5FD]
                    hover:bg-[#F3E8FF]
                    hover:text-[#7C3AED]
                  "
                >
                  Veículo vendido ou removido
                </TabsTrigger>
              </TabsList>

              <TabsContent value="adicionar" className="mt-6">
                <AdicionarVeiculoForm />
              </TabsContent>

              <TabsContent value="gerenciar" className="mt-6">
                <ListaVeiculos />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
