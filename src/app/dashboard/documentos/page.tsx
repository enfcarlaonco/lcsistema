'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { FileText, CheckCircle, AlertCircle, XCircle, Clock, ChevronDown, ChevronUp, Upload, ExternalLink, RefreshCw } from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface DocumentoEnviado {
  id: string
  nome_arquivo: string
  arquivo_url: string
  versao_informada?: string
  data_envio: string
  status_documento: string
  cliente: { id: string; nome: string; perfil_diagnostico: string }
  documento_referencia: {
    codigo: string
    titulo: string
    nome_documento: string
    categoria: string
    area: string
    tema: string
    grau_necessidade: string
    legislacao_ref?: string
    ona_requisito?: string
    obrigatorio: boolean
    tipo_documento: { nome: string }
  }
  avaliacoes: Array<{
    score_final: number
    classificacao: string
    data_avaliacao: string
  }>
}

interface DocumentoReferencia {
  id: string
  codigo: string
  titulo: string
  nome_documento: string
  area: string
  tema: string
  grau_necessidade: string
  perfil_requerido: string
  legislacao_ref?: string
  ona_requisito?: string
  obrigatorio: boolean
  tipo_documento: { nome: string }
}

// ─── Helpers visuais ──────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; cor: string; icone: any }> = {
  PENDENTE:     { label: 'Pendente',      cor: 'bg-gray-100 text-gray-600',    icone: Clock },
  ENVIADO:      { label: 'Enviado',       cor: 'bg-blue-50 text-blue-600',     icone: FileText },
  EM_AVALIACAO: { label: 'Em avaliação',  cor: 'bg-yellow-50 text-yellow-700', icone: Clock },
  APROVADO:     { label: 'Conforme',      cor: 'bg-green-50 text-green-700',   icone: CheckCircle },
  REPROVADO:    { label: 'Não conforme',  cor: 'bg-red-50 text-red-700',       icone: XCircle },
  DESATUALIZADO:{ label: 'Desatualizado', cor: 'bg-orange-50 text-orange-700', icone: AlertCircle },
}

const grauConfig: Record<string, { label: string; cor: string }> = {
  LEGISLACAO:        { label: 'Legislação',    cor: 'bg-red-100 text-red-700' },
  ACREDITACAO:       { label: 'ONA',           cor: 'bg-purple-100 text-purple-700' },
  MELHORES_PRATICAS: { label: 'Boas práticas', cor: 'bg-blue-100 text-blue-700' },
}

// ─── Modal de upload ──────────────────────────────────────────────────────────

