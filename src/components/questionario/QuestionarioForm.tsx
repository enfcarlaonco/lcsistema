'use client'

import { useState, useCallback } from 'react'
import { ChevronRight, ChevronLeft, CheckCircle, Circle, Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Pergunta {
  id: string
  codigo: string
  enunciado: string
  tipo: string
  opcoes?: string[]
  obrigatoria: boolean
  ajuda?: string
  legislacao_referencia?: string
}

interface Bloco {
  id: string
  codigo: string
  titulo: string
  descricao?: string
  perguntas: Pergunta[]
}

interface Resposta {
  valor_texto?: string
  valor_numero?: number
  valor_boolean?: boolean
  valor_multiplo?: string[]
}

interface Props {
  questionarioId: string
  blocos: Bloco[]
  respostasIniciais: Record<string, any>
  pctInicial: number
  onConcluir?: () => void
}

export function QuestionarioForm({ questionarioId, blocos, respostasIniciais, pctInicial, onConcluir }: Props) {
  const [blocoAtual, setBlocoAtual] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, Resposta>>(
    Object.fromEntries(
      Object.entries(respostasIniciais).map(([pid, r]) => [pid, {
        valor_texto:    r.valor_texto,
        valor_numero:   r.valor_numero,
        valor_boolean:  r.valor_boolean,
        valor_multiplo: r.valor_multiplo,
      }])
    )
  )
  const [salvando, setSalvando] = useState<Record<string, boolean>>({})
  const [pct, setPct] = useState(pctInicial)
  const [concluido, setConcluido] = useState(false)

  const bloco = blocos[blocoAtual]

  const salvarResposta = useCallback(async (
    perguntaId: string,
    resposta: Resposta,
    bloco_codigo: string
  ) => {
    setSalvando(prev => ({ ...prev, [perguntaId]: true }))
    try {
      const res = await fetch(`/api/questionarios/${questionarioId}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta_id: perguntaId, bloco_codigo, ...resposta }),
      })
      const data = await res.json()
      if (data.pct_completo !== undefined) setPct(data.pct_completo)
    } finally {
      setSalvando(prev => ({ ...prev, [perguntaId]: false }))
    }
  }, [questionarioId])

  function handleResposta(pergunta: Pergunta, valor: any) {
    let resposta: Resposta = {}

    if (pergunta.tipo === 'BOOLEAN') {
      resposta = { valor_boolean: valor === 'true' || valor === true }
    } else if (pergunta.tipo === 'NUMERO' || pergunta.tipo === 'MOEDA' || pergunta.tipo === 'PERCENTUAL') {
      resposta = { valor_numero: parseFloat(valor) || 0 }
    } else if (pergunta.tipo === 'SELECAO_MULTIPLA') {
      const atual = respostas[pergunta.id]?.valor_multiplo ?? []
      const novoArray = atual.includes(valor)
        ? atual.filter(v => v !== valor)
        : [...atual, valor]
      resposta = { valor_multiplo: novoArray }
    } else if (pergunta.tipo === 'SELECAO_UNICA') {
      resposta = { valor_texto: valor }
    } else {
      resposta = { valor_texto: valor }
    }

    setRespostas(prev => ({ ...prev, [pergunta.id]: resposta }))
    salvarResposta(pergunta.id, resposta, bloco.codigo)
  }

  function blocoCompleto(b: Bloco): boolean {
    return b.perguntas
      .filter(p => p.obrigatoria)
      .every(p => {
        const r = respostas[p.id]
        if (!r) return false
        if (p.tipo === 'BOOLEAN') return r.valor_boolean !== undefined
        if (p.tipo === 'SELECAO_MULTIPLA') return (r.valor_multiplo?.length ?? 0) > 0
        if (p.tipo === 'NUMERO' || p.tipo === 'MOEDA') return r.valor_numero !== undefined && r.valor_numero >= 0
        return !!r.valor_texto
      })
  }

  function avancar() {
    if (blocoAtual < blocos.length - 1) setBlocoAtual(prev => prev + 1)
    else setConcluido(true)
  }

  if (concluido) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="mx-auto text-success-600 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Questionário concluído!</h2>
        <p className="text-gray-500 mb-6">Todas as informações foram salvas. O consultor LC Saúde irá revisar os dados.</p>
        {onConcluir && (
          <button onClick={onConcluir} className="btn-primary">
            Voltar ao painel
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Progresso geral */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500">Progresso geral</span>
          <span className="font-medium text-gray-900">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2 bg-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Navegação de blocos */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {blocos.map((b, i) => {
          const completo = blocoCompleto(b)
          const ativo = i === blocoAtual
          return (
            <button
              key={b.id}
              onClick={() => setBlocoAtual(i)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
                ativo ? 'bg-brand-600 text-white' :
                completo ? 'bg-success-50 text-success-600 border border-success-600' :
                'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'
              )}
            >
              {completo && !ativo ? <CheckCircle size={12} /> : <Circle size={12} />}
              {b.codigo} — {b.titulo.split(' ').slice(0, 3).join(' ')}
            </button>
          )
        })}
      </div>

      {/* Bloco atual */}
      <div className="card mb-4">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium bg-brand-50 text-brand-600 px-2 py-0.5 rounded">
              {bloco.codigo}
            </span>
            <span className="text-xs text-gray-400">
              {bloco.perguntas.filter(p => respostas[p.id]).length}/{bloco.perguntas.length} respondidas
            </span>
          </div>
          <h2 className="text-base font-semibold text-gray-900">{bloco.titulo}</h2>
          {bloco.descricao && <p className="text-sm text-gray-500 mt-1">{bloco.descricao}</p>}
        </div>

        <div className="space-y-6">
          {bloco.perguntas.map((pergunta, idx) => {
            const resposta = respostas[pergunta.id]
            const estaSalvando = salvando[pergunta.id]

            return (
              <div key={pergunta.id} className="relative">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-medium mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      {pergunta.enunciado}
                      {pergunta.obrigatoria && <span className="text-danger-600 ml-1">*</span>}
                      {estaSalvando && <Loader size={12} className="inline ml-2 animate-spin text-gray-400" />}
                    </label>

                    {pergunta.ajuda && (
                      <p className="text-xs text-gray-400 mb-2">{pergunta.ajuda}</p>
                    )}

                    {/* Campos por tipo */}
                    {pergunta.tipo === 'BOOLEAN' && (
                      <div className="flex gap-3">
                        {['true', 'false'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleResposta(pergunta, val)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                              resposta?.valor_boolean === (val === 'true')
                                ? val === 'true'
                                  ? 'bg-success-50 border-success-600 text-success-600'
                                  : 'bg-danger-50 border-danger-600 text-danger-600'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            )}
                          >
                            {val === 'true' ? 'Sim' : 'Não'}
                          </button>
                        ))}
                      </div>
                    )}

                    {pergunta.tipo === 'SELECAO_UNICA' && pergunta.opcoes && (
                      <div className="flex flex-wrap gap-2">
                        {pergunta.opcoes.map(opcao => (
                          <button
                            key={opcao}
                            type="button"
                            onClick={() => handleResposta(pergunta, opcao)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                              resposta?.valor_texto === opcao
                                ? 'bg-brand-50 border-brand-400 text-brand-600 font-medium'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            )}
                          >
                            {opcao.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    )}

                    {pergunta.tipo === 'SELECAO_MULTIPLA' && pergunta.opcoes && (
                      <div className="flex flex-wrap gap-2">
                        {pergunta.opcoes.map(opcao => {
                          const selecionado = resposta?.valor_multiplo?.includes(opcao)
                          return (
                            <button
                              key={opcao}
                              type="button"
                              onClick={() => handleResposta(pergunta, opcao)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                                selecionado
                                  ? 'bg-brand-50 border-brand-400 text-brand-600 font-medium'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                              )}
                            >
                              {selecionado ? '✓ ' : ''}{opcao.replace(/_/g, ' ')}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {(pergunta.tipo === 'NUMERO' || pergunta.tipo === 'MOEDA' || pergunta.tipo === 'PERCENTUAL') && (
                      <div className="relative w-48">
                        {pergunta.tipo === 'MOEDA' && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                        )}
                        {pergunta.tipo === 'PERCENTUAL' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                        )}
                        <input
                          type="number"
                          min="0"
                          step={pergunta.tipo === 'MOEDA' ? '0.01' : '1'}
                          defaultValue={resposta?.valor_numero ?? ''}
                          onBlur={e => handleResposta(pergunta, e.target.value)}
                          className={cn('input', pergunta.tipo === 'MOEDA' ? 'pl-9' : pergunta.tipo === 'PERCENTUAL' ? 'pr-9' : '')}
                          placeholder="0"
                        />
                      </div>
                    )}

                    {pergunta.tipo === 'TEXTO' && (
                      <input
                        type="text"
                        defaultValue={resposta?.valor_texto ?? ''}
                        onBlur={e => handleResposta(pergunta, e.target.value)}
                        className="input max-w-md"
                        placeholder="Digite aqui..."
                      />
                    )}

                    {pergunta.tipo === 'DATA' && (
                      <input
                        type="date"
                        defaultValue={resposta?.valor_texto ?? ''}
                        onChange={e => handleResposta(pergunta, e.target.value)}
                        className="input w-48"
                      />
                    )}

                    {pergunta.legislacao_referencia && (
                      <p className="text-xs text-brand-400 mt-1">
                        Ref.: {pergunta.legislacao_referencia.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setBlocoAtual(prev => prev - 1)}
          disabled={blocoAtual === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Bloco anterior
        </button>

        <span className="text-sm text-gray-400">
          {blocoAtual + 1} de {blocos.length}
        </span>

        <button
          onClick={avancar}
          className="btn-primary flex items-center gap-2"
        >
          {blocoAtual === blocos.length - 1 ? 'Concluir' : 'Próximo bloco'}
          {blocoAtual < blocos.length - 1 && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  )
}
