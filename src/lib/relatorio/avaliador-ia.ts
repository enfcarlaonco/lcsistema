// src/lib/relatorio/avaliador-ia.ts
// Avalia documentos automaticamente usando a API do Anthropic
// Retorna score por dimensão e flag de necessidade de revisão humana

interface ResultadoAvaliacao {
  dimensoes: {
    existencia:     { resposta: 'SIM' | 'PARCIAL' | 'NAO'; comentario: string; pontuacao: number }
    estrutura:      { resposta: 'SIM' | 'PARCIAL' | 'NAO'; comentario: string; pontuacao: number }
    aplicabilidade: { resposta: 'SIM' | 'PARCIAL' | 'NAO'; comentario: string; pontuacao: number }
  }
  score_final: number
  classificacao: 'CONFORME' | 'PARCIAL' | 'NAO_CONFORME'
  requer_revisao_humana: boolean
  motivo_revisao?: string
  resumo: string
}

const PESOS = { existencia: 0.10, estrutura: 0.40, aplicabilidade: 0.50 }

const PONTOS: Record<string, number> = { SIM: 100, PARCIAL: 75, NAO: 0 }

function calcularScore(dimensoes: ResultadoAvaliacao['dimensoes']): number {
  return (
    dimensoes.existencia.pontuacao     * PESOS.existencia +
    dimensoes.estrutura.pontuacao      * PESOS.estrutura +
    dimensoes.aplicabilidade.pontuacao * PESOS.aplicabilidade
  )
}

function classificar(score: number): 'CONFORME' | 'PARCIAL' | 'NAO_CONFORME' {
  if (score >= 85) return 'CONFORME'
  if (score >= 60) return 'PARCIAL'
  return 'NAO_CONFORME'
}

export async function avaliarDocumentoComIA({
  tituloDocumento,
  tipoDocumento,
  grauNecessidade,
  conteudoTexto,
  nomeArquivo,
}: {
  tituloDocumento: string
  tipoDocumento: string
  grauNecessidade: string
  conteudoTexto: string
  nomeArquivo: string
}): Promise<ResultadoAvaliacao> {

  const prompt = `Você é um consultor especialista em qualidade e acreditação de serviços de nefrologia/hemodiálise no Brasil.

Avalie o documento abaixo segundo 3 dimensões, com base nas exigências da RDC 11/2014, boas práticas clínicas e requisitos ONA.

DOCUMENTO: "${tituloDocumento}"
TIPO: ${tipoDocumento}
GRAU DE NECESSIDADE: ${grauNecessidade}
ARQUIVO: ${nomeArquivo}

CONTEÚDO DO DOCUMENTO:
---
${conteudoTexto.slice(0, 12000)}
---

DIMENSÕES DE AVALIAÇÃO:

1. EXISTÊNCIA (peso 10%): O documento existe, está disponível e identificável?
   - Critérios: tem título, código ou identificação, data de emissão ou revisão

2. ESTRUTURA (peso 40%): O documento está completo e bem formatado?
   - Critérios: tem objetivo definido, responsáveis identificados, procedimento ou fluxo descrito, referências ou embasamento, assinatura ou aprovação dos responsáveis técnicos

3. APLICABILIDADE (peso 50%): O documento é efetivamente aplicável na prática clínica?
   - Critérios: linguagem clara e acessível à equipe, procedimentos executáveis no contexto de hemodiálise, alinhado com legislação vigente (RDC 11/2014), sem contradições internas, atualizado (menos de 2 anos ou com data de revisão prevista)

Responda APENAS com um JSON válido no seguinte formato:
{
  "dimensoes": {
    "existencia": {
      "resposta": "SIM|PARCIAL|NAO",
      "comentario": "justificativa curta em português",
      "pontuacao": 100|75|0
    },
    "estrutura": {
      "resposta": "SIM|PARCIAL|NAO",
      "comentario": "justificativa curta em português",
      "pontuacao": 100|75|0
    },
    "aplicabilidade": {
      "resposta": "SIM|PARCIAL|NAO",
      "comentario": "justificativa curta em português",
      "pontuacao": 100|75|0
    }
  },
  "requer_revisao_humana": true|false,
  "motivo_revisao": "motivo se requer revisão, null caso contrário",
  "resumo": "resumo geral da avaliação em 1-2 frases"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Erro na API Anthropic: ${response.status}`)
  }

  const data = await response.json()
  const textoResposta = data.content[0]?.text ?? ''

  // Extrai o JSON da resposta
  const jsonMatch = textoResposta.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Resposta da IA sem JSON válido')

  const avaliacao = JSON.parse(jsonMatch[0])

  // Recalcula score para garantir consistência
  const score = calcularScore(avaliacao.dimensoes)
  const classificacao = classificar(score)

  // Força revisão humana se score for limítrofe (entre 55-70 ou acima de 90)
  // ou se a IA já sinalizou necessidade
  const scoreLimitrofe = (score >= 55 && score <= 70) || score >= 92
  const requerRevisao = avaliacao.requer_revisao_humana || scoreLimitrofe

  return {
    dimensoes: avaliacao.dimensoes,
    score_final: Math.round(score * 10) / 10,
    classificacao,
    requer_revisao_humana: requerRevisao,
    motivo_revisao: requerRevisao
      ? (avaliacao.motivo_revisao ?? (scoreLimitrofe ? 'Score limítrofe requer confirmação humana' : undefined))
      : undefined,
    resumo: avaliacao.resumo,
  }
}
