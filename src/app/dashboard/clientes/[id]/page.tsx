'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ChevronRight, ClipboardList, FileText,
  DollarSign, AlertTriangle, FileDown, Plus, Pencil,
  CheckCircle, Upload, ExternalLink, ChevronDown,
  ChevronUp, RefreshCw, Activity, TrendingDown,
  TrendingUp, BarChart2, ListChecks, Trash2, Search
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

// ─── Tipos — Matriz GUT / Checklist ONA (persistidos via API) ─────────────────

interface MatrizGutItem {
  id: string
  problema: string
  area?: string | null
  gravidade: number
  urgencia: number
  tendencia: number
  gut_score: number
  responsavel?: string | null
  prazo_acao?: string | null
  status: string
  observacoes?: string | null
  origem: string
  nc_id?: string | null
}

interface ChecklistOnaItem {
  id: string
  ona_id: number
  documento_base: string
  secao?: string | null
  requisito?: string | null
  descricao: string
  categoria?: string | null
  item_verificacao?: string | null
  criterios?: string | null
  status: string
  responsavel?: string | null
  local_evidencia?: string | null
  data_verificacao?: string | null
  proxima_acao?: string | null
  observacoes?: string | null
}

const statusGutConfig: Record<string, { label: string; cor: string; bg: string }> = {
  PENDENTE:     { label: 'Pendente',     cor: '#4b5563', bg: '#f3f4f6' },
  EM_ANDAMENTO: { label: 'Em andamento', cor: '#1d4ed8', bg: '#eff6ff' },
  CONCLUIDO:    { label: 'Concluído',    cor: '#15803d', bg: '#f0fdf4' },
}

const statusOnaConfig: Record<string, { label: string; cor: string; bg: string }> = {
  NAO_AVALIADO:  { label: 'Não avaliado',  cor: '#6b7280', bg: '#f3f4f6' },
  CONFORME:      { label: 'Conforme',      cor: '#15803d', bg: '#f0fdf4' },
  PARCIAL:       { label: 'Parcial',       cor: '#92400e', bg: '#fef3c7' },
  NAO_CONFORME:  { label: 'Não conforme',  cor: '#b91c1c', bg: '#fef2f2' },
  EM_ELABORACAO: { label: 'Em elaboração', cor: '#1d4ed8', bg: '#eff6ff' },
  NAO_SE_APLICA: { label: 'Não se aplica', cor: '#6b7280', bg: '#f9fafb' },
}

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
  { id: 'questionarios', label: 'Questionários',      icone: ClipboardList },
  { id: 'documentos',    label: 'Documentos',         icone: FileText },
  { id: 'financeiro',    label: 'Financeiro',         icone: DollarSign },
  { id: 'diagnostico',   label: 'Diagnóstico',        icone: Activity },
  { id: 'acoes',         label: 'Ações / Matriz GUT', icone: AlertTriangle },
  { id: 'checklist-ona', label: 'Checklist ONA',      icone: ListChecks, somenteAcreditacao: true },
  { id: 'relatorio',     label: 'Relatórios',         icone: FileDown },
]

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

// ─── Aba: Ações (com Matriz GUT persistida) ───────────────────────────────────

function corGUT(gut: number) { return gut >= 60 ? '#b91c1c' : gut >= 27 ? '#92400e' : '#1d4ed8' }
function bgGUT(gut: number)  { return gut >= 60 ? '#fef2f2' : gut >= 27 ? '#fef3c7' : '#eff6ff' }