function ModalUpload({ docRef, clienteId, contratoId, onClose, onSalvo }: {
  docRef: DocumentoReferencia
  clienteId: string
  contratoId: string
  onClose: () => void
  onSalvo: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [versao, setVersao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [etapa, setEtapa] = useState<'selecao' | 'enviando' | 'avaliando' | 'resultado'>('selecao')
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState('')

  const TIPOS_ACEITOS = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp'
  const TAMANHO_MAX = 50 * 1024 * 1024 // 50MB

  function onArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > TAMANHO_MAX) {
      setErro('Arquivo muito grande. Limite: 50MB.')
      return
    }
    setErro('')
    setArquivo(f)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    if (f.size > TAMANHO_MAX) { setErro('Arquivo muito grande. Limite: 50MB.'); return }
    setErro('')
    setArquivo(f)
  }

  async function enviar() {
    if (!arquivo) return
    setEnviando(true)
    setEtapa('enviando')

    try {
      const formData = new FormData()
      formData.append('arquivo', arquivo)
      formData.append('clienteId', clienteId)
      formData.append('contratoId', contratoId)
      formData.append('documentoReferenciaId', docRef.id)
      if (versao) formData.append('versao', versao)

      setEtapa('avaliando')

      const res = await fetch('/api/documentos/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error ?? 'Erro ao enviar documento.')
        setEtapa('selecao')
        return
      }

      setResultado(data)
      setEtapa('resultado')
      onSalvo()
    } catch (e) {
      setErro('Erro de conexão. Tente novamente.')
      setEtapa('selecao')
    } finally {
      setEnviando(false)
    }
  }

  const corClassif = (c: string) =>
    c === 'CONFORME' ? '#15803d' : c === 'PARCIAL' ? '#92400e' : '#b91c1c'
  const bgClassif = (c: string) =>
    c === 'CONFORME' ? '#f0fdf4' : c === 'PARCIAL' ? '#fef3c7' : '#fef2f2'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: '560px', padding: '1.5rem' }}>

        {/* Cabeçalho */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            {docRef.tipo_documento.nome} · {docRef.area}
          </p>
          <h2 style={{ fontSize: '15px', fontWeight: 500 }}>
            {docRef.titulo || docRef.nome_documento}
          </h2>
        </div>

        {etapa === 'selecao' && (
          <>
            {/* Área de drop */}
            <div
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${arquivo ? '#1e40af' : 'var(--color-border-tertiary)'}`,
                borderRadius: 'var(--border-radius-lg)',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: arquivo ? '#eff6ff' : 'var(--color-background-secondary)',
                marginBottom: '1rem',
                transition: 'all 0.15s',
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept={TIPOS_ACEITOS}
                onChange={onArquivoSelecionado}
                style={{ display: 'none' }}
              />
              <Upload size={28} style={{ margin: '0 auto 10px', color: arquivo ? '#1e40af' : 'var(--color-text-secondary)', opacity: arquivo ? 1 : 0.5 }} />
              {arquivo ? (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#1e40af' }}>{arquivo.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    {(arquivo.size / 1024 / 1024).toFixed(2)} MB · Clique para trocar
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '13px', fontWeight: 500 }}>Arraste o arquivo ou clique para selecionar</p>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    PDF, Word, Excel, imagens · Máximo 50MB
                  </p>
                </>
              )}
            </div>

            {/* Versão */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                Versão do documento (opcional)
              </label>
              <input
                type="text"
                value={versao}
                onChange={e => setVersao(e.target.value)}
                placeholder="Ex: v2.1, revisão 2024..."
                style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>

            {erro && (
              <p style={{ fontSize: '12px', color: '#b91c1c', marginBottom: '1rem' }}>{erro}</p>
            )}

            {/* Aviso IA */}
            <div style={{ padding: '10px 12px', background: '#eff6ff', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', fontSize: '11px', color: '#1e40af' }}>
              ✦ O sistema vai ler e avaliar o documento automaticamente por IA. O processo pode levar até 30 segundos dependendo do tamanho.
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>
                Cancelar
              </button>
              <button
                onClick={enviar}
                disabled={!arquivo}
                style={{ padding: '9px 20px', borderRadius: 'var(--border-radius-md)', background: '#1e40af', color: '#fff', border: 'none', cursor: arquivo ? 'pointer' : 'not-allowed', fontSize: '13px', opacity: arquivo ? 1 : 0.5 }}
              >
                Enviar e avaliar
              </button>
            </div>
          </>
        )}

        {(etapa === 'enviando' || etapa === 'avaliando') && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <RefreshCw size={32} style={{ margin: '0 auto 16px', color: '#1e40af', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              {etapa === 'enviando' ? 'Enviando para o Google Drive...' : 'Avaliando com IA...'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {etapa === 'avaliando' ? 'O sistema está lendo e avaliando o conteúdo do documento.' : 'Aguarde um momento.'}
            </p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {etapa === 'resultado' && resultado && (
          <div>
            {/* Score resultado */}
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--border-radius-md)',
              background: bgClassif(resultado.avaliacao.classificacao),
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: corClassif(resultado.avaliacao.classificacao) }}>
                  {resultado.avaliacao.classificacao}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 500, color: corClassif(resultado.avaliacao.classificacao) }}>
                  {resultado.avaliacao.score_final.toFixed(0)}%
                </p>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{resultado.avaliacao.resumo}</p>
            </div>

            {/* Dimensões */}
            <div style={{ marginBottom: '1rem' }}>
              {Object.entries(resultado.avaliacao.dimensoes).map(([chave, dim]: [string, any]) => {
                const labels: Record<string, string> = { existencia: 'Existência (10%)', estrutura: 'Estrutura (40%)', aplicabilidade: 'Aplicabilidade (50%)' }
                const cor = dim.resposta === 'SIM' ? '#15803d' : dim.resposta === 'PARCIAL' ? '#92400e' : '#b91c1c'
                return (
                  <div key={chave} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 500 }}>{labels[chave] ?? chave}</p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{dim.comentario}</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: cor, marginLeft: '12px' }}>
                      {dim.resposta} ({dim.pontuacao}%)
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Revisão humana */}
            {resultado.avaliacao.requer_revisao_humana && (
              <div style={{ padding: '10px 12px', background: '#fef3c7', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', fontSize: '11px', color: '#92400e' }}>
                ⚠ {resultado.avaliacao.motivo_revisao ?? 'Este documento requer revisão da consultora LC Saúde.'}
              </div>
            )}

            {/* Link Drive */}
            <a
              href={resultado.arquivo_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1e40af', marginBottom: '1rem', textDecoration: 'none' }}
            >
              <ExternalLink size={13} />
              Ver documento no Google Drive
            </a>

            <button
              onClick={onClose}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', border: 'none', cursor: 'pointer', fontSize: '13px' }}
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal de avaliação manual ────────────────────────────────────────────────

const DIMENSOES = [
  { nome: 'Existência',     descricao: 'O documento existe e está disponível para consulta?', peso: '10%' },
  { nome: 'Estrutura',      descricao: 'O documento está completo, formatado, com identificação, objetivo, fluxo, responsáveis, data e assinatura?', peso: '40%' },
  { nome: 'Aplicabilidade', descricao: 'A equipe utiliza efetivamente o documento na prática? Há evidências de treinamento e adesão?', peso: '50%' },
]

function ModalAvaliacao({ doc, onClose, onSalvo }: {
  doc: DocumentoEnviado
  onClose: () => void
  onSalvo: () => void
}) {
  const [respostas, setRespostas] = useState<Record<string, { resposta: string; comentario: string }>>({})
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState<{ score: number; classificacao: string; mensagem: string } | null>(null)

  function setResposta(dimensao: string, campo: 'resposta' | 'comentario', valor: string) {
    setRespostas(prev => ({ ...prev, [dimensao]: { ...prev[dimensao], [campo]: valor } }))
  }

  const scorePreview = (() => {
    const pesos = { 'Existência': 0.10, 'Estrutura': 0.40, 'Aplicabilidade': 0.50 }
    const pontos: Record<string, number | null> = { SIM: 100, PARCIAL: 75, NAO: 0, NAO_SE_APLICA: null }
    let total = 0; let peso = 0
    for (const dim of DIMENSOES) {
      const r = respostas[dim.nome]?.resposta
      const p = r ? pontos[r] : undefined
      if (p === null || p === undefined) continue
      total += p * pesos[dim.nome as keyof typeof pesos]
      peso += pesos[dim.nome as keyof typeof pesos]
    }
    return peso > 0 ? Math.round((total / peso) * 100) / 100 : null
  })()

  async function salvar() {
    const respostasArray = DIMENSOES.map(d => ({
      dimensao: d.nome,
      resposta: respostas[d.nome]?.resposta || 'NAO_SE_APLICA',
      comentario: respostas[d.nome]?.comentario || '',
    }))
    setSalvando(true)
    try {
      const res = await fetch(`/api/documentos/${doc.id}/avaliar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostas: respostasArray, observacao_geral: observacao }),
      })
      const data = await res.json()
      if (res.ok) {
        setResultado({ score: data.score_final, classificacao: data.classificacao, mensagem: data.mensagem })
        onSalvo()
      }
    } finally { setSalvando(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            {doc.documento_referencia.tipo_documento.nome} · {doc.documento_referencia.area}
          </p>
          <h2 style={{ fontSize: '16px', fontWeight: 500 }}>
            {doc.documento_referencia.titulo || doc.documento_referencia.nome_documento}
          </h2>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{doc.cliente.nome} · {doc.nome_arquivo}</p>
            {doc.arquivo_url && (
              <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
                <ExternalLink size={11} /> Ver no Drive
              </a>
            )}
          </div>
        </div>

        {resultado ? (
          <div>
            <div style={{ padding: '1rem', borderRadius: 'var(--border-radius-md)', background: resultado.classificacao === 'CONFORME' ? '#f0fdf4' : resultado.classificacao === 'PARCIAL' ? '#fef3c7' : '#fef2f2', marginBottom: '1rem' }}>
              <p style={{ fontSize: '13px', fontWeight: 500 }}>{resultado.mensagem}</p>
              <p style={{ fontSize: '24px', fontWeight: 500, marginTop: '8px' }}>{resultado.score.toFixed(0)}%</p>
            </div>
            <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Fechar</button>
          </div>
        ) : (
          <>
            {DIMENSOES.map(dim => (
              <div key={dim.nome} style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 500 }}>{dim.nome}</p>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>peso {dim.peso}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>{dim.descricao}</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {(['SIM', 'PARCIAL', 'NAO', 'NAO_SE_APLICA'] as const).map(opcao => {
                    const sel = respostas[dim.nome]?.resposta === opcao
                    const cores: Record<string, string> = { SIM: '#15803d', PARCIAL: '#92400e', NAO: '#b91c1c', NAO_SE_APLICA: '#4b5563' }
                    const labels: Record<string, string> = { SIM: 'Sim', PARCIAL: 'Parcial', NAO: 'Não', NAO_SE_APLICA: 'N/A' }
                    return (
                      <button key={opcao} onClick={() => setResposta(dim.nome, 'resposta', opcao)} style={{ padding: '5px 12px', borderRadius: 'var(--border-radius-md)', border: `1px solid ${sel ? cores[opcao] : 'var(--color-border-tertiary)'}`, background: sel ? `${cores[opcao]}15` : 'transparent', color: sel ? cores[opcao] : 'var(--color-text-secondary)', fontSize: '12px', cursor: 'pointer', fontWeight: sel ? 500 : 400 }}>
                        {labels[opcao]}
                      </button>
                    )
                  })}
                </div>
                {respostas[dim.nome]?.resposta && respostas[dim.nome]?.resposta !== 'NAO_SE_APLICA' && (
                  <input type="text" placeholder="Comentário (opcional)" value={respostas[dim.nome]?.comentario || ''} onChange={e => setResposta(dim.nome, 'comentario', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', fontSize: '12px', boxSizing: 'border-box' }} />
                )}
              </div>
            ))}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Observação geral (opcional)</label>
              <textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Score estimado</p>
                <p style={{ fontSize: '22px', fontWeight: 500, color: scorePreview === null ? 'var(--color-text-secondary)' : scorePreview >= 85 ? '#15803d' : scorePreview >= 60 ? '#92400e' : '#b91c1c' }}>
                  {scorePreview !== null ? `${scorePreview.toFixed(0)}%` : '—'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                <button onClick={salvar} disabled={salvando} style={{ padding: '9px 20px', borderRadius: 'var(--border-radius-md)', background: '#1e40af', color: '#fff', border: 'none', cursor: salvando ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? 'Salvando...' : 'Salvar avaliação'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DocumentosPage() {
  const { data: session } = useSession()
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session?.user?.perfil ?? '')

  const [documentosEnviados, setDocumentosEnviados] = useState<DocumentoEnviado[]>([])
  const [referenciaExpandida, setReferenciaExpandida] = useState(false)
  const [referencias, setReferencias] = useState<DocumentoReferencia[]>([])
  const [filtroGrau, setFiltroGrau] = useState<string>('TODOS')
  const [docAvaliando, setDocAvaliando] = useState<DocumentoEnviado | null>(null)
  const [docUpload, setDocUpload] = useState<DocumentoReferencia | null>(null)
  const [loading, setLoading] = useState(true)

  // Busca contrato ativo do cliente para usar no upload
  const [contratoId, setContratoId] = useState<string>('')
  const [clienteId, setClienteId] = useState<string>('')

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch('/api/documentos')
      const data = await res.json()
      setDocumentosEnviados(Array.isArray(data) ? data : [])

      // Extrai clienteId e contratoId do primeiro documento ou da sessão
      if (!isLC && session?.user?.clienteId) {
        setClienteId(session.user.clienteId)
        // Busca contrato ativo
        const resCliente = await fetch('/api/clientes')
        const clientes = await resCliente.json()
        const cliente = clientes.find((c: any) => c.id === session.user.clienteId)
        if (cliente?.contratos?.[0]?.id) setContratoId(cliente.contratos[0].id)
      } else if (isLC && Array.isArray(data) && data.length > 0) {
        setClienteId(data[0].cliente_id)
        setContratoId(data[0].contrato_id)
      }
    } finally {
      setLoading(false)
    }
  }

  async function carregarReferencias() {
    if (referenciaExpandida && referencias.length > 0) {
      setReferenciaExpandida(false)
      return
    }
    const cId = !isLC ? session?.user?.clienteId : undefined
    const url = cId
      ? `/api/documentos/referencia?clienteId=${cId}`
      : `/api/documentos/referencia?incluirTodos=true`
    const res = await fetch(url)
    const data = await res.json()
    setReferencias(data.documentos ?? [])
    setReferenciaExpandida(true)
  }

  useEffect(() => { carregar() }, [session])

  const docsFiltrados = filtroGrau === 'TODOS'
    ? documentosEnviados
    : documentosEnviados.filter(d => d.documento_referencia.grau_necessidade === filtroGrau)

  const refsFiltradas = filtroGrau === 'TODOS'
    ? referencias
    : referencias.filter(r => r.grau_necessidade === filtroGrau)

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Documentos</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {documentosEnviados.length} documento{documentosEnviados.length !== 1 ? 's' : ''} enviado{documentosEnviados.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['TODOS', 'LEGISLACAO', 'ACREDITACAO', 'MELHORES_PRATICAS'].map(g => (
            <button key={g} onClick={() => setFiltroGrau(g)} style={{ padding: '5px 12px', borderRadius: 'var(--border-radius-md)', border: `1px solid ${filtroGrau === g ? '#1e40af' : 'var(--color-border-tertiary)'}`, background: filtroGrau === g ? '#eff6ff' : 'transparent', color: filtroGrau === g ? '#1e40af' : 'var(--color-text-secondary)', fontSize: '12px', cursor: 'pointer', fontWeight: filtroGrau === g ? 500 : 400 }}>
              {g === 'TODOS' ? 'Todos' : g === 'LEGISLACAO' ? 'Legislação' : g === 'ACREDITACAO' ? 'ONA' : 'Boas práticas'}
            </button>
          ))}
        </div>
      </div>

      {/* Documentos enviados */}
      <div style={{ marginBottom: '1.5rem' }}>
        {loading ? (
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>Carregando...</p>
        ) : docsFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-lg)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', color: 'var(--color-text-secondary)', opacity: 0.4 }} />
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Nenhum documento enviado ainda.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {docsFiltrados.map(doc => {
              const status = statusConfig[doc.status_documento] ?? statusConfig.PENDENTE
              const grau = grauConfig[doc.documento_referencia.grau_necessidade]
              const ultimaAv = doc.avaliacoes?.[0]
              return (
                <div key={doc.id} style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: '36px', height: '36px', background: '#eff6ff', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={16} style={{ color: '#1e40af' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                        {doc.documento_referencia.titulo || doc.documento_referencia.nome_documento}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {isLC && `${doc.cliente.nome} · `}
                        {doc.documento_referencia.tipo_documento.nome} · {doc.documento_referencia.area}
                        {doc.documento_referencia.legislacao_ref && ` · ${doc.documento_referencia.legislacao_ref.replace(/_/g, ' ')}`}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {grau && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', ...parseStyle(grau.cor) }}>{grau.label}</span>}
                    {ultimaAv && <span style={{ fontSize: '12px', fontWeight: 500, color: ultimaAv.score_final >= 85 ? '#15803d' : ultimaAv.score_final >= 60 ? '#92400e' : '#b91c1c' }}>{ultimaAv.score_final.toFixed(0)}%</span>}
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', ...parseStyle(status.cor) }}>{status.label}</span>
                    {doc.arquivo_url && (
                      <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', display: 'flex', alignItems: 'center' }}>
                        <ExternalLink size={13} />
                      </a>
                    )}
                    {isLC && doc.status_documento !== 'APROVADO' && (
                      <button onClick={() => setDocAvaliando(doc)} style={{ padding: '5px 12px', borderRadius: 'var(--border-radius-md)', background: '#1e40af', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                        Reavaliar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Lista de referência */}
      <div style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
        <button onClick={carregarReferencias} style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-background-secondary)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
          <span>Lista mestre de documentos de referência</span>
          {referenciaExpandida ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {referenciaExpandida && (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflow: 'auto' }}>
            {refsFiltradas.map(ref => {
              const grau = grauConfig[ref.grau_necessidade]
              const jaEnviado = documentosEnviados.some(d => d.documento_referencia.codigo === ref.codigo)
              return (
                <div key={ref.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 500 }}>
                      {ref.titulo || ref.nome_documento}
                      {ref.obrigatorio && <span style={{ color: '#b91c1c', marginLeft: '4px' }}>*</span>}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {ref.tipo_documento.nome} · {ref.area}
                      {ref.legislacao_ref && ` · ${ref.legislacao_ref.replace(/_/g, ' ')}`}
                      {ref.ona_requisito && ` · ONA ${ref.ona_requisito}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {grau && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '999px', ...parseStyle(grau.cor) }}>{grau.label}</span>}
                    {jaEnviado
                      ? <CheckCircle size={14} style={{ color: '#15803d' }} />
                      : (
                        <button
                          onClick={() => setDocUpload(ref)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: 'var(--border-radius-md)', background: '#1e40af', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px' }}
                        >
                          <Upload size={11} /> Enviar
                        </button>
                      )
                    }
                  </div>
                </div>
              )
            })}
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>* Obrigatório por legislação</p>
          </div>
        )}
      </div>

      {/* Modais */}
      {docAvaliando && (
        <ModalAvaliacao
          doc={docAvaliando}
          onClose={() => setDocAvaliando(null)}
          onSalvo={() => { setDocAvaliando(null); carregar() }}
        />
      )}

      {docUpload && clienteId && contratoId && (
        <ModalUpload
          docRef={docUpload}
          clienteId={clienteId}
          contratoId={contratoId}
          onClose={() => setDocUpload(null)}
          onSalvo={() => { setDocUpload(null); carregar() }}
        />
      )}

      {docUpload && (!clienteId || !contratoId) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-lg)', padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Cliente ou contrato não identificado</p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Para fazer upload, acesse a página de documentos a partir do perfil de um cliente específico.</p>
            <button onClick={() => setDocUpload(null)} style={{ padding: '8px 20px', borderRadius: 'var(--border-radius-md)', background: '#1e40af', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function parseStyle(classes: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    'bg-gray-100':    { background: '#f3f4f6' }, 'text-gray-600':  { color: '#4b5563' },
    'bg-blue-50':     { background: '#eff6ff' }, 'text-blue-600':  { color: '#2563eb' },
    'bg-yellow-50':   { background: '#fefce8' }, 'text-yellow-700':{ color: '#a16207' },
    'bg-green-50':    { background: '#f0fdf4' }, 'text-green-700': { color: '#15803d' },
    'bg-red-50':      { background: '#fef2f2' }, 'text-red-700':   { color: '#b91c1c' },
    'bg-red-100':     { background: '#fee2e2' }, 'bg-orange-50':   { background: '#fff7ed' },
    'text-orange-700':{ color: '#c2410c' },      'bg-purple-100':  { background: '#f3e8ff' },
    'text-purple-700':{ color: '#7e22ce' },      'bg-blue-100':    { background: '#dbeafe' },
    'text-blue-700':  { color: '#1d4ed8' },
  }
  return Object.assign({}, ...classes.split(' ').map(c => map[c] ?? {}))
}
