'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { FileText, CheckCircle, AlertCircle, XCircle, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface DocumentoEnviado {
  id: string
  nome_arquivo: string
  arquivo_url: string
  versao_informada?: string
  data_envio: string
  status_documento: string
  cliente: { id: string; nome: string; perfil_diagnostico: string }
  documento_referencia: {
    codigo: string
    titulo: string
    nome_documento: string
    categoria: string
    area: string
    tema: string
    grau_necessidade: string
    legislacao_ref?: string
    ona_requisito?: string
    obrigatorio: boolean
    tipo_documento: { nome: string }
  }
  avaliacoes: Array<{
    score_final: number
    classificacao: string
    data_avaliacao: string
  }>
}

interface DocumentoReferencia {
  id: string
  codigo: string
  titulo: string
  nome_documento: string
  area: string
  tema: string
  grau_necessidade: string
  perfil_requerido: string
  legislacao_ref?: string
  ona_requisito?: string
  obrigatorio: boolean
  tipo_documento: { nome: string }
}

// ─── Helpers visuais ──────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; cor: string; icone: any }> = {
  PENDENTE:     { label: 'Pendente',      cor: 'bg-gray-100 text-gray-600',    icone: Clock },
  ENVIADO:      { label: 'Enviado',       cor: 'bg-blue-50 text-blue-600',     icone: FileText },
  EM_AVALIACAO: { label: 'Em avaliação',  cor: 'bg-yellow-50 text-yellow-700', icone: Clock },
  APROVADO:     { label: 'Conforme',      cor: 'bg-green-50 text-green-700',   icone: CheckCircle },
  REPROVADO:    { label: 'Não conforme',  cor: 'bg-red-50 text-red-700',       icone: XCircle },
  DESATUALIZADO:{ label: 'Desatualizado', cor: 'bg-orange-50 text-orange-700', icone: AlertCircle },
}

const grauConfig: Record<string, { label: string; cor: string }> = {
  LEGISLACAO:        { label: 'Legislação',       cor: 'bg-red-100 text-red-700' },
  ACREDITACAO:       { label: 'ONA',              cor: 'bg-purple-100 text-purple-700' },
  MELHORES_PRATICAS: { label: 'Boas práticas',    cor: 'bg-blue-100 text-blue-700' },
}

// ─── Modal de avaliação ───────────────────────────────────────────────────────

const DIMENSOES = [
  { nome: 'Existência',     descricao: 'O documento existe e está disponível para consulta?', peso: '10%' },
  { nome: 'Estrutura',      descricao: 'O documento está completo, formatado, com identificação, objetivo, fluxo, responsáveis, data e assinatura?', peso: '40%' },
  { nome: 'Aplicabilidade', descricao: 'A equipe utiliza efetivamente o documento na prática? Há evidências de treinamento e adesão?', peso: '50%' },
]

