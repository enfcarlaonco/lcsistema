'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle, Clock, XCircle, AlertCircle, ChevronDown, ChevronUp, Users } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AcaoCorretiva {
  id: string
  titulo: string
  descricao: string
  prioridade: string
  status: string
  origem: string
  prazo: string
  concluida_at?: string
  evidencia_texto?: string
  agentes_responsaveis?: string[]
  historico?: Array<{
    data: string
    usuario_nome: string
    perfil: string
    status_anterior: string
    novo_status: string
    observacao?: string
  }>
  cliente: { id: string; nome: string }
  nao_conformidade?: { nivel: string; dominio: string; descricao: string }
}

// ─── Configurações visuais ────────────────────────────────────────────────────

const prioridadeConfig: Record<string, { cor: string; bg: string }> = {
  CRITICA:  { cor: '#b91c1c', bg: '#fef2f2' },
  ALTA:     { cor: '#92400e', bg: '#fef3c7' },
  MODERADA: { cor: '#1e40af', bg: '#eff6ff' },
  BAIXA:    { cor: '#4b5563', bg: '#f9fafb' },
}

const statusConfig: Record<string, { label: string; cor: string; bg: string; icone: any }> = {
  PENDENTE:     { label: 'Pendente',     cor: '#4b5563', bg: '#f3f4f6',  icone: Clock },
  EM_ANDAMENTO: { label: 'Em andamento', cor: '#1d4ed8', bg: '#eff6ff',  icone: Clock },
  CONCLUIDA:    { label: 'Concluída',    cor: '#15803d', bg: '#f0fdf4',  icone: CheckCircle },
  CANCELADA:    { label: 'Cancelada',    cor: '#6b7280', bg: '#f9fafb',  icone: XCircle },
}

const origemLabel: Record<string, string> = {
  DOCUMENTAL:    'Documental',
  FINANCEIRA:    'Financeira',
  INTEGRADA:     'Integrada',
  NC_REGULATORIA:'NC Regulatória',
  MANUAL:        'Manual',
}

const agentesOpcoes = [
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'MEDICO',         label: 'Médico' },
  { value: 'ENFERMAGEM',     label: 'Enfermagem' },
  { value: 'GESTAO',         label: 'Gestão' },
  { value: 'QUALIDADE',      label: 'Qualidade' },
  { value: 'TI',             label: 'TI' },
]

