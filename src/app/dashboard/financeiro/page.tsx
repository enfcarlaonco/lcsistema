import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatPercent, formatMonthYear, getScoreBg } from '@/lib/utils'
import { BarChart2 } from 'lucide-react'

export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions)
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user.perfil ?? '')

  const dados = await prisma.dadosFinanceiros.findMany({
    where: isLC ? {} : { cliente_id: session?.user.clienteId ?? undefined },
    include: {
      cliente: { select: { id: true, nome: true } },
      indicadores: true,
      score: true,
    },
    orderBy: { mes_referencia: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500 mt-0.5">{dados.length} registros</p>
      </div>

      <div className="space-y-3">
        {dados.map((d) => (
          <div key={d.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                <BarChart2 size={18} className="text-brand-600" />
              </div>
              <div>
                {isLC && <p className="font-medium text-gray-900">{d.cliente.nome}</p>}
                <p className="text-sm text-gray-600">{formatMonthYear(d.mes_referencia)}</p>
                <p className="text-xs text-gray-400">{d.pacientes} pacientes · {d.sessoes_realizadas} sessões</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {d.indicadores && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Margem</p>
                  <p className="text-sm font-medium">{formatPercent(Number(d.indicadores.margem_percentual))}</p>
                </div>
              )}
              {d.score && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreBg(d.score.score_final)}`}>
                  Score {d.score.score_final}
                </span>
              )}
            </div>
          </div>
        ))}

        {dados.length === 0 && (
          <div className="card text-center py-12">
            <BarChart2 size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Nenhum dado financeiro registrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  )
}