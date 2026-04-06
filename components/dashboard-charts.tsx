"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart } from "recharts"
import { getDashboardData, type DashboardFilters } from "@/lib/dashboard-stats"
import { getCurrentUser } from "@/lib/auth"
import { TrendingUp, Users, Car, Target, Filter, RotateCcw, BarChart3, Activity } from "lucide-react"

const COLORS = ["#8B5CF6", "#60A5FA", "#A78BFA", "#C084FC", "#F59E0B", "#FB7185", "#7C3AED", "#38BDF8"]

const ESTAGIO_COLORS = {
  oportunidade: "#8B5CF6",
  em_qualificacao: "#60A5FA",
  qualificado: "#A78BFA",
  follow_up: "#C084FC",
  nutricao: "#F59E0B",
  fechado: "#7C3AED",
  nao_fechou: "#FB7185",
}

const chartCard = "shadow-xl bg-white border border-[#D8CCFF]"
const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.98)",
  border: "1px solid #D8CCFF",
  borderRadius: "12px",
  boxShadow: "0 20px 25px -5px rgba(139, 92, 246, 0.15)",
  color: "#1F2937",
}

export function DashboardCharts() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DashboardFilters>({ periodo: "30d" })

  useEffect(() => {
    loadDashboardData()
  }, [filters])

  const loadDashboardData = async () => {
    setLoading(true)
    const user = getCurrentUser()
    if (user) {
      const data = await getDashboardData(user.id_empresa, filters)
      setDashboardData(data)
    }
    setLoading(false)
  }

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }))
  }

  const resetFilters = () => {
    setFilters({ periodo: "30d" })
  }

  if (loading || !dashboardData) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse border border-[#E9E2FF] bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#EEE7FF] rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[#EEE7FF] rounded w-3/4" />
                    <div className="h-6 bg-[#EEE7FF] rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse border border-[#E9E2FF] bg-white shadow-lg">
              <CardHeader>
                <div className="h-6 bg-[#EEE7FF] rounded w-48" />
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-[#F8F5FF] rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Card className={chartCard}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-r from-[#8B5CF6] to-[#60A5FA] rounded-xl">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <span className="text-[#7C3AED]">Filtros Inteligentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#4B5563] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#8B5CF6]" />
                Periodo
              </label>
              <Select value={filters.periodo || "30d"} onValueChange={(value) => handleFilterChange("periodo", value)}>
                <SelectTrigger className="border border-[#D8CCFF] bg-white text-[#1F2937]">
                  <SelectValue placeholder="Selecione o periodo" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#D8CCFF]">
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                  <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                  <SelectItem value="90d">Ultimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#4B5563] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#60A5FA]" />
                Vendedor
              </label>
              <Select value={filters.vendedor || "all"} onValueChange={(value) => handleFilterChange("vendedor", value)}>
                <SelectTrigger className="border border-[#D8CCFF] bg-white text-[#1F2937]">
                  <SelectValue placeholder="Todos os vendedores" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#D8CCFF]">
                  <SelectItem value="all">Todos os vendedores</SelectItem>
                  {dashboardData.availableVendedores.map((vendedor: string) => (
                    <SelectItem key={vendedor} value={vendedor}>
                      {vendedor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#4B5563] flex items-center gap-2">
                <Target className="h-4 w-4 text-[#8B5CF6]" />
                Origem
              </label>
              <Select value={filters.origem || "all"} onValueChange={(value) => handleFilterChange("origem", value)}>
                <SelectTrigger className="border border-[#D8CCFF] bg-white text-[#1F2937]">
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#D8CCFF]">
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {dashboardData.availableOrigens.map((origem: string) => (
                    <SelectItem key={origem} value={origem}>
                      {origem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full border border-[#D8CCFF] bg-white text-[#7C3AED] hover:bg-[#F3E8FF]">
                <RotateCcw className="h-4 w-4 mr-2" />
                <span className="font-semibold">Limpar</span>
              </Button>
            </div>
          </div>

          {(filters.vendedor || filters.origem) && (
            <div className="flex flex-wrap gap-3 mt-6 p-4 bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl">
              <span className="text-sm font-semibold text-[#4B5563]">Filtros ativos:</span>
              {filters.vendedor && (
                <Badge className="bg-gradient-to-r from-[#60A5FA] to-[#8B5CF6] text-white px-3 py-1 flex items-center gap-2">
                  {filters.vendedor}
                  <button onClick={() => handleFilterChange("vendedor", "all")} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                    x
                  </button>
                </Badge>
              )}
              {filters.origem && (
                <Badge className="bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] text-white px-3 py-1 flex items-center gap-2">
                  {filters.origem}
                  <button onClick={() => handleFilterChange("origem", "all")} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                    x
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-12">
        <Card className={`lg:col-span-4 ${chartCard}`}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] rounded-xl shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-[#7C3AED] font-bold">Resumo por Estagio</span>
                <p className="text-xs text-[#6B7280] font-normal mt-1">Distribuicao dos leads</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboardData.estagioResumo} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <defs>
                  <linearGradient id="estagioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#C084FC" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9E2FF" />
                <XAxis dataKey="estagio" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, "Quantidade de Leads"]} />
                <Bar dataKey="quantidade" fill="url(#estagioGradient)" radius={[8, 8, 0, 0]} stroke="#8B5CF6" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {dashboardData.estagioResumo
                .sort((a: any, b: any) => b.quantidade - a.quantidade)
                .slice(0, 5)
                .map((item: any, index: number) => (
                  <div key={item.estagio} className="flex items-center justify-between p-2 bg-[#FAF8FF] rounded-lg border border-[#E9E2FF]">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-[#8B5CF6]" : index === 1 ? "bg-[#60A5FA]" : index === 2 ? "bg-[#C084FC]" : "bg-[#D1D5DB]"}`} />
                      <span className="text-sm font-medium text-[#1F2937]">{item.estagio}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#7C3AED]">{item.quantidade}</div>
                      <div className="text-xs text-[#6B7280]">{item.percentual}%</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`lg:col-span-8 ${chartCard}`}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-r from-[#60A5FA] to-[#8B5CF6] rounded-xl shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-[#7C3AED] font-bold">Performance por Vendedor</span>
                <p className="text-xs text-[#6B7280] font-normal mt-1">Analise de resultados da equipe</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dashboardData.vendedorStats} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="fechadosGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="conversaoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C084FC" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9E2FF" />
                <XAxis dataKey="vendedor" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ paddingTop: "20px", color: "#6B7280" }} iconType="circle" />
                <Bar dataKey="total_leads" fill="url(#totalGradient)" name="Total de Leads" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leads_fechados" fill="url(#fechadosGradient)" name="Leads Fechados" radius={[4, 4, 0, 0]} />
                <Bar dataKey="taxa_conversao" fill="url(#conversaoGradient)" name="Taxa de Conversao (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardData.vendedorStats.slice(0, 3).map((vendedor: any, index: number) => (
                <div key={vendedor.vendedor} className="p-4 rounded-xl border border-[#E9E2FF] bg-[#FAF8FF]">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{
                        background: index === 0 ? "linear-gradient(to right, #8B5CF6, #C084FC)" : index === 1 ? "linear-gradient(to right, #60A5FA, #8B5CF6)" : "linear-gradient(to right, #F59E0B, #FB7185)",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1F2937] text-sm">{vendedor.vendedor}</p>
                      <p className="text-xs text-[#6B7280]">
                        {vendedor.total_leads} leads • {vendedor.taxa_conversao.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`lg:col-span-5 ${chartCard}`}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] rounded-xl shadow-lg">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-[#7C3AED] font-bold">Top Veiculos</span>
                <p className="text-xs text-[#6B7280] font-normal mt-1">Modelos mais procurados</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  {COLORS.map((color, index) => (
                    <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={dashboardData.veiculoStats.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={40}
                  dataKey="total_interesse"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {dashboardData.veiculoStats.slice(0, 8).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={`url(#pieGradient${index % COLORS.length})`} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, "Interesse"]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {dashboardData.veiculoStats.slice(0, 5).map((veiculo: any, index: number) => (
                <div key={veiculo.veiculo} className="flex items-center justify-between p-3 bg-[#FAF8FF] rounded-lg border border-[#E9E2FF]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: COLORS[index % COLORS.length] }}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-[#1F2937] truncate">{veiculo.veiculo}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#7C3AED]">{veiculo.total_interesse}</div>
                    <div className="text-xs text-[#6B7280]">{veiculo.taxa_conversao.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`lg:col-span-7 ${chartCard}`}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-r from-[#F59E0B] to-[#FB7185] rounded-xl shadow-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-[#7C3AED] font-bold">Performance por Origem</span>
                <p className="text-xs text-[#6B7280] font-normal mt-1">Analise de canais de aquisicao</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboardData.origemStats} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9E2FF" />
                <XAxis dataKey="origem" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ color: "#6B7280" }} />
                <Bar dataKey="total_leads" fill="#60A5FA" name="Total de Leads" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leads_fechados" fill="#8B5CF6" name="Leads Fechados" radius={[4, 4, 0, 0]} />
                <Bar dataKey="taxa_conversao" fill="#FB7185" name="Taxa de Conversao (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {dashboardData.origemStats.slice(0, 4).map((origem: any) => (
                <div key={origem.origem} className="p-3 bg-[#FAF8FF] rounded-lg border border-[#E9E2FF]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1F2937]">{origem.origem}</span>
                    <Badge className="bg-gradient-to-r from-[#F59E0B] to-[#FB7185] text-white text-xs">{origem.taxa_conversao.toFixed(1)}%</Badge>
                  </div>
                  <div className="mt-1 text-xs text-[#6B7280]">
                    {origem.total_leads} leads • {origem.leads_fechados} fechados
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`lg:col-span-12 ${chartCard}`}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-3 bg-gradient-to-r from-[#8B5CF6] to-[#60A5FA] rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-[#7C3AED] font-bold">Evolucao dos Leads por Estagio</span>
                <p className="text-sm text-[#6B7280] font-normal mt-1">Tendencias temporais dos ultimos 30 dias</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={dashboardData.estagioEvolution} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  {Object.entries(ESTAGIO_COLORS).map(([key, color]) => (
                    <linearGradient key={key} id={`area${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9E2FF" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ color: "#6B7280" }} />
                <Area type="monotone" dataKey="oportunidade" stackId="1" stroke={ESTAGIO_COLORS.oportunidade} fill="url(#areaoportunidade)" name="Oportunidade" strokeWidth={2} />
                <Area type="monotone" dataKey="em_qualificacao" stackId="1" stroke={ESTAGIO_COLORS.em_qualificacao} fill="url(#areaem_qualificacao)" name="Em Qualificacao" strokeWidth={2} />
                <Area type="monotone" dataKey="qualificado" stackId="1" stroke={ESTAGIO_COLORS.qualificado} fill="url(#areaqualificado)" name="Qualificado" strokeWidth={2} />
                <Area type="monotone" dataKey="fechado" stackId="1" stroke={ESTAGIO_COLORS.fechado} fill="url(#areafechado)" name="Fechado" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
