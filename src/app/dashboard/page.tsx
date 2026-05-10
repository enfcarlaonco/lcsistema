import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatCurrency, formatDate, getPrioridadeColor } from '@/lib/utils'
import { ArrowRight, Users, AlertTriangle, Clock, FileText, TrendingUp, CheckCircle, Activity, ClipboardList, BarChart2 } from 'lucide-react'

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
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

  const [
    clientesAtivos,
    contratosEmAnalise,
    acoesCriticas,
    documentosPendentes,
    questionariosAtivos,
    sessoesDoMes,
    avaliacoesDocumentais,
  ] = await Promise.all([
    // Clientes com contrato ativo
    prisma.cliente.findMany({
      where: { contratos: { some: { status: 'ATIVO' } } },
      include: {
        contratos: { where: { status: 'ATIVO' }, take: 1, orderBy: { data_inicio: 'desc' } },
        questionarios: { orderBy: { created_at: 'desc' }, take: 1, select: { id: true, pct_completo: true, status: true } },
        acoes_corretivas: { where: { status: { not: 'CONCLUIDA' }, prioridade: 'CRITICA' }, select: { id: true } },
      },
      orderBy: { nome: 'asc' },
    }),

    // Contratos em análise
    prisma.contrato.count({ where: { status: 'SUSPENSO' } }),

    // Ações críticas abertas
    prisma.acaoCorretiva.findMany({
      where: { status: { not: 'CONCLUIDA' }, prioridade: 'CRITICA' },
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { prazo: 'asc' },
      take: 6,
    }),

    // Documentos aguardando avaliação
    prisma.documentoEnviado.count({ where: { status_documento: 'ENVIADO' } }),

    // Questionários em andamento por cliente
    prisma.questionario.findMany({
      where: { status: { in: ['EM_ANDAMENTO', 'NAO_INICIADO'] } },
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { updated_at: 'desc' },
    }),

    // Sessões de consultoria do mês por contrato
    prisma.sessaoConsultoria.findMany({
      where: { data: { gte: inicioMes, lte: fimMes } },
      include: { contrato: { include: { cliente: { select: { id: true, nome: true } } } } },
    }),

    // Avaliações documentais por cliente
    prisma.avaliacaoDocumento.findMany({
      include: { documento_enviado: { include: { cliente: { select: { id: true, nome: true } } } } },
      orderBy: { data_avaliacao: 'desc' },
    }),
  ])

  // Calcula score de andamento por cliente (% horas concluídas)
  const sessoesPorContrato = await prisma.sessaoConsultoria.groupBy({
    by: ['contrato_id'],
    _sum: { horas: true },
  })

  const andamentoPorCliente = clientesAtivos.map(c => {
    const contrato = c.contratos[0]
    if (!contrato) return { clienteId: c.id, nome: c.nome, pct: 0 }
    const horasConcluidas = sessoesPorContrato.find(s => s.contrato_id === contrato.id)?._sum.horas ?? 0
    const pct = contrato.total_horas > 0 ? Math.round((Number(horasConcluidas) / contrato.total_horas) * 100) : 0
    return { clienteId: c.id, nome: c.nome, pct: Math.min(pct, 100) }
  })

  // Horas do mês por cliente
  const horasDoMesPorCliente = clientesAtivos.map(c => {
    const contrato = c.contratos[0]
    if (!contrato) return { clienteId: c.id, nome: c.nome, horas: 0 }
    const horas = sessoesDoMes
      .filter(s => s.contrato_id === contrato.id)
      .reduce((sum, s) => sum + s.horas, 0)
    return { clienteId: c.id, nome: c.nome, horas: Math.round(horas * 10) / 10 }
  }).sort((a, b) => b.horas - a.horas)

  const totalHorasMes = horasDoMesPorCliente.reduce((s, c) => s + c.horas, 0)

  // Score documental médio por cliente
  const scoreDocPorCliente = clientesAtivos.map(c => {
    const avsCliente = avaliacoesDocumentais.filter(
      av => av.documento_enviado?.cliente?.id === c.id
    )
    const media = avsCliente.length > 0
      ? Math.round(avsCliente.reduce((s, av) => s + av.score_final, 0) / avsCliente.length)
      : null
    return { clienteId: c.id, nome: c.nome, score: media, total: avsCliente.length }
  }).sort((a, b) => (a.score ?? 0) - (b.score ?? 0))

  const scoreMedioGeral = scoreDocPorCliente.filter(c => c.score !== null).length > 0
    ? Math.round(scoreDocPorCliente.filter(c => c.score !== null).reduce((s, c) => s + (c.score ?? 0), 0) / scoreDocPorCliente.filter(c => c.score !== null).length)
    : null

  // Financeiro LC
  const contratosAtivos = await prisma.contrato.findMany({
    where: { status: 'ATIVO' },
    select: { valor_total: true, data_inicio: true, data_fim: true, total_horas: true },
  })
  const receitaMensal = contratosAtivos.reduce((s, c) => {
    const meses = Math.max(1, Math.round((new Date(c.data_fim).getTime() - new Date(c.data_inicio).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    return s + Number(c.valor_total) / meses
  }, 0)
  const totalContratosValor = contratosAtivos.reduce((s, c) => s + Number(c.valor_total), 0)

  // Questionários por cliente
  const questPorCliente = clientesAtivos.map(c => {
    const q = c.questionarios[0]
    return { clienteId: c.id, nome: c.nome, pct: q?.pct_completo ?? 0, status: q?.status ?? 'NAO_INICIADO', id: q?.id }
  })
  const totalQuestAndamento = questPorCliente.filter(q => q.status === 'EM_ANDAMENTO').length

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard — LC Saúde</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── PRODUTIVIDADE ─────────────────────────────────────────────── */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Produtividade</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Clientes ativos</p>
            <Users size={14} className="text-brand-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{clientesAtivos.length}</p>
          <Link href="/dashboard/clientes" className="text-xs text-brand-600 mt-1 flex items-center gap-1 hover:underline">
            Ver todos <ArrowRight size={10} />
          </Link>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Andamento médio</p>
            <Activity size={14} className="text-brand-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {andamentoPorCliente.length > 0
              ? `${Math.round(andamentoPorCliente.reduce((s, a) => s + a.pct, 0) / andamentoPorCliente.length)}%`
              : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">das horas de consultoria</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Ações críticas abertas</p>
            <AlertTriangle size={14} className="text-danger-400" />
          </div>
          <p className="text-2xl font-semibold text-danger-600">{acoesCriticas.length}</p>
          <Link href="/dashboard/acoes" className="text-xs text-brand-600 mt-1 flex items-center gap-1 hover:underline">
            Ver todas <ArrowRight size={10} />
          </Link>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Propostas em análise</p>
            <Clock size={14} className="text-warning-400" />
          </div>
          <p className="text-2xl font-semibold text-warning-600">{contratosEmAnalise}</p>
          <p className="text-xs text-gray-400 mt-1">aguardando aprovação</p>
        </div>
      </div>

      {/* ── FINANCEIRO LC ─────────────────────────────────────────────── */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Financeiro LC Saúde</p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Receita mensal estimada</p>
            <TrendingUp size={14} className="text-success-500" />
          </div>
          <p className="text-2xl font-semibold text-success-600">{formatCurrency(receitaMensal)}</p>
          <p className="text-xs text-gray-400 mt-1">base contratos ativos</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Valor total em contratos</p>
            <FileText size={14} className="text-brand-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalContratosValor)}</p>
          <p className="text-xs text-gray-400 mt-1">{contratosAtivos.length} contrato{contratosAtivos.length !== 1 ? 's' : ''} ativo{contratosAtivos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Documentos p/ avaliar</p>
            <FileText size={14} className="text-warning-400" />
          </div>
          <p className="text-2xl font-semibold text-warning-600">{documentosPendentes}</p>
          <Link href="/dashboard/documentos" className="text-xs text-brand-600 mt-1 flex items-center gap-1 hover:underline">
            Ver documentos <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {/* ── CARDS A, B, C + AÇÕES CRÍTICAS ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Coluna esquerda — cards A, B, C empilhados */}
        <div className="space-y-4">

          {/* A — Questionários em andamento */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">A</span>
                <h2 className="text-sm font-medium text-gray-700">Questionários em andamento</h2>
              </div>
              <Link href="/dashboard/questionarios" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                Ver todos <ArrowRight size={10} />
              </Link>
            </div>
            <div className="space-y-2">
              {questPorCliente.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Nenhum questionário iniciado.</p>
              ) : (
                questPorCliente.map(q => (
                  <div key={q.clienteId} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <p className="text-xs text-gray-700 truncate flex-1">{q.nome}</p>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${q.pct}%`,
                            background: q.pct >= 80 ? '#16a34a' : q.pct >= 40 ? '#d97706' : '#3b82f6'
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-8 text-right">{q.pct}%</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        q.status === 'EM_ANDAMENTO' ? 'bg-brand-50 text-brand-600' :
                        q.status === 'VALIDADO' ? 'bg-success-50 text-success-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {q.status === 'EM_ANDAMENTO' ? 'Em andamento' :
                         q.status === 'VALIDADO' ? 'Validado' :
                         q.status === 'NAO_INICIADO' ? 'Não iniciado' : q.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* B — Horas de consultoria este mês */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">B</span>
                <h2 className="text-sm font-medium text-gray-700">Horas de consultoria — {hoje.toLocaleDateString('pt-BR', { month: 'long' })}</h2>
              </div>
              <span className="text-xs text-gray-400">{Math.round(totalHorasMes * 10) / 10}h total</span>
            </div>
            <div className="space-y-2">
              {horasDoMesPorCliente.length === 0 || totalHorasMes === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Nenhuma sessão registrada este mês.</p>
              ) : (
                horasDoMesPorCliente.map(c => (
                  <div key={c.clienteId} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <p className="text-xs text-gray-700 truncate flex-1">{c.nome}</p>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-400 rounded-full"
                          style={{ width: `${Math.round((c.horas / Math.max(...horasDoMesPorCliente.map(x => x.horas))) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-10 text-right">{c.horas}h</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* C — Score documental médio */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">C</span>
                <h2 className="text-sm font-medium text-gray-700">Score documental médio</h2>
              </div>
              <Link href="/dashboard/documentos" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                Ver todos <ArrowRight size={10} />
              </Link>
            </div>
            <div className="space-y-2">
              {scoreDocPorCliente.every(c => c.score === null) ? (
                <p className="text-xs text-gray-400 text-center py-2">Nenhum documento avaliado ainda.</p>
              ) : (
                scoreDocPorCliente.map(c => {
                  const cor = c.score === null ? '#9ca3af' : c.score >= 85 ? '#16a34a' : c.score >= 60 ? '#d97706' : '#dc2626'
                  return (
                    <div key={c.clienteId} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <p className="text-xs text-gray-700 truncate flex-1">{c.nome}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-gray-400">{c.total} doc{c.total !== 1 ? 's' : ''}</span>
                        <span className="text-xs font-semibold w-10 text-right" style={{ color: cor }}>
                          {c.score !== null ? `${c.score}%` : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita — Ações críticas */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Ações críticas — prazo mais próximo</h2>
            <Link href="/dashboard/acoes" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={10} />
            </Link>
          </div>
          {acoesCriticas.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle size={24} className="mx-auto text-success-600 mb-2" />
              <p className="text-sm text-gray-400">Nenhuma ação crítica em aberto</p>
            </div>
          ) : (
            <div className="space-y-2">
              {acoesCriticas.map(acao => {
                const vencida = new Date(acao.prazo) < hoje
                return (
                  <div key={acao.id} className={`p-3 rounded-lg ${vencida ? 'bg-danger-50' : 'bg-warning-50'}`}>
                    <p className="text-xs font-medium text-danger-600 mb-0.5">{acao.cliente.nome}</p>
                    <p className="text-sm text-gray-900 truncate">{acao.titulo}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPrioridadeColor(acao.prioridade)}`}>
                        {acao.prioridade}
                      </span>
                      <p className={`text-xs font-medium ${vencida ? 'text-danger-600' : 'text-gray-400'}`}>
                        {vencida ? '⚠ Vencida · ' : 'Prazo: '}{formatDate(acao.prazo)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
