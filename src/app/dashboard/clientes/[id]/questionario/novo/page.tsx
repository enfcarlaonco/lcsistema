'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props { params: { id: string } }

export default function NovoQuestionarioPage({ params }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function criar() {
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/questionarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: params.id, contrato_id: 'contrato-dilson-2026' }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao criar questionário'); return }
      router.push(`/dashboard/questionarios/${data.id}`)
    } catch {
      setErro('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Iniciar diagnóstico M2</h1>
        <p className="text-sm text-gray-500 mb-6">
          Isso irá criar o questionário de diagnóstico. Os blocos serão ativados automaticamente conforme as modalidades informadas no Bloco 0.
        </p>
        {erro && <div className="bg-danger-50 text-danger-600 rounded-lg px-4 py-3 text-sm mb-4">{erro}</div>}
        <div className="flex gap-3">
          <button onClick={criar} disabled={loading} className="btn-primary">
            {loading ? 'Criando...' : 'Criar questionário'}
          </button>
          <button onClick={() => router.back()} className="btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