function formatarData(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ─── Modal de detalhe/atualização ─────────────────────────────────────────────

function ModalAcao({ acao, isLC, onClose, onAtualizado }: {
  acao: AcaoCorretiva
  isLC: boolean
  onClose: () => void
  onAtualizado: () => void
}) {
  const [novoStatus, setNovoStatus] = useState(acao.status)
  const [agentes, setAgentes] = useState<string[]>(acao.agentes_responsaveis ?? [])
  const [evidencia, setEvidencia] = useState(acao.evidencia_texto ?? '')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [historico, setHistorico] = useState(acao.historico ?? [])

  const prioridade = prioridadeConfig[acao.prioridade] ?? prioridadeConfig.BAIXA
  const statusAtual = statusConfig[acao.status] ?? statusConfig.PENDENTE

  // Transições permitidas por perfil
  const transicoesCliente: Record<string, string[]> = {
    PENDENTE:     ['EM_ANDAMENTO'],
    EM_ANDAMENTO: ['CONCLUIDA'],
    CONCLUIDA:    [],
    CANCELADA:    [],
  }
  const transicoesLC: Record<string, string[]> = {
    PENDENTE:     ['EM_ANDAMENTO', 'CANCELADA'],
    EM_ANDAMENTO: ['CONCLUIDA', 'CANCELADA'],
    CONCLUIDA:    ['EM_ANDAMENTO'],
    CANCELADA:    [],
  }
  const proximosStatus = isLC
    ? (transicoesLC[acao.status] ?? [])
    : (transicoesCliente[acao.status] ?? [])

  function toggleAgente(agente: string) {
    setAgentes(prev =>
      prev.includes(agente) ? prev.filter(a => a !== agente) : [...prev, agente]
    )
  }

  async function salvar() {
    setSalvando(true)
    try {
      const body: Record<string, any> = { evidencia_texto: evidencia, observacao }
      if (novoStatus !== acao.status) body.novo_status = novoStatus
      if (isLC) body.agentes = agentes

      const res = await fetch(`/api/acoes-corretivas/${acao.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setHistorico(data.acao.historico ?? [])
        onAtualizado()
        onClose()
      }
    } finally {
      setSalvando(false)
    }
  }

  const mudou = novoStatus !== acao.status || evidencia !== (acao.evidencia_texto ?? '') ||
    JSON.stringify(agentes.sort()) !== JSON.stringify((acao.agentes_responsaveis ?? []).sort())

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: '680px', maxHeight: '92vh', overflow: 'auto', padding: '1.5rem' }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: prioridade.bg, color: prioridade.cor, fontWeight: 500 }}>
                {acao.prioridade}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: statusAtual.bg, color: statusAtual.cor }}>
                {statusAtual.label}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {origemLabel[acao.origem] ?? acao.origem}
              </span>
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 500 }}>{acao.titulo}</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {acao.descricao}
            </p>
          </div>
          <button onClick={onClose} style={{ marginLeft: '12px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', flexShrink: 0 }}>✕</button>
        </div>

        {/* Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem', padding: '10px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
          <div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Prazo</p>
            <p style={{ fontSize: '13px', fontWeight: 500 }}>{formatarData(acao.prazo)}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Cliente</p>
            <p style={{ fontSize: '13px', fontWeight: 500 }}>{acao.cliente?.nome}</p>
          </div>
          {acao.concluida_at && (
            <div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Concluída em</p>
              <p style={{ fontSize: '13px', fontWeight: 500 }}>{formatarData(acao.concluida_at)}</p>
            </div>
          )}
        </div>

        {/* Responsáveis (só LC pode alterar) */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={13} /> Responsáveis pela execução
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {agentesOpcoes.map(op => {
              const sel = agentes.includes(op.value)
              return (
                <button
                  key={op.value}
                  onClick={() => isLC && toggleAgente(op.value)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    border: `1px solid ${sel ? '#1e40af' : 'var(--color-border-tertiary)'}`,
                    background: sel ? '#eff6ff' : 'transparent',
                    color: sel ? '#1e40af' : 'var(--color-text-secondary)',
                    fontSize: '12px',
                    cursor: isLC ? 'pointer' : 'default',
                    fontWeight: sel ? 500 : 400,
                    opacity: !isLC && !sel ? 0.5 : 1,
                  }}
                >
                  {op.label}
                </button>
              )
            })}
          </div>
          {!isLC && agentes.length === 0 && (
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Nenhum responsável definido ainda.</p>
          )}
        </div>

        {/* Atualização de status */}
        {proximosStatus.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>Atualizar status</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setNovoStatus(acao.status)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--border-radius-md)',
                  border: `1px solid ${novoStatus === acao.status ? '#1e40af' : 'var(--color-border-tertiary)'}`,
                  background: novoStatus === acao.status ? '#eff6ff' : 'transparent',
                  color: novoStatus === acao.status ? '#1e40af' : 'var(--color-text-secondary)',
                  fontSize: '12px', cursor: 'pointer',
                }}
              >
                Manter: {statusConfig[acao.status]?.label}
              </button>
              {proximosStatus.map(s => (
                <button
                  key={s}
                  onClick={() => setNovoStatus(s)}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--border-radius-md)',
                    border: `1px solid ${novoStatus === s ? (statusConfig[s]?.cor ?? '#1e40af') : 'var(--color-border-tertiary)'}`,
                    background: novoStatus === s ? `${statusConfig[s]?.bg}` : 'transparent',
                    color: novoStatus === s ? statusConfig[s]?.cor : 'var(--color-text-secondary)',
                    fontSize: '12px', cursor: 'pointer', fontWeight: novoStatus === s ? 500 : 400,
                  }}
                >
                  → {statusConfig[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Evidência */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
            Evidência / relato da execução
          </label>
          <textarea
            value={evidencia}
            onChange={e => setEvidencia(e.target.value)}
            rows={3}
            placeholder="Descreva o que foi feito, anexos disponíveis, resultado..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', fontSize: '12px', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        {/* Observação da atualização */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
            Observação desta atualização (opcional)
          </label>
          <input
            type="text"
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder="Ex: Reunião realizada em 12/05, equipe alinhada..."
            style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', fontSize: '12px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Histórico */}
        {historico.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>Histórico de atualizações</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflow: 'auto' }}>
              {[...historico].reverse().map((h, i) => (
                <div key={i} style={{ padding: '8px 10px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 500 }}>{h.usuario_nome}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{new Date(h.data).toLocaleString('pt-BR')}</span>
                  </div>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{h.status_anterior} → {h.novo_status}</span>
                  {h.observacao && <p style={{ marginTop: '2px', color: 'var(--color-text-primary)' }}>{h.observacao}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botões */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>
            Fechar
          </button>
          {mudou && (
            <button
              onClick={salvar}
              disabled={salvando}
              style={{ padding: '9px 20px', borderRadius: 'var(--border-radius-md)', background: '#1e40af', color: '#fff', border: 'none', cursor: salvando ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: salvando ? 0.7 : 1 }}
            >
              {salvando ? 'Salvando...' : 'Salvar atualização'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AcoesPage() {
  const { data: session } = useSession()
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user?.perfil ?? '')

  const [acoes, setAcoes] = useState<AcaoCorretiva[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [filtroOrigem, setFiltroOrigem] = useState('TODOS')
  const [acaoAberta, setAcaoAberta] = useState<AcaoCorretiva | null>(null)

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch('/api/acoes-corretivas')
      const data = await res.json()
      setAcoes(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function abrirDetalhe(acao: AcaoCorretiva) {
    const res = await fetch(`/api/acoes-corretivas/${acao.id}`)
    const data = await res.json()
    setAcaoAberta(data)
  }

  useEffect(() => { carregar() }, [])

  const acoesFiltradas = acoes.filter(a => {
    if (filtroStatus !== 'TODOS' && a.status !== filtroStatus) return false
    if (filtroOrigem !== 'TODOS' && a.origem !== filtroOrigem) return false
    return true
  })

  const resumo = {
    total: acoes.length,
    pendente: acoes.filter(a => a.status === 'PENDENTE').length,
    andamento: acoes.filter(a => a.status === 'EM_ANDAMENTO').length,
    concluida: acoes.filter(a => a.status === 'CONCLUIDA').length,
    critica: acoes.filter(a => a.prioridade === 'CRITICA' && a.status !== 'CONCLUIDA').length,
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Ações corretivas</h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          {resumo.total} ações · {resumo.critica > 0 ? `${resumo.critica} críticas em aberto` : 'nenhuma crítica em aberto'}
        </p>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', val: resumo.total, cor: '#1e40af', bg: '#eff6ff' },
          { label: 'Pendentes', val: resumo.pendente, cor: '#4b5563', bg: '#f3f4f6' },
          { label: 'Em andamento', val: resumo.andamento, cor: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Concluídas', val: resumo.concluida, cor: '#15803d', bg: '#f0fdf4' },
        ].map(c => (
          <div key={c.label} style={{ padding: '14px', background: c.bg, borderRadius: 'var(--border-radius-lg)', border: `1px solid ${c.cor}22` }}>
            <p style={{ fontSize: '22px', fontWeight: 500, color: c.cor }}>{c.val}</p>
            <p style={{ fontSize: '11px', color: c.cor, opacity: 0.8 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['TODOS', 'PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)} style={{
              padding: '5px 10px', borderRadius: 'var(--border-radius-md)', fontSize: '11px',
              border: `1px solid ${filtroStatus === s ? '#1e40af' : 'var(--color-border-tertiary)'}`,
              background: filtroStatus === s ? '#eff6ff' : 'transparent',
              color: filtroStatus === s ? '#1e40af' : 'var(--color-text-secondary)',
              cursor: 'pointer', fontWeight: filtroStatus === s ? 500 : 400,
            }}>
              {s === 'TODOS' ? 'Todos' : statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['TODOS', 'NC_REGULATORIA', 'DOCUMENTAL', 'FINANCEIRA', 'MANUAL'].map(o => (
            <button key={o} onClick={() => setFiltroOrigem(o)} style={{
              padding: '5px 10px', borderRadius: 'var(--border-radius-md)', fontSize: '11px',
              border: `1px solid ${filtroOrigem === o ? '#7e22ce' : 'var(--color-border-tertiary)'}`,
              background: filtroOrigem === o ? '#f3e8ff' : 'transparent',
              color: filtroOrigem === o ? '#7e22ce' : 'var(--color-text-secondary)',
              cursor: 'pointer', fontWeight: filtroOrigem === o ? 500 : 400,
            }}>
              {o === 'TODOS' ? 'Todas origens' : origemLabel[o] ?? o}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Carregando...</p>
      ) : acoesFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-lg)' }}>
          <CheckCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Nenhuma ação encontrada.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {acoesFiltradas.map(acao => {
            const prioridade = prioridadeConfig[acao.prioridade] ?? prioridadeConfig.BAIXA
            const status = statusConfig[acao.status] ?? statusConfig.PENDENTE
            const Icone = status.icone
            const vencida = acao.status !== 'CONCLUIDA' && acao.status !== 'CANCELADA' &&
              new Date(acao.prazo) < new Date()

            return (
              <div
                key={acao.id}
                onClick={() => abrirDetalhe(acao)}
                style={{
                  background: 'var(--color-background-primary)',
                  border: `1px solid ${vencida ? '#fca5a5' : 'var(--color-border-tertiary)'}`,
                  borderLeft: `3px solid ${prioridade.cor}`,
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '999px', background: prioridade.bg, color: prioridade.cor, fontWeight: 500 }}>
                      {acao.prioridade}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      {origemLabel[acao.origem] ?? acao.origem}
                    </span>
                    {acao.agentes_responsaveis && acao.agentes_responsaveis.length > 0 && (
                      <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Users size={10} />
                        {acao.agentes_responsaveis.map(a =>
                          agentesOpcoes.find(o => o.value === a)?.label ?? a
                        ).join(', ')}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {acao.titulo}
                  </p>
                  {isLC && (
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {acao.cliente?.nome}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: vencida ? '#b91c1c' : 'var(--color-text-secondary)', fontWeight: vencida ? 500 : 400 }}>
                      {vencida ? '⚠ Vencida' : 'Prazo'}
                    </p>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: vencida ? '#b91c1c' : 'var(--color-text-primary)' }}>
                      {formatarData(acao.prazo)}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: status.bg, color: status.cor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icone size={11} />
                    {status.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {acaoAberta && (
        <ModalAcao
          acao={acaoAberta}
          isLC={isLC}
          onClose={() => setAcaoAberta(null)}
          onAtualizado={carregar}
        />
      )}
    </div>
  )
}
