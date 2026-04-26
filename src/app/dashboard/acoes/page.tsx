'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatDate, formatCurrency, getPrioridadeColor } from '@/lib/utils'
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'

interface Acao {
  id: string
  titulo: string
  descricao: string
  prioridade: string
  status: string
  prazo: string
  impacto_estimado: string
  resultado_realizado: string
  origem: string
  cliente: { id: string; nome: string }
}

const STATUS_COLS = [
  { key: 'PENDENTE',     label: 'Pendente',      icon: Clock,         cor: 'text-gray-500' },
  { key: 'EM_ANDAMENTO', label: 'Em andamento',   icon: AlertTriangle, cor: 'text-warning-600' },
  { key: 'CONCLUIDA',    label: 'Concluída',      icon: CheckCircle,   cor: 'text-success-600' },
]

export default function AcoesPage() {
  const searchParams = useSearchParams()
  const clienteId = searchParams.get('clienteId')
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [filtroPrioridade, setFiltroPrioridade] = useState('')
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)

  useEffect(() => {
    fetchAcoes()
  }, [clienteId, filtroPrioridade])

  async function fetchAcoes() {
    setLoading(true)
    const params = new URLSearchParams()
    if (clienteId) params.set('clienteId', clienteId)
    if (filtroPrioridade) params.set('prioridade', filtroPrioridade)
    params.set('status', 'TODOS')

    const res = await fetch(`/api/acoes-corretivas?${params}`)
    const data = await res.json()
    setAcoes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function atualizarStatus(id: string, novoStatus: string) {
    setAtualizando(id)
    await fetch(`/api/acoes-corretivas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    })
    await fetchAcoes()
    setAtualizando(null)
  }

  const totalImpacto = acoes
    .filter(a => a.status === 'CONCLUIDA')
    .reduce((s, a) => s + Number(a.resultado_realizado || a.impacto_estimado || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Ações corretivas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {acoes.filter(a => a.status !== 'CONCLUIDA').length} em aberto ·{' '}
            <span className="text-success-600 font-medium">{formatCurrency(totalImpacto)} realizados</span>
          </p>
        </div>

        <div className="flex gap-2">
          {['', 'CRITICA', 'ALTA', 'MODERADA', 'BAIXA'].map(p => (
            <button
              key={p}
              onClick={() => setFiltroPrioridade(p)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtroPrioridade === p
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {p || 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando ações...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {STATUS_COLS.map(col => {
            const Icon = col.icon
            const acoesCol = acoes.filter(a => a.status === col.key)

            return (
              <div key={col.key} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={col.cor} />
                    <span className="text-sm font-medium text-gray-700">{col.label}</span>
                  </div>
                  <span className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-500">
                    {acoesCol.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {acoesCol.map(acao => (
                    <div key={acao.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getPrioridadeColor(acao.prioridade)}`}>
                          {acao.prioridade}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{acao.origem}</span>
                      </div>

                      <p className="text-xs font-medium text-gray-900 mb-1 leading-snug">{acao.titulo}</p>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{acao.descricao}</p>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Prazo: {formatDate(acao.prazo)}</p>
                          {Number(acao.impacto_estimado) > 0 && (
                            <p className="text-xs text-success-600 font-medium">
                              {formatCurrency(Number(acao.impacto_estimado))}/mês
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{acao.cliente.nome.split(' ').slice(0,2).join(' ')}</p>
                      </div>

                      {/* Botões de mudança de status */}
                      <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-50">
                        {col.key === 'PENDENTE' && (
                          <button
                            onClick={() => atualizarStatus(acao.id, 'EM_ANDAMENTO')}
                            disabled={atualizando === acao.id}
                            className="text-xs px-2 py-1 bg-warning-50 text-warning-600 rounded hover:bg-warning-100 transition-colors"
                          >
                            Iniciar
                          </button>
                        )}
                        {col.key === 'EM_ANDAMENTO' && (
                          <>
                            <button
                              onClick={() => atualizarStatus(acao.id, 'CONCLUIDA')}
                              disabled={atualizando === acao.id}
                              className="text-xs px-2 py-1 bg-success-50 text-success-600 rounded hover:bg-success-100 transition-colors"
                            >
                              Concluir
                            </button>
                            <button
                              onClick={() => atualizarStatus(acao.id, 'PENDENTE')}
                              disabled={atualizando === acao.id}
                              className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded hover:bg-gray-100 transition-colors"
                            >
                              Pausar
                            </button>
                          </>
                        )}
                        {col.key === 'CONCLUIDA' && (
                          <button
                            onClick={() => atualizarStatus(acao.id, 'EM_ANDAMENTO')}
                            disabled={atualizando === acao.id}
                            className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded hover:bg-gray-100 transition-colors"
                          >
                            Reabrir
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {acoesCol.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">
                      Nenhuma ação {col.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
