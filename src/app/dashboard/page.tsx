import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatCurrency, formatPercent, getScoreBg, getPrioridadeColor } from '@/lib/utils'
import { Users, TrendingDown, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user.perfil ?? '')

  // ── Métricas gerais ──
  const [totalClientes, totalAcoes, dadosRecentes] = await Promise.all([
    prisma.cliente.count({ where: isLC ? undefined : { id: session?.user.clienteId ?? undefined } }),

    prisma.acaoCorretiva.count({
      where: {
        status: { not: 'CONCLUIDA' },
        prioridade: { in: ['CRITICA', 'ALTA'] },
        ...(isLC ? {} : { cliente_id: session?.user.clienteId ?? undefined }),
      }
    }),

    prisma.dadosFinanceiros.findMany({
      where: isLC ? {} : { cliente_id: session?.user.clienteId ?? undefined },
      include: {
        cliente: { select: { id: true, nome: true } },
        indicadores: true,
        score: true,
        perdas: true,
      },
      orderBy: { mes_referencia: 'desc' },
      take: isLC ? 10 : 3,
    }),
  ])

  const perdaTotal = dadosRecentes.reduce((sum, d) =>
    sum + d.perdas.reduce((s, p) => s + Number(p.valor_estimado), 0), 0)

  const scoresMedio = dadosRecentes.length > 0
    ? Math.round(dadosRecentes.reduce((s, d) => s + (d.score?.score_final ?? 0), 0) / dadosRecentes.length)
    : null

  const acoesCriticas = await prisma.acaoCorretiva.findMany({
    where: {
      status: { not: 'CONCLUIDA' },
      prioridade: 'CRITICA',
      ...(isLC ? {} : { cliente_id: session?.user.clienteId ?? undefined }),
    },
    include: { cliente: { select: { id: true, nome: true } } },
    orderBy: { prazo: 'asc' },
    take: 5,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {isLC ? 'Dashboard executivo — LC Saúde' : `Painel — ${session?.user.clienteNome}`}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral do ciclo atual</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">{isLC ? 'Clientes ativos' : 'Contratos ativos'}</p>
          <p className="text-2xl font-semibold text-gray-900">{totalClientes}</p>
          <Link href="/dashboard/clientes" className="text-xs text-brand-600 mt-1 flex items-center gap-1 hover:underline">
            Ver todos <ArrowRight size={10} />
          </Link>
        </div>

        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Score financeiro médio</p>
          {scoresMedio !== null ? (
            <p className={`text-2xl font-semibold ${getScoreBg(scoresMedio)} px-2 rounded-lg inline-block`}>
              {scoresMedio}
            </p>
          ) : (
            <p className="text-2xl font-semibold text-gray-300">—</p>
          )}
          <p className="text-xs text-gray-400 mt-1">últimos {dadosRecentes.length} registros</p>
        </div>

        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Perda financeira identificada</p>
          <p className="text-2xl font-semibold text-danger-600">{formatCurrency(perdaTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">/mês estimado</p>
        </div>

        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Ações críticas em aberto</p>
          <p className="text-2xl font-semibold text-warning-600">{totalAcoes}</p>
          <Link href="/dashboard/acoes" className="text-xs text-brand-600 mt-1 flex items-center gap-1 hover:underline">
            Ver ações <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Últimos dados financeiros */}
        <div className="card">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {isLC ? 'Últimos registros financeiros' : 'Seus indicadores recentes'}
          </h2>
          <div className="space-y-3">
            {dadosRecentes.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  {isLC && <p className="text-sm font-medium text-gray-900">{d.cliente.nome}</p>}
                  <p className="text-xs text-gray-400">
                    {new Date(d.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {d.indicadores && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Margem</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatPercent(Number(d.indicadores.margem_percentual))}
                      </p>
                    </div>
                  )}
                  {d.score && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreBg(d.score.score_final)}`}>
                      {d.score.score_final}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {dadosRecentes.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                Nenhum dado financeiro registrado ainda.
              </p>
            )}
          </div>
        </div>

        {/* Ações críticas */}
        <div className="card">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Ações críticas — prazo mais próximo</h2>
          <div className="space-y-2">
            {acoesCriticas.map((acao) => (
              <div key={acao.id} className="p-3 bg-danger-50 rounded-lg">
                {isLC && (
                  <p className="text-xs font-medium text-danger-600 mb-0.5">{acao.cliente.nome}</p>
                )}
                <p className="text-sm text-gray-900">{acao.titulo}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getPrioridadeColor(acao.prioridade)}`}>
                    {acao.prioridade}
                  </span>
                  <p className="text-xs text-gray-400">
                    Prazo: {new Date(acao.prazo).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
            {acoesCriticas.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle size={24} className="mx-auto text-success-600 mb-2" />
                <p className="text-sm text-gray-400">Nenhuma ação crítica em aberto</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
