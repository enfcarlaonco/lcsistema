'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ChevronRight, BarChart2, ClipboardList, FileText,
  DollarSign, AlertTriangle, FileDown, Plus, Pencil,
  CheckCircle, Clock, XCircle, Upload, ExternalLink,
  ChevronDown, ChevronUp, RefreshCw, Users
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
    indicadores?: {
      taxa_ocupacao: number
      taxa_glosa: number
      margem_percentual: number
      custo_por_sessao: string
      faturamento_liquido: string
    }
    score?: { score_final: number; classificacao: string }
  }>
  nao_conformidades: Array<{
    id: string
    nivel: string
    dominio: string
    descricao: string
    prazo_limite: string
    status: string
  }>
  acoes_corretivas: Array<{
    id: string
    titulo: string
    prioridade: string
    status: string
    prazo: string
    origem: string
  }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number | string) {
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatPercent(val: number) {
  return `${val.toFixed(1)}%`
}

const ABAS = [
  { id: 'visao-geral',  label: 'Visão Geral',   icone: BarChart2 },
  { id: 'questionario', label: 'Questionário',   icone: ClipboardList },
  { id: 'documentos',   label: 'Documentos',     icone: FileText },
  { id: 'financeiro',   label: 'Financeiro',     icone: DollarSign },
  { id: 'acoes',        label: 'Ações',          icone: AlertTriangle },
  { id: 'relatorio',    label: 'Relatório',      icone: FileDown },
]

const prioridadeCor: Record<string, string> = {
  CRITICA:  'bg-red-50 text-red-700',
  ALTA:     'bg-yellow-50 text-yellow-700',
  MODERADA: 'bg-blue-50 text-blue-700',
  BAIXA:    'bg-gray-100 text-gray-600',
}

const statusCor: Record<string, string> = {
  PENDENTE:     'bg-gray-100 text-gray-600',
  EM_ANDAMENTO: 'bg-blue-50 text-blue-700',
  CONCLUIDA:    'bg-green-50 text-green-700',
  CANCELADA:    'bg-gray-100 text-gray-400',
}

const ncCor: Record<string, string> = {
  NC_III: 'bg-red-50 text-red-700',
  NC_II:  'bg-yellow-50 text-yellow-700',
  NC_I:   'bg-blue-50 text-blue-700',
}

// ─── Aba: Visão Geral ─────────────────────────────────────────────────────────

function AbaVisaoGeral({ cliente, isLC }: { cliente: Cliente; isLC: boolean }) {
  const contrato = cliente.contratos[0]
  const ultimoDado = cliente.dados_financeiros[0]
  const questionario = cliente.questionarios[0]

  return (
    <div className="space-y-4">
      {/* Dados do contrato */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Contrato ativo</h2>
        {contrato ? (
          <div className="grid grid-cols-3 gap-4">
            {[
              ['Início', formatDate(contrato.data_inicio)],
              ['Término', formatDate(contrato.data_fim)],
              ['Valor total', formatCurrency(contrato.valor_total)],
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
        ) : (
          <p className="text-sm text-gray-400">Nenhum contrato ativo.</p>
        )}
      </div>

      {/* KPIs financeiros */}
      {ultimoDado?.indicadores && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Indicadores — {new Date(ultimoDado.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              ['Faturamento bruto', formatCurrency(ultimoDado.faturamento_bruto)],
              ['Faturamento líquido', formatCurrency(ultimoDado.indicadores.faturamento_liquido)],
              ['Margem operacional', formatPercent(ultimoDado.indicadores.margem_percentual)],
              ['Taxa de glosa', formatPercent(ultimoDado.indicadores.taxa_glosa)],
              ['Taxa de ocupação', formatPercent(ultimoDado.indicadores.taxa_ocupacao)],
              ['Custo por sessão', formatCurrency(ultimoDado.indicadores.custo_por_sessao)],
            ].map(([label, valor]) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900">{valor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${ncCor[nc.nivel] ?? 'bg-gray-100 text-gray-600'}`}>
                  {nc.nivel.replace('_', ' ')}
                </span>
                <p className="text-xs text-gray-700 flex-1">{nc.descricao}</p>
                <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(nc.prazo_limite)}</p>
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
        <h2 className="text-sm font-medium text-gray-700">Questionário M2 — Diagnóstico</h2>
        {isLC && contrato && !questionario && (
          <Link
            href={`/dashboard/clientes/${cliente.id}/questionario/novo`}
            className="btn-primary flex items-center gap-2 text-xs"
          >
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
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${questionario.pct_completo}%` }}
                />
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              questionario.status === 'VALIDADO' ? 'bg-green-50 text-green-700' :
              questionario.status === 'EM_ANDAMENTO' ? 'bg-blue-50 text-blue-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {questionario.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/questionarios/${questionario.id}`}
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <ClipboardList size={13} /> Ver questionário
            </Link>
            {isLC && (
              <Link
                href={`/dashboard/clientes/${cliente.id}/resultados`}
                className="btn-secondary flex items-center gap-2 text-xs"
              >
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
  const contrato = cliente.contratos[0]

  if (!contrato) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-gray-400">Nenhum contrato ativo para este cliente.</p>
      </div>
    )
  }

  // Redireciona para a página de documentos com contexto do cliente
  return (
    <div className="space-y-4">
      <DocumentosCliente clienteId={cliente.id} contratoId={contrato.id} clienteNome={cliente.nome} />
    </div>
  )
}

// ─── Componente de documentos inline ─────────────────────────────────────────

function DocumentosCliente({ clienteId, contratoId, clienteNome }: {
  clienteId: string
  contratoId: string
  clienteNome: string
}) {
  const { data: session } = useSession()
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user?.perfil ?? '')

  const [documentosEnviados, setDocumentosEnviados] = useState<any[]>([])
  const [referencias, setReferencias] = useState<any[]>([])
  const [referenciaExpandida, setReferenciaExpandida] = useState(false)
  const [loading, setLoading] = useState(true)
  const [docUpload, setDocUpload] = useState<any | null>(null)
  const [docAvaliando, setDocAvaliando] = useState<any | null>(null)
  const [filtroGrau, setFiltroGrau] = useState('TODOS')

  const grauConfig: Record<string, { label: string; bg: string; cor: string }> = {
    LEGISLACAO:        { label: 'Legislação',    bg: '#fee2e2', cor: '#b91c1c' },
    ACREDITACAO:       { label: 'ONA',           bg: '#f3e8ff', cor: '#7e22ce' },
    MELHORES_PRATICAS: { label: 'Boas práticas', bg: '#dbeafe', cor: '#1d4ed8' },
  }

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch(`/api/documentos?clienteId=${clienteId}`)
      const data = await res.json()
      setDocumentosEnviados(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function carregarReferencias() {
    if (referenciaExpandida && referencias.length > 0) { setReferenciaExpandida(false); return }
    const res = await fetch(`/api/documentos/referencia?clienteId=${clienteId}`)
    const data = await res.json()
    setReferencias(data.documentos ?? [])
    setReferenciaExpandida(true)
  }

  useEffect(() => { carregar() }, [clienteId])

  const docsFiltrados = filtroGrau === 'TODOS'
    ? documentosEnviados
    : documentosEnviados.filter(d => d.documento_referencia?.grau_necessidade === filtroGrau)

  const refsFiltradas = filtroGrau === 'TODOS'
    ? referencias
    : referencias.filter(r => r.grau_necessidade === filtroGrau)

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['TODOS', 'LEGISLACAO', 'ACREDITACAO', 'MELHORES_PRATICAS'].map(g => (
          <button key={g} onClick={() => setFiltroGrau(g)} style={{
            padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
            border: `1px solid ${filtroGrau === g ? '#1e40af' : '#e5e7eb'}`,
            background: filtroGrau === g ? '#eff6ff' : 'transparent',
            color: filtroGrau === g ? '#1e40af' : '#6b7280',
            fontWeight: filtroGrau === g ? 500 : 400,
          }}>
            {g === 'TODOS' ? 'Todos' : g === 'LEGISLACAO' ? 'Legislação' : g === 'ACREDITACAO' ? 'ONA' : 'Boas práticas'}
          </button>
        ))}
      </div>

      {/* Documentos enviados */}
      <div className="space-y-2 mb-4">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">Carregando...</p>
        ) : docsFiltrados.length === 0 ? (
          <div className="card text-center py-6">
            <FileText size={24} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Nenhum documento enviado ainda.</p>
          </div>
        ) : (
          docsFiltrados.map(doc => {
            const grau = grauConfig[doc.documento_referencia?.grau_necessidade]
            const ultimaAv = doc.avaliacoes?.[0]
            const statusLabel: Record<string, string> = {
              PENDENTE: 'Pendente', ENVIADO: 'Enviado', EM_AVALIACAO: 'Em avaliação',
              APROVADO: 'Conforme', REPROVADO: 'Não conforme', DESATUALIZADO: 'Desatualizado',
            }
            return (
              <div key={doc.id} className="card flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText size={16} className="text-brand-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.documento_referencia?.titulo || doc.documento_referencia?.nome_documento}
                    </p>
                    <p className="text-xs text-gray-400">{doc.nome_arquivo} · {formatDate(doc.data_envio)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {grau && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: grau.bg, color: grau.cor }}>{grau.label}</span>}
                  {ultimaAv && <span style={{ fontSize: '12px', fontWeight: 500, color: ultimaAv.score_final >= 85 ? '#15803d' : ultimaAv.score_final >= 60 ? '#92400e' : '#b91c1c' }}>{ultimaAv.score_final.toFixed(0)}%</span>}
                  {doc.arquivo_url && (
                    <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-brand-500">
                      <ExternalLink size={13} />
                    </a>
                  )}
                  {isLC && doc.status_documento !== 'APROVADO' && (
                    <button onClick={() => setDocAvaliando(doc)} style={{ padding: '4px 10px', borderRadius: '6px', background: '#1e40af', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px' }}>
                      Avaliar
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Lista mestre */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <button onClick={carregarReferencias} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
          <span>Lista mestre de documentos de referência</span>
          {referenciaExpandida ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {referenciaExpandida && (
          <div style={{ padding: '12px 16px', maxHeight: '360px', overflow: 'auto' }}>
            {refsFiltradas.map(ref => {
              const grau = grauConfig[ref.grau_necessidade]
              const jaEnviado = documentosEnviados.some(d => d.documento_referencia?.codigo === ref.codigo)
              return (
                <div key={ref.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 500 }}>
                      {ref.titulo || ref.nome_documento}
                      {ref.obrigatorio && <span style={{ color: '#b91c1c', marginLeft: 4 }}>*</span>}
                    </p>
                    <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {ref.tipo_documento?.nome} · {ref.area}
                      {ref.legislacao_ref && ` · ${ref.legislacao_ref.replace(/_/g, ' ')}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {grau && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '999px', background: grau.bg, color: grau.cor }}>{grau.label}</span>}
                    {jaEnviado
                      ? <CheckCircle size={13} style={{ color: '#15803d' }} />
                      : <button onClick={() => setDocUpload(ref)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: '6px', background: '#1e40af', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px' }}>
                          <Upload size={10} /> Enviar
                        </button>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal upload */}
      {docUpload && (
        <ModalUploadInline
          docRef={docUpload}
          clienteId={clienteId}
          contratoId={contratoId}
          onClose={() => setDocUpload(null)}
          onSalvo={() => { setDocUpload(null); carregar() }}
        />
      )}
    </div>
  )
}

// ─── Modal upload inline ──────────────────────────────────────────────────────

function ModalUploadInline({ docRef, clienteId, contratoId, onClose, onSalvo }: any) {
  const inputRef = useState<HTMLInputElement | null>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [versao, setVersao] = useState('')
  const [etapa, setEtapa] = useState<'selecao' | 'enviando' | 'resultado'>('selecao')
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')
  const fileInputRef = useState<HTMLInputElement | null>(null)
  const ref = { current: null as HTMLInputElement | null }

  async function enviar() {
    if (!arquivo) return
    setEtapa('enviando')
    try {
      const formData = new FormData()
      formData.append('arquivo', arquivo)
      formData.append('clienteId', clienteId)
      formData.append('contratoId', contratoId)
      formData.append('documentoReferenciaId', docRef.id)
      if (versao) formData.append('versao', versao)

      const res = await fetch('/api/documentos/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao enviar.'); setEtapa('selecao'); return }
      setResultado(data)
      setEtapa('resultado')
      onSalvo()
    } catch { setErro('Erro de conexão.'); setEtapa('selecao') }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: 4 }}>{docRef.tipo_documento?.nome} · {docRef.area}</p>
          <h2 style={{ fontSize: '15px', fontWeight: 500 }}>{docRef.titulo || docRef.nome_documento}</h2>
        </div>

        {etapa === 'selecao' && (
          <>
            <div
              onClick={() => ref.current?.click()}
              style={{ border: `2px dashed ${arquivo ? '#1e40af' : '#e5e7eb'}`, borderRadius: '10px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: arquivo ? '#eff6ff' : '#f9fafb', marginBottom: '1rem' }}
            >
              <input ref={el => { ref.current = el }} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={e => setArquivo(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
              <Upload size={24} style={{ margin: '0 auto 8px', color: arquivo ? '#1e40af' : '#9ca3af' }} />
              {arquivo ? (
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#1e40af' }}>{arquivo.name}</p>
              ) : (
                <p style={{ fontSize: '13px', color: '#6b7280' }}>Clique para selecionar o arquivo</p>
              )}
            </div>
            <input type="text" value={versao} onChange={e => setVersao(e.target.value)} placeholder="Versão (opcional)" style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', marginBottom: '1rem', boxSizing: 'border-box' }} />
            {erro && <p style={{ fontSize: '12px', color: '#b91c1c', marginBottom: '1rem' }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              <button onClick={enviar} disabled={!arquivo} style={{ padding: '8px 18px', borderRadius: '8px', background: '#1e40af', color: '#fff', border: 'none', cursor: arquivo ? 'pointer' : 'not-allowed', fontSize: '13px', opacity: arquivo ? 1 : 0.5 }}>Enviar</button>
            </div>
          </>
        )}

        {etapa === 'enviando' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <RefreshCw size={28} style={{ margin: '0 auto 12px', color: '#1e40af', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '13px', fontWeight: 500 }}>Enviando para o Google Drive...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {etapa === 'resultado' && resultado && (
          <div>
            <div style={{ padding: '1rem', borderRadius: '8px', background: '#f0fdf4', marginBottom: '1rem' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#15803d' }}>✓ Documento enviado com sucesso</p>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>{resultado.mensagem}</p>
            </div>
            {resultado.arquivo_url && (
              <a href={resultado.arquivo_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px', color: '#1e40af', marginBottom: '1rem', textDecoration: 'none' }}>
                <ExternalLink size={12} /> Ver no Google Drive
              </a>
            )}
            <button onClick={onClose} style={{ width: '100%', padding: '9px', borderRadius: '8px', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Fechar</button>
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
        cliente.dados_financeiros.map(d => (
          <div key={d.id} className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {new Date(d.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            {d.indicadores ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Faturamento bruto', formatCurrency(d.faturamento_bruto)],
                  ['Faturamento líquido', formatCurrency(d.indicadores.faturamento_liquido)],
                  ['Margem', formatPercent(d.indicadores.margem_percentual)],
                  ['Glosa', formatPercent(d.indicadores.taxa_glosa)],
                  ['Ocupação', formatPercent(d.indicadores.taxa_ocupacao)],
                  ['Custo/sessão', formatCurrency(d.indicadores.custo_por_sessao)],
                ].map(([label, valor]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{valor}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Indicadores não calculados.</p>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// ─── Aba: Ações ───────────────────────────────────────────────────────────────

function AbaAcoes({ cliente }: { cliente: Cliente }) {
  return (
    <div className="space-y-2">
      {cliente.acoes_corretivas.length === 0 ? (
        <div className="card text-center py-8">
          <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
          <p className="text-sm text-gray-400">Nenhuma ação corretiva em aberto.</p>
        </div>
      ) : (
        cliente.acoes_corretivas.map(acao => {
          const vencida = new Date(acao.prazo) < new Date() && acao.status !== 'CONCLUIDA'
          return (
            <div key={acao.id} className="card flex items-center justify-between gap-3">
              <div style={{ borderLeft: `3px solid ${acao.prioridade === 'CRITICA' ? '#b91c1c' : acao.prioridade === 'ALTA' ? '#d97706' : '#3b82f6'}`, paddingLeft: '12px', flex: 1, minWidth: 0 }}>
                <p className="text-sm font-medium text-gray-900 truncate">{acao.titulo}</p>
                <p className="text-xs text-gray-400">{acao.origem.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${prioridadeCor[acao.prioridade] ?? 'bg-gray-100 text-gray-500'}`}>
                  {acao.prioridade}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusCor[acao.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {acao.status.replace(/_/g, ' ')}
                </span>
                <p className={`text-xs ${vencida ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                  {vencida ? '⚠ ' : ''}{formatDate(acao.prazo)}
                </p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Aba: Relatório ───────────────────────────────────────────────────────────

function AbaRelatorio({ cliente }: { cliente: Cliente }) {
  const [gerando, setGerando] = useState(false)
  const contrato = cliente.contratos[0]

  async function gerarRelatorio() {
    setGerando(true)
    try {
      const url = `/api/relatorio/${cliente.id}${contrato ? `?contratoId=${contrato.id}` : ''}`
      const res = await fetch(url)
      if (!res.ok) { alert('Erro ao gerar relatório.'); return }
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `diagnostico_${cliente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
      link.click()
    } finally { setGerando(false) }
  }

  return (
    <div className="card">
      <h2 className="text-sm font-medium text-gray-700 mb-2">Relatório Diagnóstico PDF</h2>
      <p className="text-xs text-gray-400 mb-4">
        Gera o relatório completo com identificação do serviço, resultado do questionário M2, não conformidades, avaliação documental, indicadores financeiros e plano de ação.
      </p>
      <button
        onClick={gerarRelatorio}
        disabled={gerando}
        className="btn-primary flex items-center gap-2"
      >
        {gerando ? <RefreshCw size={14} className="animate-spin" /> : <FileDown size={14} />}
        {gerando ? 'Gerando...' : 'Gerar e baixar relatório'}
      </button>
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
      } finally {
        setLoading(false)
      }
    }
    if (params.id) carregar()
  }, [params.id])

  if (loading) return <div className="text-center py-12 text-sm text-gray-400">Carregando...</div>
  if (!cliente) return <div className="text-center py-12 text-sm text-gray-400">Cliente não encontrado.</div>

  const contrato = cliente.contratos[0]

  return (
    <div>
      {/* Breadcrumb + cabeçalho */}
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
            {contrato && ` · Contrato até ${formatDate(contrato.data_fim)}`}
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
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                abaAtiva === aba.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icone size={14} />
              {aba.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo da aba */}
      {abaAtiva === 'visao-geral'  && <AbaVisaoGeral  cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'questionario' && <AbaQuestionario cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'documentos'   && <AbaDocumentos  cliente={cliente} />}
      {abaAtiva === 'financeiro'   && <AbaFinanceiro  cliente={cliente} isLC={isLC} />}
      {abaAtiva === 'acoes'        && <AbaAcoes       cliente={cliente} />}
      {abaAtiva === 'relatorio'    && <AbaRelatorio   cliente={cliente} />}
    </div>
  )
}

