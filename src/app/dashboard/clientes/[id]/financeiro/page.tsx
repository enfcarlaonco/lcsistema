'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatPercent, getScoreBg } from '@/lib/utils'

interface Props { params: { id: string } }

const camposFinanceiros = [
  { section: 'Produção', fields: [
    { key: 'pacientes',          label: 'Total de pacientes ativos',      type: 'number', helper: 'Pacientes em tratamento no mês' },
    { key: 'sessoes_realizadas', label: 'Sessões realizadas',             type: 'number', helper: 'Total de sessões executadas no mês' },
    { key: 'sessoes_faturadas',  label: 'Sessões faturadas',              type: 'number', helper: 'Sessões efetivamente enviadas para cobrança' },
    { key: 'sessoes_perdidas',   label: 'Sessões perdidas (coagulação)',   type: 'number', helper: 'Sessões interrompidas por coagulação do sistema' },
  ]},
  { section: 'Faturamento', fields: [
    { key: 'faturamento_bruto',  label: 'Faturamento bruto (R$)',  type: 'currency', helper: 'Total faturado antes de glosas' },
    { key: 'total_glosas',       label: 'Total de glosas (R$)',    type: 'currency', helper: 'Valor total glosado no mês' },
  ]},
  { section: 'Custos', fields: [
    { key: 'custo_insumos',      label: 'Custo de insumos (R$)',          type: 'currency', helper: 'Capilares, soluções, materiais de consumo' },
    { key: 'custo_mao_obra',     label: 'Custo de mão de obra (R$)',      type: 'currency', helper: 'Folha de pagamento + encargos + terceirizados' },
    { key: 'custo_manutencao',   label: 'Custo de manutenção (R$)',       type: 'currency', helper: 'Manutenção preventiva e corretiva de máquinas' },
    { key: 'custo_agua',         label: 'Custo de tratamento de água (R$)', type: 'currency', helper: 'STDAH e insumos de tratamento de água' },
    { key: 'outros_custos',      label: 'Outros custos fixos (R$)',       type: 'currency', helper: 'Alimentação, limpeza, administração, etc.' },
  ]},
  { section: 'Estrutura operacional', fields: [
    { key: 'maquinas',           label: 'Máquinas disponíveis',   type: 'number', helper: 'Total de máquinas de hemodiálise em funcionamento' },
    { key: 'turnos_dia',         label: 'Turnos por dia',          type: 'number', helper: 'Número de turnos realizados por dia (máx. 4)' },
    { key: 'dias_funcionamento', label: 'Dias de funcionamento',   type: 'number', helper: 'Dias em que o serviço funcionou no mês' },
  ]},
]

