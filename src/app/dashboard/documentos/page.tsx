import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { FileText } from 'lucide-react'

export default async function DocumentosPage() {
  const session = await getServerSession(authOptions)
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user.perfil ?? '')

  const documentos = await prisma.documentoEnviado.findMany({
    where: isLC ? {} : { cliente_id: session?.user.clienteId ?? undefined },
    include: {
      cliente: { select: { id: true, nome: true } },
      documento_referencia: { select: { nome_documento: true, categoria: true } },
    },
    orderBy: { data_envio: 'desc' },
  })

  const statusColor: Record<string, string> = {
    PENDENTE: 'bg-gray-100 text-gray-600',
    ENVIADO: 'bg-brand-50 text-brand-600',
    EM_AVALIACAO: 'bg-warning-50 text-warning-600',
    APROVADO: 'bg-success-50 text-success-600',
    REPROVADO: 'bg-danger-50 text-danger-600',
    DESATUALIZADO: 'bg-warning-50 text-warning-600',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Documentos</h1>
        <p className="text-sm text-gray-500 mt-0.5">{documentos.length} documento{documentos.length !== 1 ? 's' : ''} enviado{documentos.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {documentos.map((doc) => (
          <div key={doc.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                <FileText size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{doc.documento_referencia.nome_documento}</p>
                <p className="text-xs text-gray-400">
                  {isLC && `${doc.cliente.nome} · `}
                  {doc.documento_referencia.categoria} · Enviado em {formatDate(doc.data_envio)}
                </p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[doc.status_documento]}`}>
              {doc.status_documento.replace(/_/g, ' ')}
            </span>
          </div>
        ))}

        {documentos.length === 0 && (
          <div className="card text-center py-12">
            <FileText size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Nenhum documento enviado ainda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
