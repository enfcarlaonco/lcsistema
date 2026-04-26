import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { ClipboardList, ChevronRight } from 'lucide-react'

export default async function QuestionariosPage() {
  const session = await getServerSession(authOptions)
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user.perfil ?? '')

  const questionarios = await prisma.questionario.findMany({
    where: isLC ? {} : { cliente_id: session?.user.clienteId ?? undefined },
    include: {
      cliente: { select: { id: true, nome: true } },
      progresso: { include: { bloco: { select: { titulo: true, codigo: true } } } },
    },
    orderBy: { created_at: 'desc' },
  })

  const statusLabel: Record<string, string> = {
    NAO_INICIADO: 'Não iniciado',
    EM_ANDAMENTO: 'Em andamento',
    AGUARDANDO_VALIDACAO: 'Aguardando validação',
    VALIDADO: 'Validado',
    REVISAO_NECESSARIA: 'Revisão necessária',
  }

  const statusColor: Record<string, string> = {
    NAO_INICIADO: 'bg-gray-100 text-gray-600',
    EM_ANDAMENTO: 'bg-warning-50 text-warning-600',
    AGUARDANDO_VALIDACAO: 'bg-brand-50 text-brand-600',
    VALIDADO: 'bg-success-50 text-success-600',
    REVISAO_NECESSARIA: 'bg-danger-50 text-danger-600',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Questionários de diagnóstico</h1>
        <p className="text-sm text-gray-500 mt-0.5">{questionarios.length} questionário{questionarios.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {questionarios.map((q) => (
          <Link
            key={q.id}
            href={`/dashboard/questionarios/${q.id}`}
            className="card flex items-center justify-between hover:border-brand-400 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                <ClipboardList size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{q.cliente.nome}</p>
                <p className="text-xs text-gray-400">Criado em {formatDate(q.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Progresso por bloco */}
              <div className="flex gap-1">
                {q.progresso.map(prog => (
                  <div key={prog.id} className="text-center" title={`${prog.bloco.titulo}: ${prog.pct_completo}%`}>
                    <div className={`w-8 h-1.5 rounded-full ${prog.pct_completo === 100 ? 'bg-success-600' : prog.pct_completo > 0 ? 'bg-warning-600' : 'bg-gray-200'}`} />
                    <span className="text-xs text-gray-400">{prog.bloco.codigo}</span>
                  </div>
                ))}
              </div>

              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[q.status]}`}>
                  {statusLabel[q.status]}
                </span>
                <p className="text-xs text-gray-400 mt-1">{q.pct_completo}% completo</p>
              </div>

              <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
            </div>
          </Link>
        ))}

        {questionarios.length === 0 && (
          <div className="card text-center py-12">
            <ClipboardList size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Nenhum questionário criado ainda.</p>
            <p className="text-xs text-gray-400 mt-1">Acesse um cliente e clique em "Iniciar diagnóstico M2".</p>
          </div>
        )}
      </div>
    </div>
  )
}
