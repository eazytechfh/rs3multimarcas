"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getLeadStats, ESTAGIO_LABELS } from "@/lib/leads"
import { getCurrentUser } from "@/lib/auth"
import { Users, TrendingUp, Award, Zap, Activity, DollarSign } from "lucide-react"

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function DashboardStats() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalLeadsGeral: 0,
    leadsPorEstagio: {} as Record<string, number>,
    leadsPorOrigem: {} as Record<string, number>,
    conversao: "0",
    valorTotal: 0,
    valorMedio: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const user = getCurrentUser()
      if (user) {
        const data = await getLeadStats(user.id_empresa)
        setStats(data)
      }
      setLoading(false)
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse border border-[#E9E2FF] bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-[#EEE7FF] rounded-2xl" />
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-[#EEE7FF] rounded w-3/4" />
                  <div className="h-8 bg-[#EEE7FF] rounded w-1/2" />
                  <div className="h-3 bg-[#EEE7FF] rounded w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: "Total de Leads",
      value: stats.totalLeadsGeral || stats.totalLeads,
      subtitle: "Leads cadastrados",
      icon: Users,
      gradient: "from-[#8B5CF6] to-[#A78BFA]",
      borderColor: "border-[#D8CCFF]",
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Taxa de Conversao",
      value: `${stats.conversao}%`,
      subtitle: "Leads fechados",
      icon: TrendingUp,
      gradient: "from-[#60A5FA] to-[#8B5CF6]",
      borderColor: "border-[#D8CCFF]",
      change: "+2.3%",
      changeType: "positive" as const,
    },
    {
      title: "Valor Total",
      value: formatCurrency(stats.valorTotal || 0),
      subtitle: "Pipeline de vendas",
      icon: DollarSign,
      gradient: "from-[#8B5CF6] to-[#C084FC]",
      borderColor: "border-[#D8CCFF]",
      change: "+15%",
      changeType: "positive" as const,
    },
    {
      title: "Fechados",
      value: stats.leadsPorEstagio.fechado || 0,
      subtitle: "Vendas realizadas",
      icon: Award,
      gradient: "from-[#F59E0B] to-[#FB7185]",
      borderColor: "border-[#F3D6DF]",
      change: "+5",
      changeType: "positive" as const,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className={`shadow-xl bg-white ${card.borderColor} border hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 bg-gradient-to-r ${card.gradient} rounded-xl shadow-lg`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#4B5563]">{card.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={card.changeType === "positive" ? "text-xs bg-[#F3E8FF] text-[#7C3AED]" : "bg-red-100 text-red-700"}>
                          {card.change}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-[#111827]">{card.value}</div>
                    <p className="text-sm text-[#6B7280]">{card.subtitle}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-[#D8CCFF] shadow-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] rounded-xl shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-[#7C3AED] font-bold">Distribuicao por Estagio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.leadsPorEstagio)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([estagio, count], index) => (
                  <div key={estagio} className="flex items-center justify-between p-3 bg-[#FAF8FF] rounded-lg border border-[#E9E2FF]">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? "bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]"
                            : index === 1
                              ? "bg-gradient-to-r from-[#60A5FA] to-[#8B5CF6]"
                              : index === 2
                                ? "bg-gradient-to-r from-[#C084FC] to-[#8B5CF6]"
                                : index === 3
                                  ? "bg-gradient-to-r from-[#F59E0B] to-[#FB7185]"
                                  : "bg-gradient-to-r from-gray-300 to-gray-400"
                        }`}
                      />
                      <span className="text-sm font-medium text-[#1F2937]">{ESTAGIO_LABELS[estagio as keyof typeof ESTAGIO_LABELS]}</span>
                    </div>
                    <Badge className="bg-[#EEE7FF] text-[#5B21B6] font-semibold">{count as number}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#D8CCFF] shadow-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-r from-[#60A5FA] to-[#8B5CF6] rounded-xl shadow-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-[#7C3AED] font-bold">Canais de Origem</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.leadsPorOrigem)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([origem, count], index) => (
                  <div key={origem} className="flex items-center justify-between p-3 bg-[#FAF8FF] rounded-lg border border-[#E9E2FF]">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? "bg-gradient-to-r from-[#60A5FA] to-[#8B5CF6]"
                            : index === 1
                              ? "bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]"
                              : index === 2
                                ? "bg-gradient-to-r from-[#C084FC] to-[#8B5CF6]"
                                : index === 3
                                  ? "bg-gradient-to-r from-[#F59E0B] to-[#FB7185]"
                                  : "bg-gradient-to-r from-gray-300 to-gray-400"
                        }`}
                      />
                      <span className="text-sm font-medium text-[#1F2937]">{origem}</span>
                    </div>
                    <Badge className="bg-[#EEE7FF] text-[#5B21B6] font-semibold">{count as number}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
