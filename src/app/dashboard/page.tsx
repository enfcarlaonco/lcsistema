import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate, getPrioridadeColor } from '@/lib/utils'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user.perfil ?? '')

  // ── DASHBOARD CLIENTE ─────────────────────────────────────────────────────
  if (!isLC) {
    const clienteId = session?.user.clienteId ?? ''
    const [acoes, documentos, ncs] = await Promise.all([
      prisma.acaoCorretiva.findMany({
        where: { cliente_id: clienteId, status: { not: 'CONCLUIDA' } },
        orderBy: [{ prioridade: 'asc' }, { prazo: 'asc' }],
        take: 5,
      }),
      prisma.documentoEnviado.count({ where: { cliente_id: clienteId } }),
      prisma.naoConformidade.count({ where: { cliente_id: clienteId, status: { not: 'RESOLVIDA' } } }),
    ])
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Painel — {session?.user.clienteNome}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral da sua consultoria</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Ações em aberto</p>
            <p className="text-2xl font-semibold text-warning-600">{acoes.length}</p>
            <Link href="/dashboard/acoes" className="text-xs text-brand-600 mt-1 flex items-center gap-1 hover:underline">Ver ações <ArrowRight size={10} /></Link>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Documentos enviados</p>
            <p className="text-2xl font-semibold text-gray-900">{documentos}</p>
            <Link href="/dashboard/documentos" className="text-xs text-brand-600 mt-1 flex items-center gap-1 hover:underline">Ver documentos <ArrowRight size={10} /></Link>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">NCs em aberto</p>
            <p className="text-2xl font-semibold text-danger-600">{ncs}</p>
          </div>
        </div>
        <div className="card">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Ações prioritárias</h2>
          {acoes.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle size={24} className="mx-auto text-success-600 mb-2" />
              <p className="text-sm text-gray-400">Nenhuma ação em aberto</p>
            </div>
          ) : (
            <div className="space-y-2">
              {acoes.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm text-gray-900">{a.titulo}</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPrioridadeColor(a.prioridade)}`}>{a.prioridade}</span>
                    <p className="text-xs text-gray-400">{formatDate(a.prazo)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── DASHBOARD LC SAÚDE ────────────────────────────────────────────────────
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const [
    clientesAtivos,
    contratosEncerrados,
    contratosAnalise,
    contratosNaoEfetivados,
    consultoresLC,
    sessoesPorContrato,
    acoesCriticasPorCliente,
    ncsPorCliente,
    horasPorConsultor,
    contratosAtivosLC,
  ] = await Promise.all([
    prisma.cliente.findMany({
      where: { contratos: { some: { status: 'ATIVO' } } },
      include: {
        contratos: { where: { status: 'ATIVO' }, take: 1, orderBy: { data_inicio: 'desc' } },
        questionarios: { orderBy: { created_at: 'desc' }, take: 1, select: { pct_completo: true, status: true } },
      },
      orderBy: { nome: 'asc' },
    }),
    prisma.contrato.findMany({
      where: { status: 'CONCLUIDO' },
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { data_fim: 'desc' },
    }),
    prisma.contrato.findMany({
      where: { status: 'SUSPENSO' },
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { created_at: 'desc' },
    }),
    prisma.contrato.findMany({
      where: { status: 'CANCELADO' },
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { updated_at: 'desc' },
    }),
    prisma.usuario.findMany({
      where: { perfil: { in: ['ADMIN_LC', 'CONSULTOR_LC'] }, ativo: true },
      select: { id: true, nome: true },
    }),
    prisma.sessaoConsultoria.groupBy({
      by: ['contrato_id'],
      _sum: { horas: true },
    }),
    prisma.acaoCorretiva.groupBy({
      by: ['cliente_id'],
      where: { prioridade: 'CRITICA', status: { not: 'CONCLUIDA' } },
      _count: { _all: true },
    }),
    prisma.naoConformidade.groupBy({
      by: ['cliente_id'],
      where: { status: { not: 'RESOLVIDA' } },
      _count: { _all: true },
    }),
    prisma.sessaoConsultoria.groupBy({
      by: ['consultor_id'],
      where: { data: { gte: inicioMes } },
      _sum: { horas: true },
    }),
    prisma.contrato.findMany({
      where: { status: 'ATIVO' },
      select: { id: true, cliente_id: true, responsavel_lc_id: true },
    }),
  ])

  // Monta linhas de clientes ativos
  const linhasClientes = clientesAtivos.map(c => {
    const contrato = c.contratos[0]
    if (!contrato) return null
    const horasRealizadas = Number(sessoesPorContrato.find(s => s.contrato_id === contrato.id)?._sum.horas ?? 0)
    const pctHoras = contrato.total_horas > 0
      ? Math.min(100, Math.round((horasRealizadas / contrato.total_horas) * 100))
      : 0
    const q = c.questionarios[0]
    return {
      id: c.id,
      nome: c.nome,
      tipo_servico: c.tipo_servico,
      pctHoras,
      horasRealizadas,
      totalHoras: contrato.total_horas,
      pctQuestionario: q?.pct_completo ?? 0,
      statusQuestionario: q?.status ?? 'NAO_INICIADO',
      acoesCriticas: acoesCriticasPorCliente.find(a => a.cliente_id === c.id)?._count._all ?? 0,
      ncsAbertas: ncsPorCliente.find(n => n.cliente_id === c.id)?._count._all ?? 0,
    }
  }).filter((c): c is NonNullable<typeof c> => c !== null)

  // Monta linhas de consultores
  const linhasConsultores = consultoresLC.map(consultor => {
    const clienteIds = contratosAtivosLC
      .filter(c => c.responsavel_lc_id === consultor.id)
      .map(c => c.cliente_id)
    return {
      id: consultor.id,
      nome: consultor.nome,
      clientes: clienteIds.length,
      ncsAbertas: ncsPorCliente
        .filter(n => clienteIds.includes(n.cliente_id))
        .reduce((s, n) => s + n._count._all, 0),
      acoesCriticas: acoesCriticasPorCliente
        .filter(a => clienteIds.includes(a.cliente_id))
        .reduce((s, a) => s + a._count._all, 0),
      horasMes: Math.round(Number(
        horasPorConsultor.find(h => h.consultor_id === consultor.id)?._sum.horas ?? 0
      ) * 10) / 10,
    }
  })

  function statusQBadge(status: string, pct: number) {
    if (status === 'NAO_INICIADO')        return { label: 'Não iniciado', bg: '#f3f4f6', color: '#6b7280' }
    if (status === 'EM_ANDAMENTO')        return { label: `${pct}%`,      bg: '#eff6ff', color: '#1d4ed8' }
    if (status === 'AGUARDANDO_VALIDACAO') return { label: 'Aguardando',  bg: '#fef3c7', color: '#92400e' }
    if (status === 'VALIDADO')            return { label: 'Validado',     bg: '#f0fdf4', color: '#15803d' }
    return { label: status, bg: '#f3f4f6', color: '#6b7280' }
  }

  const th = { padding: '8px 12px', fontWeight: 500, color: '#6b7280', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '2px solid #e5e7eb' }
  const td = { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 12, color: '#374151' }

  const secoes = [
    {
      titulo: 'Contratos encerrados',
      contratos: contratosEncerrados,
      cor: '#16a34a',
      bg: '#f9fafb',
      info: (c: typeof contratosEncerrados[0]) =>
        `Encerrado em ${new Date(c.data_fim).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`,
      empty: 'Nenhum contrato encerrado.',
    },
    {
      titulo: 'Contratos em análise',
      contratos: contratosAnalise,
      cor: '#d97706',
      bg: '#fffbeb',
      info: () => 'Aguardando aprovação',
      empty: 'Nenhum contrato em análise.',
    },
    {
      titulo: 'Contratos não efetivados',
      contratos: contratosNaoEfetivados,
      cor: '#9ca3af',
      bg: '#f9fafb',
      info: () => 'Não efetivado',
      empty: 'Nenhum registro.',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard — LC Saúde</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── CLIENTES ATIVOS ─────────────────────────────────────────────── */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700">
            Clientes ativos
            <span className="ml-2 text-xs font-normal text-gray-400">({linhasClientes.length})</span>
          </h2>
          <Link href="/dashboard/clientes" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={10} />
          </Link>
        </div>

        {linhasClientes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum cliente com contrato ativo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: 'left' }}>Serviço</th>
                  <th style={{ ...th, textAlign: 'left' }}>Tipo</th>
                  <th style={{ ...th, textAlign: 'center' }}>% Consultoria</th>
                  <th style={{ ...th, textAlign: 'center' }}>Horas realizadas</th>
                  <th style={{ ...th, textAlign: 'center' }}>Questionário</th>
                  <th style={{ ...th, textAlign: 'center' }}>NCs</th>
                  <th style={{ ...th, textAlign: 'center' }}>Ações críticas</th>
                </tr>
              </thead>
              <tbody>
                {linhasClientes.map((c, i) => {
                  const sq = statusQBadge(c.statusQuestionario, c.pctQuestionario)
                  return (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ ...td, textAlign: 'left' }}>
                        <Link href={`/dashboard/clientes/${c.id}`} style={{ color: '#1d4ed8', fontWeight: 500, textDecoration: 'none' }}>
                          {c.nome}
                        </Link>
                      </td>
                      <td style={{ ...td, textAlign: 'left', color: '#6b7280', fontSize: 11 }}>
                        {c.tipo_servico.replace(/_/g, ' ')}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          <div style={{ width: 56, height: 5, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
                            <div style={{ height: '100%', width: `${c.pctHoras}%`, background: c.pctHoras >= 80 ? '#16a34a' : c.pctHoras >= 40 ? '#d97706' : '#3b82f6', borderRadius: 999 }} />
                          </div>
                          <span style={{ fontWeight: 600, color: '#111827', minWidth: 28, fontSize: 12 }}>{c.pctHoras}%</span>
                        </div>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        {c.horasRealizadas}h / {c.totalHoras}h
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: sq.bg, color: sq.color, fontWeight: 500 }}>
                          {sq.label}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        {c.ncsAbertas > 0
                          ? <span style={{ fontWeight: 700, color: '#b91c1c', fontSize: 13 }}>{c.ncsAbertas}</span>
                          : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        {c.acoesCriticas > 0
                          ? <span style={{ fontWeight: 700, color: '#b91c1c', fontSize: 13 }}>{c.acoesCriticas}</span>
                          : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CONTROLE POR CONSULTOR ───────────────────────────────────────── */}
      {linhasConsultores.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Controle de entrega por consultor
            <span className="ml-2 text-xs font-normal text-gray-400">
              {hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>Consultor</th>
                <th style={{ ...th, textAlign: 'center' }}>Clientes ativos</th>
                <th style={{ ...th, textAlign: 'center' }}>Horas no mês</th>
                <th style={{ ...th, textAlign: 'center' }}>NCs abertas</th>
                <th style={{ ...th, textAlign: 'center' }}>Ações críticas</th>
              </tr>
            </thead>
            <tbody>
              {linhasConsultores.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 500, color: '#111827' }}>{c.nome}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{c.clientes}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{c.horasMes}h</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    {c.ncsAbertas > 0
                      ? <span style={{ fontWeight: 700, color: '#b91c1c' }}>{c.ncsAbertas}</span>
                      : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    {c.acoesCriticas > 0
                      ? <span style={{ fontWeight: 700, color: '#b91c1c' }}>{c.acoesCriticas}</span>
                      : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CONTRATOS ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {secoes.map(({ titulo, contratos, cor, bg, info, empty }) => (
          <div key={titulo} className="card">
            <div className="flex items-center gap-2 mb-3">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cor, flexShrink: 0 }} />
              <h2 className="text-sm font-medium text-gray-700 flex-1">{titulo}</h2>
              <span className="text-xs text-gray-400">{contratos.length}</span>
            </div>
            {contratos.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">{empty}</p>
            ) : (
              <div className="space-y-2">
                {contratos.map(c => (
                  <div key={c.id} style={{ padding: '8px 10px', background: bg, borderRadius: 8, borderLeft: `3px solid ${cor}` }}>
                    <Link href={`/dashboard/clientes/${c.cliente.id}`} style={{ fontSize: 12, fontWeight: 500, color: '#111827', textDecoration: 'none' }}>
                      {c.cliente.nome}
                    </Link>
                    <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{info(c as any)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
