'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, ChevronRight, Trash2 } from 'lucide-react'

interface Questionario {
  id: string
  status: string
  pct_completo: number
  created_at: string
  cliente: { id: string; nome: string }
  progresso: Array<{
    id: string
    pct_completo: number
    bloco: { codigo: string; titulo: string }
  }>
}

const statusLabel: Record<string, string> = {
  NAO_INICIADO: 'Não iniciado',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_VALIDACAO: 'Aguardando validação',
  VALIDADO: 'Validado',
  REVISAO_NECESSARIA: 'Revisão necessária',
}

const statusColor: Record<string, string> = {
  NAO_INICIADO: 'bg-gray-100 text-gray-600',
  EM_ANDAMENTO: 'bg-yellow-50 text-yellow-700',
  AGUARDANDO_VALIDACAO: 'bg-blue-50 text-blue-700',
  VALIDADO: 'bg-green-50 text-green-700',
  REVISAO_NECESSARIA: 'bg-red-50 text-red-700',
}

export default function QuestionariosPage() {
  const [questionarios, setQuestionarios] = useState<Questionario[]>([])
  const [loading, setLoading] = useState(true)
  const [deletando, setDeletando] = useState<string | null>(null)

  useEffect(() => { fetchQuestionarios() }, [])

  async function fetchQuestionarios() {
    const res = await fetch('/api/questionarios')
    const data = await res.json()
    setQuestionarios(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleDelete(id: string, clienteNome: string) {
    if (!confirm(`Tem certeza que deseja excluir o questionário de "${clienteNome}"?\n\nEsta ação não pode ser desfeita.`)) return

    setDeletando(id)
    try {
      const res = await fetch(`/api/questionarios/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setQuestionarios(prev => prev.filter(q => q.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir questionário')
      }
    } finally {
      setDeletando(null)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Questionários de diagnóstico</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {questionarios.length} questionário{questionarios.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-3">
        {questionarios.map((q) => (
          <div key={q.id} className="card flex items-center justify-between hover:border-blue-300 transition-colors group">
            <Link href={`/dashboard/questionarios/${q.id}`} className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{q.cliente.nome}</p>
                <p className="text-xs text-gray-400">
                  Criado em {new Date(q.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Progresso por bloco */}
              <div className="flex gap-1 items-center">
                {q.progresso.map(prog => (
                  <div key={prog.id} className="text-center" title={`${prog.bloco?.titulo ?? ''}: ${prog.pct_completo}%`}>
                    <div className={`w-7 h-1.5 rounded-full ${
                      prog.pct_completo === 100 ? 'bg-green-500' :
                      prog.pct_completo > 0 ? 'bg-yellow-400' : 'bg-gray-200'
                    }`} />
                    <span className="text-xs text-gray-400">{prog.bloco?.codigo ?? ''}</span>
                  </div>
                ))}
              </div>

              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[q.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel[q.status] ?? q.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">{q.pct_completo}% completo</p>
              </div>

              <Link href={`/dashboard/questionarios/${q.id}`}>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
              </Link>

              {/* Botão deletar */}
              <button
                onClick={() => handleDelete(q.id, q.cliente.nome)}
                disabled={deletando === q.id}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Excluir questionário"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {questionarios.length === 0 && (
          <div className="card text-center py-12">
            <ClipboardList size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Nenhum questionário criado ainda.</p>
            <p className="text-xs text-gray-400 mt-1">
              Acesse um cliente e clique em "Iniciar diagnóstico M2".
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
