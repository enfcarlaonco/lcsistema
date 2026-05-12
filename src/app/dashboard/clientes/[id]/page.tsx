'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ChevronRight, BarChart2, ClipboardList, FileText,
  DollarSign, AlertTriangle, FileDown, Plus, Pencil,
  CheckCircle, Upload, ExternalLink, ChevronDown,
  ChevronUp, RefreshCw, Activity, TrendingDown,
  TrendingUp, Users
} from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Cliente {
  id: string
  nome: string
  cnpj: string
  cnes?: string
  tipo_servico: string
  cidade?: string
  estado?: string
  telefone?: string
  email_contato?: string
  perfil_diagnostico: string
  contratos: Array<{
    id: string
    data_inicio: string
    data_fim: string
    total_horas: number
    horas_presenciais: number
    horas_online: number
    valor_total: string
    status: string
    responsavel_cliente?: string
  }>
  questionarios: Array<{
    id: string
    status: string
    pct_completo: number
    created_at: string
  }>
  dados_financeiros: Array<{
    id: string
    mes_referencia: string
    faturamento_bruto: string
    sessoes_realizadas: number
    sessoes_faturadas: number
    indicadores?: {
      taxa_ocupacao: number
      taxa_glosa: number
      margem_percentual: number
      custo_por_sessao: string
      faturamento_liquido: string
      faturamento_potencial: string
      perda_faturamento: string
      alerta_principal?: string
    }
    score?: { score_final: number; classificacao: string }
    perdas: Array<{ tipo_perda: string; descricao: string; valor_estimado: string; prioridade: string }>
    oportunidades: Array<{ tipo_ganho: string; descricao: string; ganho_estimado: string; prioridade: string }>
  }>
  nao_conformidades: Array<{
    id: string
    nivel: string
    dominio: string
    descricao: string
    prazo_limite: string
    status: string
    prazo_dias: number
  }>
  acoes_corretivas: Array<{
    id: string
    titulo: string
    prioridade: string
    status: string
    prazo: string
    origem: string
    descricao: string
  }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt$(val: number | string) {
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}
function fmtPct(val: number) { return `${val.toFixed(1)}%` }
function fmtData(iso: string) { return new Date(iso).toLocaleDateString('pt-BR') }

const ncCor: Record<string, { bg: string; cor: string }> = {
  NC_III: { bg: '#fef2f2', cor: '#b91c1c' },
  NC_II:  { bg: '#fef3c7', cor: '#92400e' },
  NC_I:   { bg: '#eff6ff', cor: '#1d4ed8' },
}

const RESPONSAVEIS = ['Gestão', 'Enfermagem', 'Médico', 'Qualidade', 'Administrativo', 'Multiprofissional']

// Gravidade baseada no nível da NC
function gravidadeNC(nivel: string): number {
  if (nivel === 'NC_III') return 5
  if (nivel === 'NC_II')  return 3
  return 1
}

// Urgência baseada no prazo em dias
function urgenciaNC(prazo_dias: number): number {
  if (prazo_dias <= 15)  return 5
  if (prazo_dias <= 30)  return 4
  if (prazo_dias <= 60)  return 3
  if (prazo_dias <= 90)  return 2
  return 1
}

const ABAS = [
  { id: 'visao-geral',    label: 'Visão Geral',    icone: BarChart2 },
  { id: 'questionario',   label: 'Questionário',   icone: ClipboardList },
  { id: 'documentos',     label: 'Documentos',     icone: FileText },
  { id: 'financeiro',     label: 'Financeiro',     icone: DollarSign },
  { id: 'acoes',          label: 'Ações',          icone: AlertTriangle },
  { id: 'diagnostico',    label: 'Diagnóstico',    icone: Activity },
  { id: 'relatorio',      label: 'Relatório',      icone: FileDown },
]

// ─── Aba: Visão Geral ─────────────────────────────────────────────────────────

function AbaVisaoGeral({ cliente, isLC }: { cliente: Cliente; isLC: boolean }) {
  const contrato = cliente.contratos[0]
  const ultimoDado = cliente.dados_financeiros[0]
  const score = ultimoDado?.score

  const perdaTotal = ultimoDado?.perdas?.reduce((s, p) => s + Number(p.valor_estimado), 0) ?? 0
  const ganhoTotal = ultimoDado?.oportunidades?.reduce((s, o) => s + Number(o.ganho_estimado), 0) ?? 0

  const corScore = (s: number) => s >= 75 ? '#15803d' : s >= 50 ? '#92400e' : '#b91c1c'
  const bgScore  = (s: number) => s >= 75 ? '#f0fdf4' : s >= 50 ? '#fef3c7' : '#fef2f2'

  return (
    <div className="space-y-4">
      {/* Score + KPIs */}
      {ultimoDado && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card flex flex-col items-center justify-center py-4">
            {score ? (
              <>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: `6px solid ${corScore(score.score_final)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bgScore(score.score_final) }}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: corScore(score.score_final) }}>{score.score_final}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">Score financeiro</p>
                <p style={{ fontSize: 11, color: corScore(score.score_final), fontWeight: 500 }}>{score.classificacao?.replace(/_/g, ' ')}</p>
              </>
            ) : <p className="text-sm text-gray-400">Sem score</p>}
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Margem operacional</p>
            <p className="text-2xl font-semibold text-gray-900">{fmtPct(Number(ultimoDado.indicadores?.margem_percentual ?? 0))}</p>
            <p className="text-xs text-gray-400 mt-1">Meta: ≥ 15%</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Perda identificada</p>
            <p className="text-2xl font-semibold text-red-600">{fmt$(perdaTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">/mês estimado</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Oportunidade de recuperação</p>
            <p className="text-2xl font-semibold text-green-600">{fmt$(ganhoTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">/mês potencial</p>
          </div>
        </div>
      )}

      {/* Contrato ativo */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Contrato ativo</h2>
        {contrato ? (
          <div className="grid grid-cols-3 gap-4">
            {[
              ['Início', fmtData(contrato.data_inicio)],
              ['Término', fmtData(contrato.data_fim)],
              ['Valor total', fmt$(contrato.valor_total)],
              ['Total de horas', `${contrato.total_horas}h`],
              ['Horas presenciais', `${contrato.horas_presenciais}h`],
              ['Horas online', `${contrato.horas_online}h`],
              ['Responsável cliente', contrato.responsavel_cliente ?? '—'],
              ['Status', contrato.status],
            ].map(([label, valor]) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900">{valor}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">Nenhum contrato ativo.</p>}
      </div>

      {/* NCs abertas */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">Não conformidades abertas</h2>
          <span className="text-xs text-gray-400">{cliente.nao_conformidades.length} em aberto</span>
        </div>
        {cliente.nao_conformidades.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle size={20} className="mx-auto text-green-500 mb-2" />
            <p className="text-sm text-gray-400">Nenhuma NC em aberto</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cliente.nao_conformidades.slice(0, 5).map(nc => (
              <div key={nc.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: ncCor[nc.nivel]?.bg, color: ncCor[nc.nivel]?.cor, fontWeight: 500, flexShrink: 0 }}>
                  {nc.nivel.replace('_', ' ')}
                </span>
                <p className="text-xs text-gray-700 flex-1">{nc.descricao}</p>
                <p className="text-xs text-gray-400 flex-shrink-0">{fmtData(nc.prazo_limite)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Aba: Questionário ────────────────────────────────────────────────────────

function AbaQuestionario({ cliente, isLC }: { cliente: Cliente; isLC: boolean }) {
  const questionario = cliente.questionarios[0]
  const contrato = cliente.contratos[0]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-700">Questionário M2 — Diagnóstico (B0 a B12)</h2>
        {isLC && contrato && !questionario && (
          <Link href={`/dashboard/clientes/${cliente.id}/questionario/novo`} className="btn-primary flex items-center gap-2 text-xs">
            <Plus size={13} /> Iniciar diagnóstico
          </Link>
        )}
      </div>
      {questionario ? (
        <div>
          <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-700">Progresso geral</p>
                <p className="text-sm font-semibold text-brand-600">{questionario.pct_completo}%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${questionario.pct_completo}%` }} />
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${questionario.status === 'VALIDADO' ? 'bg-green-50 text-green-700' : questionario.status === 'EM_ANDAMENTO' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {questionario.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/questionarios/${questionario.id}`} className="btn-secondary flex items-center gap-2 text-xs">
              <ClipboardList size={13} /> Ver questionário
            </Link>
            {isLC && (
              <Link href={`/dashboard/clientes/${cliente.id}/resultados`} className="btn-secondary flex items-center gap-2 text-xs">
                <BarChart2 size={13} /> Ver resultados
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <ClipboardList size={28} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400 mb-2">Nenhum questionário iniciado.</p>
          {!isLC && <p className="text-xs text-gray-400">Aguarde a consultora LC iniciar o diagnóstico.</p>}
        </div>
      )}
    </div>
  )
}

// ─── Aba: Documentos ─────────────────────────────────────────────────────────

function AbaDocumentos({ cliente }: { cliente: Cliente }) {
  const { data: session } = useSession()
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user?.perfil ?? '')
  const contrato = cliente.contratos[0]

  const [docs, setDocs] = useState<any[]>([])
  const [refs, setRefs] = useState<any[]>([])
  const [refsExpandidas, setRefsExpandidas] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODOS')
  const [docUpload, setDocUpload] = useState<any>(null)

  const grauCfg: Record<string, { label: string; bg: string; cor: string }> = {
    LEGISLACAO:        { label: 'Legislação',    bg: '#fee2e2', cor: '#b91c1c' },
    ACREDITACAO:       { label: 'ONA',           bg: '#f3e8ff', cor: '#7e22ce' },
    MELHORES_PRATICAS: { label: 'Boas práticas', bg: '#dbeafe', cor: '#1d4ed8' },
  }

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch(`/api/documentos?clienteId=${cliente.id}`)
      const data = await res.json()
      setDocs(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }

  async function carregarRefs() {
    if (refsExpandidas && refs.length > 0) { setRefsExpandidas(false); return }
    const res = await fetch(`/api/documentos/referencia?clienteId=${cliente.id}`)
    const data = await res.json()
    setRefs(data.documentos ?? [])
    setRefsExpandidas(true)
  }

  useEffect(() => { carregar() }, [cliente.id])

  const docsFiltrados = filtro === 'TODOS' ? docs : docs.filter(d => d.documento_referencia?.grau_necessidade === filtro)
  const refsFiltradas = filtro === 'TODOS' ? refs : refs.filter(r => r.grau_necessidade === filtro)

  if (!contrato) return <div className="card text-center py-8"><p className="text-sm text-gray-400">Nenhum contrato ativo.</p></div>

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['TODOS', 'LEGISLACAO', 'ACREDITACAO', 'MELHORES_PRATICAS'].map(g => (
          <button key={g} onClick={() => setFiltro(g)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: `1px solid ${filtro === g ? '#1e40af' : '#e5e7eb'}`, background: filtro === g ? '#eff6ff' : 'transparent', color: filtro === g ? '#1e40af' : '#6b7280', fontWeight: filtro === g ? 500 : 400 }}>
            {g === 'TODOS' ? 'Todos' : g === 'LEGISLACAO' ? 'Legislação' : g === 'ACREDITACAO' ? 'ONA' : 'Boas práticas'}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        {loading ? <p className="text-sm text-gray-400 text-center py-4">Carregando...</p>
        : docsFiltrados.length === 0 ? (
          <div className="card text-center py-6">
            <FileText size={24} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Nenhum documento enviado ainda.</p>
          </div>
        ) : docsFiltrados.map(doc => {
          const grau = grauCfg[doc.documento_referencia?.grau_necessidade]
          const av = doc.avaliacoes?.[0]
          return (
            <div key={doc.id} className="card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText size={15} className="text-brand-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.documento_referencia?.titulo || doc.documento_referencia?.nome_documento}</p>
                  <p className="text-xs text-gray-400">{doc.nome_arquivo} · {fmtData(doc.data_envio)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {grau && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: grau.bg, color: grau.cor }}>{grau.label}</span>}
                {av && <span style={{ fontSize: 12, fontWeight: 500, color: av.score_final >= 85 ? '#15803d' : av.score_final >= 60 ? '#92400e' : '#b91c1c' }}>{av.score_final.toFixed(0)}%</span>}
                {doc.arquivo_url && <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-brand-500"><ExternalLink size={13} /></a>}
                {isLC && doc.status_documento !== 'APROVADO' && (
                  <button style={{ padding: '4px 10px', borderRadius: 6, background: '#1e40af', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}>Avaliar</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <button onClick={carregarRefs} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          <span>Lista mestre de documentos de referência</span>
          {refsExpandidas ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {refsExpandidas && (
          <div style={{ padding: '12px 16px', maxHeight: 360, overflow: 'auto' }}>
            {refsFiltradas.map(ref => {
              const grau = grauCfg[ref.grau_necessidade]
              const jaEnviado = docs.some(d => d.documento_referencia?.codigo === ref.codigo)
              return (
                <div key={ref.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500 }}>{ref.titulo || ref.nome_documento}{ref.obrigatorio && <span style={{ color: '#b91c1c', marginLeft: 4 }}>*</span>}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af' }}>{ref.tipo_documento?.nome} · {ref.area}{ref.legislacao_ref && ` · ${ref.legislacao_ref.replace(/_/g, ' ')}`}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {grau && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: grau.bg, color: grau.cor }}>{grau.label}</span>}
                    {jaEnviado ? <CheckCircle size={13} style={{ color: '#15803d' }} /> : (
                      <button onClick={() => setDocUpload(ref)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, background: '#1e40af', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}>
                        <Upload size={10} /> Enviar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {docUpload && (
        <ModalUpload docRef={docUpload} clienteId={cliente.id} contratoId={contrato.id}
          onClose={() => setDocUpload(null)} onSalvo={() => { setDocUpload(null); carregar() }} />
      )}
    </div>
  )
}

// ─── Modal Upload ─────────────────────────────────────────────────────────────

function ModalUpload({ docRef, clienteId, contratoId, onClose, onSalvo }: any) {
  const ref = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [versao, setVersao] = useState('')
  const [etapa, setEtapa] = useState<'selecao' | 'enviando' | 'resultado'>('selecao')
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')

  async function enviar() {
    if (!arquivo) return
    setEtapa('enviando')
    try {
      const fd = new FormData()
      fd.append('arquivo', arquivo)
      fd.append('clienteId', clienteId)
      fd.append('contratoId', contratoId)
      fd.append('documentoReferenciaId', docRef.id)
      if (versao) fd.append('versao', versao)
      const res = await fetch('/api/documentos/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao enviar.'); setEtapa('selecao'); return }
      setResultado(data); setEtapa('resultado'); onSalvo()
    } catch { setErro('Erro de conexão.'); setEtapa('selecao') }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{docRef.tipo_documento?.nome} · {docRef.area}</p>
          <h2 style={{ fontSize: 15, fontWeight: 500 }}>{docRef.titulo || docRef.nome_documento}</h2>
        </div>
        {etapa === 'selecao' && (
          <>
            <div onClick={() => ref.current?.click()} style={{ border: `2px dashed ${arquivo ? '#1e40af' : '#e5e7eb'}`, borderRadius: 10, padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: arquivo ? '#eff6ff' : '#f9fafb', marginBottom: '1rem' }}>
              <input ref={ref} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={e => setArquivo(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
              <Upload size={24} style={{ margin: '0 auto 8px', color: arquivo ? '#1e40af' : '#9ca3af' }} />
              {arquivo ? <p style={{ fontSize: 13, fontWeight: 500, color: '#1e40af' }}>{arquivo.name}</p> : <p style={{ fontSize: 13, color: '#6b7280' }}>Clique para selecionar o arquivo</p>}
            </div>
            <input type="text" value={versao} onChange={e => setVersao(e.target.value)} placeholder="Versão (opcional)" style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, marginBottom: '1rem', boxSizing: 'border-box' as const }} />
            {erro && <p style={{ fontSize: 12, color: '#b91c1c', marginBottom: '1rem' }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'transparent', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button onClick={enviar} disabled={!arquivo} style={{ padding: '8px 18px', borderRadius: 8, background: '#1e40af', color: '#fff', border: 'none', cursor: arquivo ? 'pointer' : 'not-allowed', fontSize: 13, opacity: arquivo ? 1 : 0.5 }}>Enviar</button>
            </div>
          </>
        )}
        {etapa === 'enviando' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <RefreshCw size={28} style={{ margin: '0 auto 12px', color: '#1e40af', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, fontWeight: 500 }}>Enviando para o Google Drive...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
          </div>
        )}
        {etapa === 'resultado' && resultado && (
          <div>
            <div style={{ padding: '1rem', borderRadius: 8, background: '#f0fdf4', marginBottom: '1rem' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#15803d' }}>✓ Documento enviado com sucesso</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{resultado.mensagem}</p>
            </div>
            {resultado.arquivo_url && <a href={resultado.arquivo_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1e40af', marginBottom: '1rem', textDecoration: 'none' }}><ExternalLink size={12} /> Ver no Google Drive</a>}
            <button onClick={onClose} style={{ width: '100%', padding: 9, borderRadius: 8, background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 13 }}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Aba: Financeiro ──────────────────────────────────────────────────────────

function AbaFinanceiro({ cliente, isLC }: { cliente: Cliente; isLC: boolean }) {
  return (
    <div className="space-y-4">
      {isLC && (
        <div className="flex justify-end">
          <Link href={`/dashboard/clientes/${cliente.id}/financeiro`} className="btn-primary flex items-center gap-2 text-xs">
            <Plus size={13} /> Incluir dados financeiros
          </Link>
        </div>
      )}
      {cliente.dados_financeiros.length === 0 ? (
        <div className="card text-center py-8">
          <DollarSign size={24} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">Nenhum dado financeiro registrado ainda.</p>
        </div>
      ) : (
        cliente.dados_financeiros.map(d => {
          const perdaTotal = d.perdas?.reduce((s, p) => s + Number(p.valor_estimado), 0) ?? 0
          const ganhoTotal = d.oportunidades?.reduce((s, o) => s + Number(o.ganho_estimado), 0) ?? 0
          return (
            <div key={d.id} className="card space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                {new Date(d.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
              {d.indicadores && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['Faturamento bruto', fmt$(d.faturamento_bruto)],
                      ['Faturamento líquido', fmt$(d.indicadores.faturamento_liquido)],
                      ['Faturamento potencial', fmt$(d.indicadores.faturamento_potencial)],
                      ['Margem operacional', fmtPct(d.indicadores.margem_percentual)],
                      ['Taxa de glosa', fmtPct(d.indicadores.taxa_glosa)],
                      ['Taxa de ocupação', fmtPct(d.indicadores.taxa_ocupacao)],
                      ['Custo por sessão', fmt$(d.indicadores.custo_por_sessao)],
                      ['Sessões realizadas', String(d.sessoes_realizadas)],
                      ['Sessões faturadas', String(d.sessoes_faturadas)],
                    ].map(([label, valor]) => (
                      <div key={label}>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm font-medium text-gray-900">{valor}</p>
                      </div>
                    ))}
                  </div>

                  {/* Perdas e oportunidades */}
                  <div className="grid grid-cols-2 gap-4">
                    <div style={{ background: '#fef2f2', borderRadius: 8, padding: '12px' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={14} style={{ color: '#b91c1c' }} />
                        <p className="text-xs font-medium text-red-700">Perdas identificadas — {fmt$(perdaTotal)}/mês</p>
                      </div>
                      {d.perdas?.slice(0, 3).map((p, i) => (
                        <p key={i} className="text-xs text-gray-600 mb-1">• {p.descricao} — {fmt$(p.valor_estimado)}</p>
                      ))}
                    </div>
                    <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} style={{ color: '#15803d' }} />
                        <p className="text-xs font-medium text-green-700">Oportunidades — {fmt$(ganhoTotal)}/mês</p>
                      </div>
                      {d.oportunidades?.slice(0, 3).map((o, i) => (
                        <p key={i} className="text-xs text-gray-600 mb-1">• {o.descricao} — {fmt$(o.ganho_estimado)}</p>
                      ))}
                    </div>
                  </div>

                  {/* Alerta principal */}
                  {d.indicadores.alerta_principal && (
                    <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400e' }}>
                      ⚠ {d.indicadores.alerta_principal}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Aba: Ações (com Matriz GUT) ──────────────────────────────────────────────

function AbaAcoes({ cliente, isLC }: { cliente: Cliente; isLC: boolean }) {
  const [responsaveis, setResponsaveis] = useState<Record<string, string>>({})

  function setResp(ncId: string, valor: string) {
    setResponsaveis(prev => ({ ...prev, [ncId]: valor }))
  }

  // Monta a Matriz GUT a partir das NCs
  const matrizGUT = cliente.nao_conformidades.map(nc => {
    const G = gravidadeNC(nc.nivel)
    const U = urgenciaNC(nc.prazo_dias)
    const T = 3 // tendência padrão 3 (estável) — será calculada com histórico futuro
    const gut = G * U * T
    return { ...nc, G, U, T, gut, responsavel: responsaveis[nc.id] ?? '' }
  }).sort((a, b) => b.gut - a.gut)

  const corGUT = (gut: number) => gut >= 60 ? '#b91c1c' : gut >= 27 ? '#92400e' : '#1d4ed8'
  const bgGUT  = (gut: number) => gut >= 60 ? '#fef2f2' : gut >= 27 ? '#fef3c7' : '#eff6ff'

  return (
    <div className="space-y-4">
      {/* Matriz GUT */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-700 mb-1">Matriz GUT — Priorização das Não Conformidades</h2>
        <p className="text-xs text-gray-400 mb-4">G = Gravidade · U = Urgência · T = Tendência · GUT = G×U×T</p>

        {matrizGUT.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
            <p className="text-sm text-gray-400">Nenhuma NC em aberto</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Não Conformidade</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 50 }}>G</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 50 }}>U</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 50 }}>T</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 60 }}>GUT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 120 }}>Prazo limite</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 160 }}>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {matrizGUT.map((nc, i) => (
                  <tr key={nc.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: ncCor[nc.nivel]?.bg, color: ncCor[nc.nivel]?.cor, fontWeight: 500, flexShrink: 0, marginTop: 1 }}>
                          {nc.nivel.replace('_', ' ')}
                        </span>
                        <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.4 }}>{nc.descricao.slice(0, 100)}{nc.descricao.length > 100 ? '...' : ''}</p>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#374151' }}>{nc.G}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#374151' }}>{nc.U}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#374151' }}>{nc.T}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: bgGUT(nc.gut), color: corGUT(nc.gut) }}>
                        {nc.gut}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', fontSize: 11, color: new Date(nc.prazo_limite) < new Date() ? '#b91c1c' : '#374151', fontWeight: new Date(nc.prazo_limite) < new Date() ? 600 : 400 }}>
                      {fmtData(nc.prazo_limite)}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                      <select
                        value={responsaveis[nc.id] ?? ''}
                        onChange={e => setResp(nc.id, e.target.value)}
                        style={{ fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', width: '100%' }}
                      >
                        <option value="">Selecionar</option>
                        {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ações corretivas */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Ações corretivas em andamento</h2>
        {cliente.acoes_corretivas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma ação registrada.</p>
        ) : (
          <div className="space-y-2">
            {cliente.acoes_corretivas.map(acao => {
              const vencida = new Date(acao.prazo) < new Date() && acao.status !== 'CONCLUIDA'
              const corP = acao.prioridade === 'CRITICA' ? '#b91c1c' : acao.prioridade === 'ALTA' ? '#d97706' : '#3b82f6'
              return (
                <div key={acao.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 8, border: '1px solid #f3f4f6', borderLeft: `3px solid ${corP}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acao.titulo}</p>
                    <p style={{ fontSize: 11, color: '#9ca3af' }}>{acao.origem.replace(/_/g, ' ')}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: bgGUT(acao.prioridade === 'CRITICA' ? 75 : 30), color: corP }}>{acao.prioridade}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: acao.status === 'CONCLUIDA' ? '#f0fdf4' : acao.status === 'EM_ANDAMENTO' ? '#eff6ff' : '#f3f4f6', color: acao.status === 'CONCLUIDA' ? '#15803d' : acao.status === 'EM_ANDAMENTO' ? '#1d4ed8' : '#6b7280' }}>
                      {acao.status.replace(/_/g, ' ')}
                    </span>
                    <p style={{ fontSize: 11, color: vencida ? '#b91c1c' : '#9ca3af', fontWeight: vencida ? 600 : 400 }}>{vencida ? '⚠ ' : ''}{fmtData(acao.prazo)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Aba: Diagnóstico ─────────────────────────────────────────────────────────
function AbaDiagnostico({ cliente }: { cliente: Cliente }) {
  const [gerando, setGerando] = useState(false)
  const contrato = cliente.contratos[0]

  async function gerarDiagnostico() {
    setGerando(true)
    try {
      const url = `/api/relatorio/${cliente.id}${contrato ? `?contratoId=${contrato.id}` : ''}`
      const res = await fetch(url)
      if (!res.ok) { alert('Erro ao gerar diagnóstico.'); return }
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `diagnostico_${cliente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
      link.click()
    } finally { setGerando(false) }
  }

  return (
    <div className="card">
      <h2 className="text-sm font-medium text-gray-700 mb-2">Diagnóstico</h2>
      <p className="text-xs text-gray-400 mb-4">
        Documento consolidado com todos os pontos críticos, intervenções necessárias e oportunidades de melhoria identificadas durante a consultoria.
      </p>
      <button onClick={gerarDiagnostico} disabled={gerando} className="btn-primary flex items-center gap-2">
        {gerando ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
        {gerando ? 'Gerando...' : 'Gerar Diagnóstico'}
      </button>
    </div>
  )
}

// ─── Aba: Relatório de Andamento ──────────────────────────────────────────────

function AbaRelatorio({ cliente }: { cliente: Cliente }) {
  const [gerando, setGerando] = useState(false)
  const contrato = cliente.contratos[0]

  async function gerarPDF() {
    setGerando(true)
    try {
      const url = `/api/relatorio/${cliente.id}${contrato ? `?contratoId=${contrato.id}` : ''}`
      const res = await fetch(url)
      if (!res.ok) { alert('Erro ao gerar relatório.'); return }
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `relatorio_${cliente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
      link.click()
    } finally { setGerando(false) }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Relatório de Andamento da Consultoria</h2>
        <p className="text-xs text-gray-400 mb-4">
          Relatório com análise das não conformidades, prazos críticos, histórico de evolução e prospectiva de resultado favorável ou desfavorável.
        </p>
        <button onClick={gerarPDF} disabled={gerando} className="btn-primary flex items-center gap-2">
          {gerando ? <RefreshCw size={14} className="animate-spin" /> : <FileDown size={14} />}
          {gerando ? 'Gerando...' : 'Gerar e baixar PDF'}
        </button>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ClienteDetalhePage() {
  const params = useParams()
  const { data: session } = useSession()
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user?.perfil ?? '')

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('visao-geral')

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch(`/api/clientes/${params.id}`)
        const data = await res.json()
        setCliente(data)
      } finally { setLoading(false) }
    }
    if (params.id) carregar()
  }, [params.id])

  if (loading) return <div className="text-center py-12 text-sm text-gray-400">Carregando...</div>
  if (!cliente) return <div className="text-center py-12 text-sm text-gray-400">Cliente não encontrado.</div>

  const contrato = cliente.contratos[0]

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/clientes" className="text-xs text-gray-400 hover:text-gray-600">Clientes</Link>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="text-xs text-gray-600">{cliente.nome}</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{cliente.nome}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cliente.tipo_servico.replace(/_/g, ' ')} · CNES {cliente.cnes ?? '—'} · {cliente.cidade}/{cliente.estado}
            {contrato && ` · Contrato até ${fmtData(contrato.data_fim)}`}
          </p>
        </div>
        {isLC && (
          <Link href={`/dashboard/clientes/${cliente.id}/editar`} className="btn-secondary flex items-center gap-2 text-xs">
            <Pencil size={13} /> Editar
          </Link>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {ABAS.map(aba => {
          const Icone = aba.icone
          return (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${abaAtiva === aba.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icone size={14} />
              {aba.label}
            </button>
          )
        })}
      </div>

      {abaAtiva === 'visao-geral'  && <AbaVisaoGeral    cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'questionario' && <AbaQuestionario  cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'documentos'   && <AbaDocumentos    cliente={cliente} />}
      {abaAtiva === 'financeiro'   && <AbaFinanceiro    cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'acoes'        && <AbaAcoes         cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'diagnostico'  && <AbaDiagnostico   cliente={cliente} />}
      {abaAtiva === 'relatorio'    && <AbaRelatorio     cliente={cliente} />}
    </div>
  )
}

