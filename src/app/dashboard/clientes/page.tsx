import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate, getScoreBg } from '@/lib/utils'
import { Plus, ChevronRight, AlertTriangle } from 'lucide-react'

export default async function ClientesPage() {
  const session = await getServerSession(authOptions)
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user.perfil ?? '')

  const clientes = await prisma.cliente.findMany({
    where: isLC ? {} : { id: session?.user.clienteId ?? undefined },
    include: {
      contratos: { where: { status: 'ATIVO' }, take: 1 },
      dados_financeiros: {
        orderBy: { mes_referencia: 'desc' },
        take: 1,
        include: { score: true },
      },
      _count: {
        select: {
          acoes_corretivas: { where: { status: { not: 'CONCLUIDA' } } },
          nao_conformidades: { where: { status: { not: 'RESOLVIDA' } } },
        }
      }
    },
    orderBy: { nome: 'asc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-500 mt-0.5">{clientes.length} serviço{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {clientes.map((cliente) => {
          const scoreFinanceiro = cliente.dados_financeiros[0]?.score?.score_final
          const contrato = cliente.contratos[0]
          return (
            <Link
              key={cliente.id}
              href={`/dashboard/clientes/${cliente.id}`}
              className="card flex items-center justify-between hover:border-brand-400 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-600 font-semibold text-sm">
                    {cliente.nome.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{cliente.nome}</p>
                  <p className="text-xs text-gray-500">
                    {cliente.tipo_servico.replace('_', ' ')} · {cliente.cidade}/{cliente.estado}
                    {contrato && ` · Contrato até ${formatDate(contrato.data_fim)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {scoreFinanceiro !== undefined && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Score financeiro</p>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${getScoreBg(scoreFinanceiro)}`}>
                      {scoreFinanceiro}
                    </span>
                  </div>
                )}

                {cliente._count.nao_conformidades > 0 && (
                  <div className="flex items-center gap-1 text-warning-600">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-medium">{cliente._count.nao_conformidades} NCs</span>
                  </div>
                )}

                {cliente._count.acoes_corretivas > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Ações abertas</p>
                    <p className="text-sm font-semibold text-gray-900">{cliente._count.acoes_corretivas}</p>
                  </div>
                )}

                <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
              </div>
            </Link>
          )
        })}

        {clientes.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-sm">Nenhum cliente cadastrado ainda.</p>
            {isLC && (
              <Link href="/dashboard/clientes/novo" className="btn-primary inline-flex mt-4 items-center gap-2">
                <Plus size={16} />
                Cadastrar primeiro cliente
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
