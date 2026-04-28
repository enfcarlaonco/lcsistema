import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatCurrency, formatPercent, formatDate, getScoreBg, getPrioridadeColor } from '@/lib/utils'
import { EvolucaoFinanceira } from '@/components/charts/EvolucaoFinanceira'
import { ScoreGauge } from '@/components/charts/ScoreGauge'
import { Plus, FileText, BarChart2, ClipboardList, ChevronRight, AlertTriangle, Pencil } from 'lucide-react'

interface Props { params: { id: string } }

export default async function ClienteDetalhePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user.perfil ?? '')

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      modalidades: true,
      contratos: { orderBy: { data_inicio: 'desc' }, take: 1 },
      dados_financeiros: {
        orderBy: { mes_referencia: 'desc' },
        take: 6,
        include: { indicadores: true, score: true, perdas: true, oportunidades: true },
      },
      nao_conformidades: {
        where: { status: { not: 'RESOLVIDA' } },
        orderBy: { nivel: 'asc' },
        take: 5,
      },
      acoes_corretivas: {
        where: { status: { not: 'CONCLUIDA' } },
        orderBy: [{ prioridade: 'asc' }, { prazo: 'asc' }],
        take: 8,
      },
      questionarios: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  })

  if (!cliente) notFound()

  const ultimoDado = cliente.dados_financeiros[0]
  const contrato = cliente.contratos[0]

  // Dados para o gráfico de evolução
  const evolucao = [...cliente.dados_financeiros].reverse().map(d => ({
    mes: new Date(d.mes_referencia).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    margem:     Number(d.indicadores?.margem_percentual ?? 0),
    score:      d.score?.score_final ?? 0,
    taxa_glosa: Number(d.indicadores?.taxa_glosa ?? 0),
    custo_sessao: Number(d.indicadores?.custo_por_sessao ?? 0),
  }))

  const perdaTotalMes = ultimoDado?.perdas.reduce((s, p) => s + Number(p.valor_estimado), 0) ?? 0
  const ganhoTotalMes = ultimoDado?.oportunidades.reduce((s, o) => s + Number(o.ganho_estimado), 0) ?? 0

  const questionario = cliente.questionarios[0]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/clientes" className="text-xs text-gray-400 hover:text-gray-600">
              Clientes
            </Link>
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
          <div className="flex gap-2">
            <Link
              href={`/dashboard/clientes/${params.id}/editar`}
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <Pencil size={14} />
              Editar
            </Link>
            
            <Link
              href={`/dashboard/clientes/${params.id}/resultados`}
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <BarChart2 size={14} />
              Ver resultados
            </Link>
            <Link
              href={`/dashboard/clientes/${params.id}/financeiro`}
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <BarChart2 size={14} />
              Input financeiro
            </Link>
            {questionario ? (
              <Link
                href={`/dashboard/questionarios/${questionario.id}`}
                className="btn-secondary flex items-center gap-2 text-xs"
              >
                <ClipboardList size={14} />
                Ver questionário ({questionario.pct_completo}%)
              </Link>
            ) : (
              <Link
                href={`/dashboard/clientes/${params.id}/questionario/novo`}
                className="btn-primary flex items-center gap-2 text-xs"
              >
                <Plus size={14} />
                Iniciar diagnóstico M2
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Scores e KPIs principais */}
      {ultimoDado && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card flex flex-col items-center py-4">
            {ultimoDado.score && (
              <ScoreGauge score={ultimoDado.score.score_final} label="Score financeiro" />
            )}
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Margem operacional</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatPercent(Number(ultimoDado.indicadores?.margem_percentual ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">Meta: ≥ 15%</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Perda identificada</p>
            <p className="text-2xl font-semibold text-danger-600">{formatCurrency(perdaTotalMes)}</p>
            <p className="text-xs text-gray-400 mt-1">/mês estimado</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Oportunidade de recuperação</p>
            <p className="text-2xl font-semibold text-success-600">{formatCurrency(ganhoTotalMes)}</p>
            <p className="text-xs text-gray-400 mt-1">/mês potencial</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Gráfico evolução */}
        <div className="card">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Evolução dos indicadores</h2>
          <EvolucaoFinanceira dados={evolucao} />
        </div>

        {/* Indicadores do último mês */}
        {ultimoDado?.indicadores && (
          <div className="card">
            <h2 className="text-sm font-medium text-gray-700 mb-4">
              Indicadores —{' '}
              {new Date(ultimoDado.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Faturamento líquido', valor: formatCurrency(Number(ultimoDado.indicadores.faturamento_liquido)) },
                { label: 'Custo por sessão', valor: formatCurrency(Number(ultimoDado.indicadores.custo_por_sessao)) },
                { label: 'Taxa de ocupação', valor: formatPercent(Number(ultimoDado.indicadores.taxa_ocupacao)) },
                { label: 'Taxa de glosa', valor: formatPercent(Number(ultimoDado.indicadores.taxa_glosa)) },
                { label: 'Folha / receita', valor: formatPercent(Number(ultimoDado.indicadores.folha_sobre_receita)) },
                { label: 'Custo insumos / sessão', valor: formatCurrency(Number(ultimoDado.indicadores.custo_insumos_por_sessao)) },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.valor}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* NCs e Ações */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Não conformidades abertas</h2>
            <span className="text-xs text-gray-400">{cliente.nao_conformidades.length} em aberto</span>
          </div>
          {cliente.nao_conformidades.length > 0 ? (
            <div className="space-y-2">
              {cliente.nao_conformidades.map(nc => (
                <div key={nc.id} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-start gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                      nc.nivel === 'NC_III' ? 'bg-danger-50 text-danger-600' :
                      nc.nivel === 'NC_II' ? 'bg-warning-50 text-warning-600' :
                      'bg-brand-50 text-brand-600'
                    }`}>
                      {nc.nivel.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed">{nc.descricao}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {formatDate(nc.prazo_limite)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma NC em aberto</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Ações corretivas em aberto</h2>
            <Link href={`/dashboard/acoes?clienteId=${params.id}`} className="text-xs text-brand-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {cliente.acoes_corretivas.length > 0 ? (
            <div className="space-y-2">
              {cliente.acoes_corretivas.slice(0, 5).map(acao => (
                <div key={acao.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getPrioridadeColor(acao.prioridade)}`}>
                      {acao.prioridade}
                    </span>
                    <p className="text-xs text-gray-700 truncate">{acao.titulo}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(acao.prazo)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma ação em aberto</p>
          )}
        </div>
      </div>
    </div>
  )
}