export default function InputFinanceiroPage({ params }: Props) {
  const router = useRouter()
  const [mesReferencia, setMesReferencia] = useState('')
  const [contrato_id, setContratoId] = useState('')
  const [form, setForm] = useState<Record<string, string>>({
    pacientes: '', sessoes_realizadas: '', sessoes_faturadas: '', sessoes_perdidas: '0',
    faturamento_bruto: '', total_glosas: '0', custo_insumos: '', custo_mao_obra: '',
    custo_manutencao: '0', custo_agua: '0', outros_custos: '0',
    maquinas: '', turnos_dia: '', dias_funcionamento: '',
  })
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function handleChange(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

function parseBrazilianCurrency(value: string): number {
  if (!value) return 0;

  const normalized = value
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    setResultado(null)

    try {
      const payload = {
        cliente_id: params.id,
        contrato_id: contrato_id || 'contrato-dilson-2026',
        mes_referencia: mesReferencia + '-01',
        fonte_pagadora: 'SUS',
        Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, parseBrazilianCurrency(v)])
        )
          }

      const res = await fetch('/api/dados-financeiros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao salvar dados'); return }

      setResultado(data)
    } catch (err) {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Input financeiro mensal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Preencha os dados do mês para calcular indicadores automaticamente</p>
      </div>

      {!resultado ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Mês de referência</h3>
            <input
              type="month"
              value={mesReferencia}
              onChange={e => setMesReferencia(e.target.value)}
              className="input w-48"
              required
            />
          </div>

          {camposFinanceiros.map(section => (
            <div key={section.section} className="card">
              <h3 className="text-sm font-medium text-gray-700 mb-4 pb-3 border-b border-gray-100">
                {section.section}
              </h3>
              <div className="space-y-4">
                {section.fields.map(field => (
                  <div key={field.key}>
                    <label className="label">{field.label}</label>
                    <div className="relative">
                      {field.type === 'currency' && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                      )}
                      <input
                        type="text"
                        inputMode="decimal"
                        laceholder="Ex: 2.569.256,00"
                        min="0"
                        step={field.type === 'currency' ? '0.01' : '1'}
                        value={form[field.key]}
                        onChange={e => handleChange(field.key, e.target.value)}
                        className={`input ${field.type === 'currency' ? 'pl-9' : ''}`}
                        placeholder="0"
                        required={field.key !== 'sessoes_perdidas' && !['custo_manutencao','custo_agua','outros_custos','total_glosas'].includes(field.key)}
                      />
                    </div>
                    {field.helper && (
                      <p className="text-xs text-gray-400 mt-1">{field.helper}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {erro && (
            <div className="bg-danger-50 text-danger-600 rounded-lg px-4 py-3 text-sm">{erro}</div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Calculando...' : 'Calcular e salvar'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        /* Resultado do motor financeiro */
        <div className="space-y-4">
          <div className="card border-2 border-brand-400">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Resultado da análise financeira</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(resultado.score.score_final)}`}>
                Score {resultado.score.score_final} — {resultado.score.classificacao.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Faturamento líquido', valor: formatCurrency(resultado.indicadores.faturamento_liquido) },
                { label: 'Margem operacional', valor: formatPercent(resultado.indicadores.margem_percentual) },
                { label: 'Custo por sessão', valor: formatCurrency(resultado.indicadores.custo_por_sessao) },
                { label: 'Taxa de ocupação', valor: formatPercent(resultado.indicadores.taxa_ocupacao) },
                { label: 'Taxa de glosa', valor: formatPercent(resultado.indicadores.taxa_glosa) },
                { label: 'Custo insumos/sessão', valor: formatCurrency(resultado.indicadores.custo_insumos_por_sessao) },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.valor}</p>
                </div>
              ))}
            </div>

            {resultado.alertas?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alertas</p>
                {resultado.alertas.map((alerta: any, i: number) => (
                  <div key={i} className={`rounded-lg px-3 py-2 text-xs ${alerta.tipo === 'CRITICO' ? 'bg-danger-50 text-danger-600' : 'bg-warning-50 text-warning-600'}`}>
                    {alerta.mensagem}
                  </div>
                ))}
              </div>
            )}
          </div>

          {resultado.perdas?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Perdas identificadas</h3>
              <div className="space-y-2">
                {resultado.perdas.map((perda: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <p className="text-sm text-gray-700">{perda.descricao}</p>
                    <span className="text-sm font-semibold text-danger-600 ml-4 flex-shrink-0">
                      -{formatCurrency(perda.valor_estimado)}/mês
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultado.oportunidades?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Oportunidades de recuperação</h3>
              <div className="space-y-2">
                {resultado.oportunidades.map((op: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <p className="text-sm text-gray-700">{op.descricao}</p>
                    <span className="text-sm font-semibold text-success-600 ml-4 flex-shrink-0">
                      +{formatCurrency(op.ganho_estimado)}/mês
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => router.push(`/dashboard/clientes/${params.id}`)} className="btn-primary">
              Ver painel do cliente
            </button>
            <button onClick={() => setResultado(null)} className="btn-secondary">
              Novo input
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