function FormNovoItemGut({ clienteId, onCriado, onCancelar }: {
  clienteId: string
  onCriado: (item: MatrizGutItem) => void
  onCancelar: () => void
}) {
  const [problema, setProblema] = useState('')
  const [area, setArea] = useState('')
  const [g, setG] = useState(3)
  const [u, setU] = useState(3)
  const [t, setT] = useState(3)
  const [responsavel, setResponsavel] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!problema.trim()) return
    setSalvando(true)
    try {
      const res = await fetch('/api/matriz-gut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteId, problema, area: area || undefined, gravidade: g, urgencia: u, tendencia: t, responsavel: responsavel || undefined }),
      })
      if (res.ok) onCriado(await res.json())
    } finally { setSalvando(false) }
  }

  return (
    <div style={{ padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', marginBottom: 12 }}>
      <input value={problema} onChange={e => setProblema(e.target.value)} placeholder="Descrição do problema"
        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input value={area} onChange={e => setArea(e.target.value)} placeholder="Área (opcional)"
          style={{ flex: 1, minWidth: 140, padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }} />
        <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}>
          <option value="">Responsável</option>
          {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        {[['G', g, setG], ['U', u, setU], ['T', t, setT]].map(([label, val, setter]: any) => (
          <label key={label} style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
            {label}
            <select value={val} onChange={e => setter(Number(e.target.value))} style={{ padding: '3px 4px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 11 }}>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        ))}
        <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 'auto', padding: '3px 8px', borderRadius: 6, background: bgGUT(g * u * t), color: corGUT(g * u * t) }}>
          GUT = {g * u * t}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancelar} className="btn-secondary text-xs">Cancelar</button>
        <button onClick={salvar} disabled={salvando || !problema.trim()} className="btn-primary text-xs">
          {salvando ? 'Salvando...' : 'Adicionar à matriz'}
        </button>
      </div>
    </div>
  )
}

function LinhaGutPersistida({ item, isLC, onAtualizado, onRemovido }: {
  item: MatrizGutItem
  isLC: boolean
  onAtualizado: (item: MatrizGutItem) => void
  onRemovido: (id: string) => void
}) {
  async function atualizar(campo: string, valor: any) {
    const res = await fetch(`/api/matriz-gut/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: valor }),
    })
    if (res.ok) onAtualizado(await res.json())
  }

  async function remover() {
    if (!confirm('Remover este item da Matriz GUT?')) return
    const res = await fetch(`/api/matriz-gut/${item.id}`, { method: 'DELETE' })
    if (res.ok) onRemovido(item.id)
  }

  const status = statusGutConfig[item.status] ?? statusGutConfig.PENDENTE

  return (
    <tr style={{ background: '#fff' }}>
      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
        <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.4, fontWeight: 500 }}>{item.problema}</p>
        {item.area && <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{item.area}</p>}
      </td>
      {(['gravidade', 'urgencia', 'tendencia'] as const).map(campo => (
        <td key={campo} style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
          {isLC ? (
            <select value={item[campo]} onChange={e => atualizar(campo, Number(e.target.value))}
              style={{ padding: '2px 3px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 11, width: 40 }}>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          ) : (
            <span style={{ fontWeight: 600, color: '#374151' }}>{item[campo]}</span>
          )}
        </td>
      ))}
      <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
        <span style={{ fontSize: 13, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: bgGUT(item.gut_score), color: corGUT(item.gut_score) }}>
          {item.gut_score}
        </span>
      </td>
      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
        <select value={item.status} onChange={e => atualizar('status', e.target.value)}
          style={{ fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1px solid #e5e7eb', background: status.bg, color: status.cor, width: '100%' }}>
          {Object.entries(statusGutConfig).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
      </td>
      <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
        <select value={item.responsavel ?? ''} onChange={e => atualizar('responsavel', e.target.value)}
          style={{ fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', width: '100%' }}>
          <option value="">Selecionar</option>
          {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </td>
      {isLC && (
        <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
          <button onClick={remover} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <Trash2 size={13} />
          </button>
        </td>
      )}
    </tr>
  )
}

function AbaAcoes({ cliente, isLC }: { cliente: Cliente; isLC: boolean }) {
  const [itensGut, setItensGut] = useState<MatrizGutItem[]>([])
  const [loadingGut, setLoadingGut] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch(`/api/matriz-gut?clienteId=${cliente.id}`)
        if (res.ok) setItensGut(await res.json())
      } finally { setLoadingGut(false) }
    }
    carregar()
  }, [cliente.id])

  // NCs em aberto que ainda não viraram item persistido na matriz
  const ncsSemItem = cliente.nao_conformidades.filter(nc => !itensGut.some(i => i.nc_id === nc.id))

  async function promoverNC(nc: Cliente['nao_conformidades'][number]) {
    const res = await fetch('/api/matriz-gut', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_id: cliente.id,
        problema: nc.descricao,
        area: nc.dominio,
        gravidade: gravidadeNC(nc.nivel),
        urgencia: urgenciaNC(nc.prazo_dias),
        tendencia: 3,
        nc_id: nc.id,
      }),
    })
    if (res.ok) {
      const novoItem = await res.json()
      setItensGut(prev => [...prev, novoItem])
    }
  }

  const itensOrdenados = [...itensGut].sort((a, b) => b.gut_score - a.gut_score)

  return (
    <div className="space-y-4">
      {/* Matriz GUT */}
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-gray-700">Matriz GUT — Priorização de problemas</h2>
          {isLC && !mostrarForm && (
            <button onClick={() => setMostrarForm(true)} className="btn-secondary flex items-center gap-1.5 text-xs">
              <Plus size={13} /> Novo item
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4">G = Gravidade · U = Urgência · T = Tendência · GUT = G×U×T</p>

        {isLC && mostrarForm && (
          <FormNovoItemGut
            clienteId={cliente.id}
            onCriado={item => { setItensGut(prev => [...prev, item]); setMostrarForm(false) }}
            onCancelar={() => setMostrarForm(false)}
          />
        )}

        {/* NCs ainda não incluídas na matriz */}
        {ncsSemItem.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: '#92400e', marginBottom: 6 }}>
              {ncsSemItem.length} não conformidade{ncsSemItem.length > 1 ? 's' : ''} em aberto ainda não incluída{ncsSemItem.length > 1 ? 's' : ''} na matriz:
            </p>
            <div className="space-y-1.5">
              {ncsSemItem.map(nc => {
                const gut = gravidadeNC(nc.nivel) * urgenciaNC(nc.prazo_dias) * 3
                return (
                  <div key={nc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, border: '1px dashed #e5e7eb' }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: ncCor[nc.nivel]?.bg, color: ncCor[nc.nivel]?.cor, fontWeight: 500, flexShrink: 0 }}>
                      {nc.nivel.replace('_', ' ')}
                    </span>
                    <p style={{ fontSize: 11, color: '#374151', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nc.descricao}</p>
                    <span style={{ fontSize: 11, fontWeight: 600, color: corGUT(gut) }}>GUT ≈ {gut}</span>
                    {isLC && (
                      <button onClick={() => promoverNC(nc)} className="btn-secondary text-xs" style={{ flexShrink: 0 }}>
                        Incluir na matriz
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loadingGut ? (
          <p className="text-sm text-gray-400 text-center py-4">Carregando...</p>
        ) : itensOrdenados.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
            <p className="text-sm text-gray-400">Nenhum item na Matriz GUT ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Problema</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 46 }}>G</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 46 }}>U</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 46 }}>T</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 60 }}>GUT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 140 }}>Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: 160 }}>Responsável</th>
                  {isLC && <th style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb', width: 36 }} />}
                </tr>
              </thead>
              <tbody>
                {itensOrdenados.map(item => (
                  <LinhaGutPersistida
                    key={item.id}
                    item={item}
                    isLC={isLC}
                    onAtualizado={atualizado => setItensGut(prev => prev.map(i => i.id === atualizado.id ? atualizado : i))}
                    onRemovido={id => setItensGut(prev => prev.filter(i => i.id !== id))}
                  />
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

// ─── Aba: Checklist ONA ────────────────────────────────────────────────────────

function LinhaChecklistOna({ item, isLC, onAtualizado }: {
  item: ChecklistOnaItem
  isLC: boolean
  onAtualizado: (item: ChecklistOnaItem) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [responsavel, setResponsavel] = useState(item.responsavel ?? '')
  const [localEvidencia, setLocalEvidencia] = useState(item.local_evidencia ?? '')
  const [proximaAcao, setProximaAcao] = useState(item.proxima_acao ?? '')
  const [observacoes, setObservacoes] = useState(item.observacoes ?? '')
  const [salvando, setSalvando] = useState(false)

  const status = statusOnaConfig[item.status] ?? statusOnaConfig.NAO_AVALIADO

  async function atualizar(campos: Record<string, any>) {
    const res = await fetch(`/api/checklist-ona/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campos),
    })
    if (res.ok) onAtualizado(await res.json())
  }

  async function salvarDetalhes() {
    setSalvando(true)
    try {
      await atualizar({ responsavel, local_evidencia: localEvidencia, proxima_acao: proximaAcao, observacoes })
    } finally { setSalvando(false) }
  }

  return (
    <div style={{ borderBottom: '1px solid #f3f4f6' }}>
      <div
        onClick={() => setAberto(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px', cursor: 'pointer' }}
      >
        <span style={{ fontSize: 10, color: '#c4c9d2', width: 34, flexShrink: 0 }}>#{item.ona_id}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.35 }}>
            {item.item_verificacao || item.descricao}
          </p>
          {item.categoria && <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{item.categoria}{item.requisito ? ` · ${item.requisito}` : ''}</p>}
        </div>
        <select
          value={item.status}
          onClick={e => e.stopPropagation()}
          onChange={e => atualizar({ status: e.target.value })}
          disabled={!isLC && item.status === 'CONFORME'}
          style={{ fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1px solid #e5e7eb', background: status.bg, color: status.cor, flexShrink: 0 }}
        >
          {Object.entries(statusOnaConfig).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        {aberto ? <ChevronUp size={14} className="text-gray-300 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-300 flex-shrink-0" />}
      </div>

      {aberto && (
        <div style={{ padding: '4px 4px 12px 44px' }} onClick={e => e.stopPropagation()}>
          {item.criterios && (
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, lineHeight: 1.4 }}>
              <strong style={{ color: '#374151' }}>Critérios mínimos:</strong> {item.criterios}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <select value={responsavel} onChange={e => setResponsavel(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11 }}>
              <option value="">Responsável</option>
              {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input value={localEvidencia} onChange={e => setLocalEvidencia(e.target.value)} placeholder="Local da evidência / documento"
              style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11 }} />
          </div>
          <input value={proximaAcao} onChange={e => setProximaAcao(e.target.value)} placeholder="Próxima ação / pendência"
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, marginBottom: 8, boxSizing: 'border-box' }} />
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações" rows={2}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, marginBottom: 8, boxSizing: 'border-box', resize: 'vertical' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={salvarDetalhes} disabled={salvando} className="btn-primary text-xs">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AbaChecklistOna({ cliente, isLC }: { cliente: Cliente; isLC: boolean }) {
  const [itens, setItens] = useState<ChecklistOnaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [carregandoBase, setCarregandoBase] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [filtroBase, setFiltroBase] = useState('TODOS')
  const [busca, setBusca] = useState('')

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch(`/api/checklist-ona?clienteId=${cliente.id}`)
      const data = await res.json()
      setItens(data.itens ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [cliente.id])

  async function carregarBaseOna() {
    setCarregandoBase(true)
    try {
      const res = await fetch('/api/checklist-ona/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: cliente.id }),
      })
      if (res.ok) await carregar()
    } finally { setCarregandoBase(false) }
  }

  const bases = Array.from(new Set(itens.map(i => i.documento_base)))

  const filtrados = itens.filter(i =>
    (filtroStatus === 'TODOS' || i.status === filtroStatus) &&
    (filtroBase === 'TODOS' || i.documento_base === filtroBase) &&
    (busca.trim() === '' || `${i.descricao} ${i.item_verificacao ?? ''} ${i.categoria ?? ''} ${i.secao ?? ''}`.toLowerCase().includes(busca.toLowerCase()))
  )

  const resumo = {
    total: itens.length,
    conforme: itens.filter(i => i.status === 'CONFORME').length,
  }
  const pctConforme = resumo.total > 0 ? Math.round((resumo.conforme / resumo.total) * 100) : 0

  if (loading) return <p className="text-sm text-gray-400 text-center py-8">Carregando...</p>

  if (itens.length === 0) {
    return (
      <div className="card text-center py-10">
        <ListChecks size={28} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-600 mb-1">Checklist ONA ainda não carregado para este cliente.</p>
        <p className="text-xs text-gray-400 mb-4">488 itens de verificação com base nos requisitos de acreditação ONA para nefrologia.</p>
        {isLC ? (
          <button onClick={carregarBaseOna} disabled={carregandoBase} className="btn-primary inline-flex items-center gap-2">
            {carregandoBase ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            {carregandoBase ? 'Carregando...' : 'Carregar checklist ONA'}
          </button>
        ) : (
          <p className="text-xs text-gray-400">A consultoria LC Saúde irá disponibilizá-lo em breve.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-medium text-gray-700">Checklist de preparação para auditoria ONA</h2>
            <p className="text-xs text-gray-400 mt-0.5">{resumo.total} itens de verificação</p>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20, fontWeight: 700, color: pctConforme >= 85 ? '#15803d' : pctConforme >= 50 ? '#92400e' : '#b91c1c' }}>
              {pctConforme}%
            </span>
            <span className="text-xs text-gray-400">conforme</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(statusOnaConfig).map(([v, c]) => {
            const n = itens.filter(i => i.status === v).length
            return (
              <span key={v} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: c.bg, color: c.cor }}>
                {c.label}: {n}
              </span>
            )
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: 9, color: '#9ca3af' }} />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por descrição, categoria, seção..."
              style={{ width: '100%', padding: '7px 10px 7px 28px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box' }} />
          </div>
          <select value={filtroBase} onChange={e => setFiltroBase(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}>
            <option value="TODOS">Todos os documentos-base</option>
            {bases.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}>
            <option value="TODOS">Todos os status</option>
            {Object.entries(statusOnaConfig).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="card" style={{ padding: '4px 12px', maxHeight: 560, overflow: 'auto' }}>
        {filtrados.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nenhum item corresponde ao filtro.</p>
        ) : (
          filtrados.map(item => (
            <LinhaChecklistOna
              key={item.id}
              item={item}
              isLC={isLC}
              onAtualizado={atualizado => setItens(prev => prev.map(i => i.id === atualizado.id ? atualizado : i))}
            />
          ))
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
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user?.perfil ?? '')

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState(searchParams.get('aba') ?? 'questionarios')

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

      {/* Resumo rápido */}
      {(() => {
        const score = cliente.dados_financeiros[0]?.score
        const ncsAbertas = cliente.nao_conformidades.length
        const acoesAbertas = cliente.acoes_corretivas.filter(a => a.status !== 'CONCLUIDA' && a.status !== 'CANCELADA').length
        return (
          <div className="flex items-center gap-4 mb-5 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100 flex-wrap">
            {score && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Score financeiro</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: score.score_final >= 85 ? '#15803d' : score.score_final >= 60 ? '#92400e' : '#b91c1c' }}>
                  {score.score_final}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">NCs abertas</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: ncsAbertas > 0 ? '#b91c1c' : '#15803d' }}>{ncsAbertas}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Ações abertas</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: acoesAbertas > 0 ? '#d97706' : '#15803d' }}>{acoesAbertas}</span>
            </div>
            {contrato && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-gray-400">Contrato até</span>
                <span className="text-xs font-medium text-gray-700">{fmtData(contrato.data_fim)}</span>
              </div>
            )}
          </div>
        )
      })()}

      {/* Abas */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {ABAS.filter(aba => !aba.somenteAcreditacao || cliente.perfil_diagnostico === 'ACREDITACAO').map(aba => {
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

      {abaAtiva === 'questionarios' && <AbaQuestionario  cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'documentos'   && <AbaDocumentos    cliente={cliente} />}
      {abaAtiva === 'financeiro'   && <AbaFinanceiro    cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'diagnostico'  && <AbaDiagnostico   cliente={cliente} />}
      {abaAtiva === 'acoes'        && <AbaAcoes         cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'checklist-ona' && <AbaChecklistOna cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'relatorio'    && <AbaRelatorio     cliente={cliente} />}
    </div>
  )
}

