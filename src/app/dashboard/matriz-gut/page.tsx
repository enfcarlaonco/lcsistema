'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { CheckCircle, ChevronRight } from 'lucide-react'
import { corGUT, bgGUT, prioridadeGut, STATUS_GUT_CONFIG } from '@/lib/matriz-gut'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface MatrizGutItem {
  id: string
  problema: string
  area?: string
  gravidade: number
  urgencia: number
  tendencia: number
  gut_score: number
  responsavel?: string
  status: string
  origem: string
  cliente: { id: string; nome: string }
}

const STATUS_FECHADOS = ['FINALIZADO', 'CANCELADO']

function statusInfo(status: string) {
  return STATUS_GUT_CONFIG[status] ?? { label: status, cor: '#6b7280', bg: '#f3f4f6' }
}

// ─── Página ─────────────────────────────────────────────────────────────────

export default function MatrizGutPage() {
  const { data: session } = useSession()
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user?.perfil ?? '')

  const [itens, setItens] = useState<MatrizGutItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('ABERTOS')

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch('/api/matriz-gut')
      const data = await res.json()
      setItens(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const itensFiltrados = itens.filter(i => {
    if (filtroStatus === 'ABERTOS') return !STATUS_FECHADOS.includes(i.status)
    if (filtroStatus === 'TODOS') return true
    return i.status === filtroStatus
  })

  const resumo = {
    total: itens.length,
    criticos: itens.filter(i => i.gut_score >= 61 && !STATUS_FECHADOS.includes(i.status)).length,
    andamento: itens.filter(i => i.status === 'EM_ANDAMENTO').length,
    finalizados: itens.filter(i => i.status === 'FINALIZADO').length,
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Matriz GUT</h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          Priorização de problemas por Gravidade × Urgência × Tendência{isLC ? ' — todos os clientes' : ''}
        </p>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total de itens', val: resumo.total, cor: '#1e40af', bg: '#eff6ff' },
          { label: 'Alta/Muito alta em aberto (GUT ≥ 61)', val: resumo.criticos, cor: '#b91c1c', bg: '#fef2f2' },
          { label: 'Em andamento', val: resumo.andamento, cor: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Finalizados', val: resumo.finalizados, cor: '#15803d', bg: '#f0fdf4' },
        ].map(c => (
          <div key={c.label} style={{ padding: '14px', background: c.bg, borderRadius: 'var(--border-radius-lg)', border: `1px solid ${c.cor}22` }}>
            <p style={{ fontSize: '22px', fontWeight: 500, color: c.cor }}>{c.val}</p>
            <p style={{ fontSize: '11px', color: c.cor, opacity: 0.8 }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['ABERTOS', 'TODOS', ...Object.keys(STATUS_GUT_CONFIG)].map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} style={{
            padding: '5px 10px', borderRadius: 'var(--border-radius-md)', fontSize: '11px',
            border: `1px solid ${filtroStatus === s ? '#1e40af' : 'var(--color-border-tertiary)'}`,
            background: filtroStatus === s ? '#eff6ff' : 'transparent',
            color: filtroStatus === s ? '#1e40af' : 'var(--color-text-secondary)',
            cursor: 'pointer', fontWeight: filtroStatus === s ? 500 : 400,
          }}>
            {s === 'ABERTOS' ? 'Em aberto' : s === 'TODOS' ? 'Todos' : STATUS_GUT_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Carregando...</p>
      ) : itensFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-lg)' }}>
          <CheckCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Nenhum item encontrado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {itensFiltrados.map(item => {
            const status = statusInfo(item.status)
            const prioridade = prioridadeGut(item.gut_score)
            return (
              <Link
                key={item.id}
                href={`/dashboard/clientes/${item.cliente.id}?aba=acoes`}
                style={{
                  background: 'var(--color-background-primary)',
                  border: '1px solid var(--color-border-tertiary)',
                  borderLeft: `3px solid ${corGUT(item.gut_score)}`,
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {isLC && (
                      <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {item.cliente.nome}
                      </span>
                    )}
                    {item.area && (
                      <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>· {item.area}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.problema}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '4px', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                    <span>G{item.gravidade}</span>·<span>U{item.urgencia}</span>·<span>T{item.tendencia}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: bgGUT(item.gut_score), color: corGUT(item.gut_score) }}>
                    {item.gut_score}
                  </span>
                  <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: prioridade.bg, color: prioridade.cor }}>
                    {prioridade.label}
                  </span>
                  <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '999px', background: status.bg, color: status.cor }}>
                    {status.label}
                  </span>
                  <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)' }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