function ModalAvaliacao({ doc, onClose, onSalvo }: {
  doc: DocumentoEnviado
  onClose: () => void
  onSalvo: () => void
}) {
  const [respostas, setRespostas] = useState<Record<string, { resposta: string; comentario: string }>>({})
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState<{ score: number; classificacao: string; mensagem: string } | null>(null)

  function setResposta(dimensao: string, campo: 'resposta' | 'comentario', valor: string) {
    setRespostas(prev => ({
      ...prev,
      [dimensao]: { ...prev[dimensao], [campo]: valor },
    }))
  }

  // Calcula preview do score em tempo real
  const scorePreview = (() => {
    const pesos = { 'Existência': 0.10, 'Estrutura': 0.40, 'Aplicabilidade': 0.50 }
    const pontos = { SIM: 100, PARCIAL: 75, NAO: 0, NAO_SE_APLICA: null }
    let total = 0; let peso = 0
    for (const dim of DIMENSOES) {
      const r = respostas[dim.nome]?.resposta as keyof typeof pontos
      const p = pontos[r]
      if (p === null || p === undefined) continue
      total += p * pesos[dim.nome as keyof typeof pesos]
      peso += pesos[dim.nome as keyof typeof pesos]
    }
    return peso > 0 ? Math.round((total / peso) * 100) / 100 : null
  })()

  async function salvar() {
    const respostasArray = DIMENSOES.map(d => ({
      dimensao: d.nome,
      resposta: respostas[d.nome]?.resposta || 'NAO_SE_APLICA',
      comentario: respostas[d.nome]?.comentario || '',
    }))

    setSalvando(true)
    try {
      const res = await fetch(`/api/documentos/${doc.id}/avaliar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostas: respostasArray, observacao_geral: observacao }),
      })
      const data = await res.json()
      if (res.ok) {
        setResultado({ score: data.score_final, classificacao: data.classificacao, mensagem: data.mensagem })
        onSalvo()
      }
    } finally {
      setSalvando(false)
    }
  }

  const corScore = scorePreview === null ? 'text-gray-400'
    : scorePreview >= 85 ? 'text-green-600'
    : scorePreview >= 60 ? 'text-yellow-600'
    : 'text-red-600'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }}>

        {/* Cabeçalho */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            {doc.documento_referencia.tipo_documento.nome} · {doc.documento_referencia.area}
          </p>
          <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {doc.documento_referencia.titulo || doc.documento_referencia.nome_documento}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {doc.cliente.nome} · {doc.nome_arquivo}
          </p>
        </div>

        {resultado ? (
          /* Resultado da avaliação */
          <div>
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--border-radius-md)',
              background: resultado.classificacao === 'CONFORME' ? 'var(--color-background-success)'
                : resultado.classificacao === 'PARCIAL' ? 'var(--color-background-warning)'
                : 'var(--color-background-danger)',
              marginBottom: '1rem',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 500 }}>{resultado.mensagem}</p>
              <p style={{ fontSize: '24px', fontWeight: 500, marginTop: '8px' }}>{resultado.score.toFixed(0)}%</p>
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
              Fechar
            </button>
          </div>
        ) : (
          /* Formulário de avaliação */
          <>
            {DIMENSOES.map(dim => (
              <div key={dim.nome} style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 500 }}>{dim.nome}</p>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>peso {dim.peso}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>{dim.descricao}</p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {(['SIM', 'PARCIAL', 'NAO', 'NAO_SE_APLICA'] as const).map(opcao => {
                    const selecionado = respostas[dim.nome]?.resposta === opcao
                    const cores: Record<string, string> = {
                      SIM: selecionado ? '#15803d' : '',
                      PARCIAL: selecionado ? '#92400e' : '',
                      NAO: selecionado ? '#b91c1c' : '',
                      NAO_SE_APLICA: selecionado ? '#4b5563' : '',
                    }
                    const labels: Record<string, string> = { SIM: 'Sim', PARCIAL: 'Parcial', NAO: 'Não', NAO_SE_APLICA: 'N/A' }
                    return (
                      <button
                        key={opcao}
                        onClick={() => setResposta(dim.nome, 'resposta', opcao)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--border-radius-md)',
                          border: `1px solid ${selecionado ? cores[opcao] : 'var(--color-border-tertiary)'}`,
                          background: selecionado ? `${cores[opcao]}15` : 'transparent',
                          color: selecionado ? cores[opcao] : 'var(--color-text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: selecionado ? 500 : 400,
                        }}
                      >
                        {labels[opcao]}
                      </button>
                    )
                  })}
                </div>

                {respostas[dim.nome]?.resposta && respostas[dim.nome]?.resposta !== 'NAO_SE_APLICA' && (
                  <input
                    type="text"
                    placeholder="Comentário (opcional)"
                    value={respostas[dim.nome]?.comentario || ''}
                    onChange={e => setResposta(dim.nome, 'comentario', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}

            {/* Observação geral */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Observação geral (opcional)</label>
              <textarea
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Preview score + botões */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Score estimado</p>
                <p style={{ fontSize: '22px', fontWeight: 500, className: corScore }}>
                  {scorePreview !== null ? `${scorePreview.toFixed(0)}%` : '—'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={salvando}
                  style={{ padding: '9px 20px', borderRadius: 'var(--border-radius-md)', background: '#1e40af', color: '#fff', border: 'none', cursor: salvando ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: salvando ? 0.7 : 1 }}
                >
                  {salvando ? 'Salvando...' : 'Salvar avaliação'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DocumentosPage() {
  const { data: session } = useSession()
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user?.perfil ?? '')

  const [documentosEnviados, setDocumentosEnviados] = useState<DocumentoEnviado[]>([])
  const [referenciaExpandida, setReferenciaExpandida] = useState(false)
  const [referencias, setReferencias] = useState<DocumentoReferencia[]>([])
  const [filtroGrau, setFiltroGrau] = useState<string>('TODOS')
  const [docAvaliando, setDocAvaliando] = useState<DocumentoEnviado | null>(null)
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch('/api/documentos')
      const data = await res.json()
      setDocumentosEnviados(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function carregarReferencias() {
    if (referencias.length > 0) { setReferenciaExpandida(v => !v); return }
    const clienteId = !isLC ? session?.user?.clienteId : undefined
    const url = clienteId ? `/api/documentos/referencia?clienteId=${clienteId}` : '/api/documentos/referencia'
    const res = await fetch(url)
    const data = await res.json()
    setReferencias(data.documentos ?? [])
    setReferenciaExpandida(true)
  }

  useEffect(() => { carregar() }, [])

  const docsFiltrados = filtroGrau === 'TODOS'
    ? documentosEnviados
    : documentosEnviados.filter(d => d.documento_referencia.grau_necessidade === filtroGrau)

  const refsFiltradas = filtroGrau === 'TODOS'
    ? referencias
    : referencias.filter(r => r.grau_necessidade === filtroGrau)

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Documentos</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {documentosEnviados.length} documento{documentosEnviados.length !== 1 ? 's' : ''} enviado{documentosEnviados.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtro por grau */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['TODOS', 'LEGISLACAO', 'ACREDITACAO', 'MELHORES_PRATICAS'].map(g => (
            <button
              key={g}
              onClick={() => setFiltroGrau(g)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--border-radius-md)',
                border: `1px solid ${filtroGrau === g ? '#1e40af' : 'var(--color-border-tertiary)'}`,
                background: filtroGrau === g ? '#eff6ff' : 'transparent',
                color: filtroGrau === g ? '#1e40af' : 'var(--color-text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: filtroGrau === g ? 500 : 400,
              }}
            >
              {g === 'TODOS' ? 'Todos' : g === 'LEGISLACAO' ? 'Legislação' : g === 'ACREDITACAO' ? 'ONA' : 'Boas práticas'}
            </button>
          ))}
        </div>
      </div>

      {/* Documentos enviados */}
      <div style={{ marginBottom: '1.5rem' }}>
        {loading ? (
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>Carregando...</p>
        ) : docsFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-lg)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', color: 'var(--color-text-secondary)', opacity: 0.4 }} />
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Nenhum documento enviado ainda.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {docsFiltrados.map(doc => {
              const status = statusConfig[doc.status_documento] ?? statusConfig.PENDENTE
              const grau = grauConfig[doc.documento_referencia.grau_necessidade]
              const ultimaAv = doc.avaliacoes?.[0]
              const Icone = status.icone

              return (
                <div key={doc.id} style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: '36px', height: '36px', background: '#eff6ff', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={16} style={{ color: '#1e40af' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.documento_referencia.titulo || doc.documento_referencia.nome_documento}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {isLC && `${doc.cliente.nome} · `}
                        {doc.documento_referencia.tipo_documento.nome} · {doc.documento_referencia.area}
                        {doc.documento_referencia.legislacao_ref && ` · ${doc.documento_referencia.legislacao_ref.replace(/_/g, ' ')}`}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {grau && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', ...parseStyle(grau.cor) }}>
                        {grau.label}
                      </span>
                    )}
                    {ultimaAv && (
                      <span style={{ fontSize: '12px', fontWeight: 500, color: ultimaAv.score_final >= 85 ? '#15803d' : ultimaAv.score_final >= 60 ? '#92400e' : '#b91c1c' }}>
                        {ultimaAv.score_final.toFixed(0)}%
                      </span>
                    )}
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', ...parseStyle(status.cor) }}>
                      {status.label}
                    </span>
                    {isLC && doc.status_documento !== 'APROVADO' && (
                      <button
                        onClick={() => setDocAvaliando(doc)}
                        style={{ padding: '5px 12px', borderRadius: 'var(--border-radius-md)', background: '#1e40af', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Avaliar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Lista de referência (expansível) */}
      <div style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
        <button
          onClick={carregarReferencias}
          style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-background-secondary)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
        >
          <span>Lista mestre de documentos de referência</span>
          {referenciaExpandida ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {referenciaExpandida && (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflow: 'auto' }}>
            {refsFiltradas.map(ref => {
              const grau = grauConfig[ref.grau_necessidade]
              const jaEnviado = documentosEnviados.some(d => d.documento_referencia.codigo === ref.codigo)
              return (
                <div key={ref.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {ref.titulo || ref.nome_documento}
                      {ref.obrigatorio && <span style={{ color: '#b91c1c', marginLeft: '4px' }}>*</span>}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {ref.tipo_documento.nome} · {ref.area}
                      {ref.legislacao_ref && ` · ${ref.legislacao_ref.replace(/_/g, ' ')}`}
                      {ref.ona_requisito && ` · ONA ${ref.ona_requisito}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {grau && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '999px', ...parseStyle(grau.cor) }}>{grau.label}</span>}
                    {jaEnviado
                      ? <CheckCircle size={14} style={{ color: '#15803d' }} />
                      : <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>pendente</span>
                    }
                  </div>
                </div>
              )
            })}
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              * Obrigatório por legislação
            </p>
          </div>
        )}
      </div>

      {/* Modal de avaliação */}
      {docAvaliando && (
        <ModalAvaliacao
          doc={docAvaliando}
          onClose={() => setDocAvaliando(null)}
          onSalvo={() => { setDocAvaliando(null); carregar() }}
        />
      )}
    </div>
  )
}

// Converte string de classe Tailwind-like em style object
function parseStyle(classes: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    'bg-gray-100':    { background: '#f3f4f6' },
    'text-gray-600':  { color: '#4b5563' },
    'bg-blue-50':     { background: '#eff6ff' },
    'text-blue-600':  { color: '#2563eb' },
    'bg-yellow-50':   { background: '#fefce8' },
    'text-yellow-700':{ color: '#a16207' },
    'bg-green-50':    { background: '#f0fdf4' },
    'text-green-700': { color: '#15803d' },
    'bg-red-50':      { background: '#fef2f2' },
    'text-red-700':   { color: '#b91c1c' },
    'bg-red-100':     { background: '#fee2e2' },
    'bg-orange-50':   { background: '#fff7ed' },
    'text-orange-700':{ color: '#c2410c' },
    'bg-purple-100':  { background: '#f3e8ff' },
    'text-purple-700':{ color: '#7e22ce' },
    'bg-blue-100':    { background: '#dbeafe' },
    'text-blue-700':  { color: '#1d4ed8' },
  }
  return Object.assign({}, ...classes.split(' ').map(c => map[c] ?? {}))
}
