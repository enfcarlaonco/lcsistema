'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatPercent, getScoreBg } from '@/lib/utils'
import { Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface Props { params: { id: string } }

interface DadoFinanceiro {
  id: string
  mes_referencia: string
  pacientes: number
  sessoes_realizadas: number
  sessoes_faturadas: number
  faturamento_bruto: number
  total_glosas: number
  indicadores: {
    faturamento_liquido: number
    margem_percentual: number
    margem_operacional: number
    custo_total: number
    custo_por_sessao: number
    taxa_ocupacao: number
    taxa_glosa: number
    custo_insumos_por_sessao: number
    folha_sobre_receita: number
    receita_por_sessao: number
    perda_faturamento: number
    alerta_principal: string | null
  } | null
  score: {
    score_final: number
    classificacao: string
  } | null
  perdas: Array<{
    id: string
    tipo_perda: string
    descricao: string
    valor_estimado: number
    prioridade: string
  }>
  oportunidades: Array<{
    id: string
    tipo_ganho: string
    descricao: string
    ganho_estimado: number
    prioridade: string
  }>
}

function formatMes(data: string) {
  return new Date(data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function getPrioridadeCor(p: string) {
  const map: Record<string, string> = {
    CRITICA: 'bg-red-50 text-red-600',
    ALTA: 'bg-orange-50 text-orange-600',
    MODERADA: 'bg-blue-50 text-blue-600',
    BAIXA: 'bg-gray-50 text-gray-500',
  }
  return map[p] ?? 'bg-gray-50 text-gray-500'
}

export default function ResultadosFinanceirosPage({ params }: Props) {
  const router = useRouter()
  const [dados, setDados] = useState<DadoFinanceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [deletando, setDeletando] = useState<string | null>(null)
  const [clienteNome, setClienteNome] = useState('')

  useEffect(() => {
    async function carregar() {
      const [resCliente, resDados] = await Promise.all([
        fetch(`/api/clientes/${params.id}`),
        fetch(`/api/dados-financeiros?clienteId=${params.id}`),
      ])
      const cliente = await resCliente.json()
      const dadosData = await resDados.json()
      setClienteNome(cliente.nome ?? '')
      setDados(Array.isArray(dadosData) ? dadosData : [])
      setLoading(false)
    }
    carregar()
  }, [params.id])

  async function handleDelete(id: string, mes: string) {
    if (!confirm(`Excluir os dados financeiros de ${formatMes(mes)}?\n\nEsta ação não pode ser desfeita.`)) return
    setDeletando(id)
    try {
      const res = await fetch(`/api/dados-financeiros/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDados(prev => prev.filter(d => d.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
      }
    } finally {
      setDeletando(null)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>

  const totalPerdas = dados.reduce((s, d) => s + d.perdas.reduce((sp, p) => sp + Number(p.valor_estimado), 0), 0)
  const totalOportunidades = dados.reduce((s, d) => s + d.oportunidades.reduce((so, o) => so + Number(o.ganho_estimado), 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
            <button onClick={() => router.push('/dashboard/clientes')} className="hover:text-gray-600">Clientes</button>
            <span>/</span>
            <button onClick={() => router.push(`/dashboard/clientes/${params.id}`)} className="hover:text-gray-600">{clienteNome}</button>
            <span>/</span>
            <span className="text-gray-600">Resultados financeiros</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Resultados financeiros históricos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{dados.length} mês{dados.length !== 1 ? 'es' : ''} registrado{dados.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/clientes/${params.id}/financeiro`)}
          className="btn-primary text-xs"
        >
          + Novo input
        </button>
      </div>

      {/* KPIs consolidados */}
      {dados.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Score médio (todos os meses)</p>
            <p className={`text-2xl font-semibold px-2 rounded-lg inline-block ${getScoreBg(
              Math.round(dados.reduce((s, d) => s + (d.score?.score_final ?? 0), 0) / dados.length)
            )}`}>
              {Math.round(dados.reduce((s, d) => s + (d.score?.score_final ?? 0), 0) / dados.length)}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Total de perdas identificadas</p>
            <p className="text-2xl font-semibold text-red-600">{formatCurrency(totalPerdas)}</p>
            <p className="text-xs text-gray-400 mt-1">acumulado no período</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Total de oportunidades</p>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalOportunidades)}</p>
            <p className="text-xs text-gray-400 mt-1">potencial no período</p>
          </div>
        </div>
      )}

      {/* Lista de meses */}
      <div className="space-y-3">
        {dados.map((d) => {
          const aberto = expandido === d.id
          const perdaMes = d.perdas.reduce((s, p) => s + Number(p.valor_estimado), 0)
          const ganhoMes = d.oportunidades.reduce((s, o) => s + Number(o.ganho_estimado), 0)

          return (
            <div key={d.id} className="card">
              {/* Cabeçalho do mês */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setExpandido(aberto ? null : d.id)}
                  className="flex items-center gap-4 flex-1 text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{formatMes(d.mes_referencia)}</p>
                    <p className="text-xs text-gray-400">
                      {d.pacientes} pacientes · {d.sessoes_realizadas} sessões realizadas · {d.sessoes_faturadas} faturadas
                    </p>
                  </div>

                  <div className="flex items-center gap-6 ml-auto mr-4">
                    {d.score && (
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Score</p>
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${getScoreBg(d.score.score_final)}`}>
                          {d.score.score_final}
                        </span>
                      </div>
                    )}
                    {d.indicadores && (
                      <>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Margem</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatPercent(Number(d.indicadores.margem_percentual))}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Glosa</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatPercent(Number(d.indicadores.taxa_glosa))}
                          </p>
                        </div>
                      </>
                    )}
                    {perdaMes > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Perda</p>
                        <p className="text-sm font-semibold text-red-600">-{formatCurrency(perdaMes)}</p>
                      </div>
                    )}
                    {aberto ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                <button
                  onClick={() => handleDelete(d.id, d.mes_referencia)}
                  disabled={deletando === d.id}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-2"
                  title="Excluir este mês"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Detalhes expandidos */}
              {aberto && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">

                  {/* Alerta principal */}
                  {d.indicadores?.alerta_principal && (
                    <div className="flex items-start gap-2 bg-orange-50 rounded-lg px-3 py-2">
                      <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-700">{d.indicadores.alerta_principal}</p>
                    </div>
                  )}

                  {/* Grid de indicadores */}
                  {d.indicadores && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Indicadores calculados</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Faturamento bruto', valor: formatCurrency(Number(d.faturamento_bruto)) },
                          { label: 'Total de glosas', valor: formatCurrency(Number(d.total_glosas)) },
                          { label: 'Faturamento líquido', valor: formatCurrency(Number(d.indicadores.faturamento_liquido)) },
                          { label: 'Custo total', valor: formatCurrency(Number(d.indicadores.custo_total)) },
                          { label: 'Margem operacional', valor: formatCurrency(Number(d.indicadores.margem_operacional)) },
                          { label: 'Margem %', valor: formatPercent(Number(d.indicadores.margem_percentual)) },
                          { label: 'Custo por sessão', valor: formatCurrency(Number(d.indicadores.custo_por_sessao)) },
                          { label: 'Receita por sessão', valor: formatCurrency(Number(d.indicadores.receita_por_sessao)) },
                          { label: 'Taxa de ocupação', valor: formatPercent(Number(d.indicadores.taxa_ocupacao)) },
                          { label: 'Taxa de glosa', valor: formatPercent(Number(d.indicadores.taxa_glosa)) },
                          { label: 'Custo insumos/sessão', valor: formatCurrency(Number(d.indicadores.custo_insumos_por_sessao)) },
                          { label: 'Folha / receita', valor: formatPercent(Number(d.indicadores.folha_sobre_receita)) },
                        ].map(item => (
                          <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.valor}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Perdas */}
                  {d.perdas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                        <TrendingDown size={12} className="text-red-500" />
                        Perdas identificadas
                      </p>
                      <div className="space-y-2">
                        {d.perdas.map(perda => (
                          <div key={perda.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getPrioridadeCor(perda.prioridade)}`}>
                                {perda.prioridade}
                              </span>
                              <p className="text-sm text-gray-700 truncate">{perda.descricao}</p>
                            </div>
                            <span className="text-sm font-semibold text-red-600 ml-4 flex-shrink-0">
                              -{formatCurrency(Number(perda.valor_estimado))}/mês
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Oportunidades */}
                  {d.oportunidades.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                        <TrendingUp size={12} className="text-green-500" />
                        Oportunidades de recuperação
                      </p>
                      <div className="space-y-2">
                        {d.oportunidades.map(op => (
                          <div key={op.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getPrioridadeCor(op.prioridade)}`}>
                                {op.prioridade}
                              </span>
                              <p className="text-sm text-gray-700 truncate">{op.descricao}</p>
                            </div>
                            <span className="text-sm font-semibold text-green-600 ml-4 flex-shrink-0">
                              +{formatCurrency(Number(op.ganho_estimado))}/mês
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )
        })}

        {dados.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-sm">Nenhum dado financeiro registrado ainda.</p>
            <button
              onClick={() => router.push(`/dashboard/clientes/${params.id}/financeiro`)}
              className="btn-primary mt-4 text-xs"
            >
              Registrar primeiro mês
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
