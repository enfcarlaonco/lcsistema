'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QuestionarioForm } from '@/components/questionario/QuestionarioForm'

export default function QuestionarioPage() {
  const params = useParams()
  const router = useRouter()
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/questionarios/${params.id}`)
      .then(r => r.json())
      .then(setDados)
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return (
    <div className="text-center py-12 text-gray-400">Carregando...</div>
  )

  if (!dados?.questionario) return (
    <div className="text-center py-12 text-danger-600">Questionário não encontrado</div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">{dados.questionario.cliente.nome}</p>
        <h1 className="text-xl font-semibold text-gray-900">Diagnóstico — Questionário M2</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Preencha todos os campos para que a LC Saúde possa realizar a análise completa do seu serviço.
        </p>
      </div>
      <QuestionarioForm
        questionarioId={params.id as string}
        blocos={dados.blocos || []}
        respostasIniciais={dados.respostasMap || {}}
        pctInicial={dados.questionario.pct_completo || 0}
        onConcluir={() => router.push('/dashboard/questionarios')}
      />
    </div>
  )
}