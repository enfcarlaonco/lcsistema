/**
 * Motor Documental — LC Sistema
 * Calcula score de conformidade documental baseado em 4 dimensões
 */

export interface RespostaCriterio {
  criterio_id: string
  dimensao: 'Existência' | 'Estrutura' | 'Aplicabilidade' | 'Impacto'
  peso: number
  resposta: 'SIM' | 'PARCIAL' | 'NAO' | 'NAO_SE_APLICA'
  obrigatorio: boolean
}

export interface ResultadoDocumental {
  score_existencia: number
  score_estrutura: number
  score_aplicabilidade: number
  score_impacto: number
  score_final: number
  classificacao: 'CONFORME' | 'PARCIAL' | 'NAO_CONFORME'
  risco_assistencial: 'ALTO' | 'MEDIO' | 'BAIXO'
  risco_operacional: 'ALTO' | 'MEDIO' | 'BAIXO'
  risco_regulatorio: 'ALTO' | 'MEDIO' | 'BAIXO'
  impacto_economico: 'ALTO' | 'MEDIO' | 'BAIXO'
  criterios_criticos_falhos: string[]
}

const PESOS_DIMENSAO = {
  'Existência':     0.10,
  'Estrutura':      0.30,
  'Aplicabilidade': 0.40,
  'Impacto':        0.20,
}

const VALOR_RESPOSTA = {
  'SIM': 1.0,
  'PARCIAL': 0.5,
  'NAO': 0.0,
  'NAO_SE_APLICA': null, // excluído do denominador
}

function calcularScoreDimensao(criterios: RespostaCriterio[], dimensao: string): number {
  const dosDimensao = criterios.filter(c => c.dimensao === dimensao && VALOR_RESPOSTA[c.resposta] !== null)
  if (dosDimensao.length === 0) return 100

  let pesoTotal = 0
  let pontuacaoObtida = 0

  for (const c of dosDimensao) {
    const valor = VALOR_RESPOSTA[c.resposta] as number
    pesoTotal += c.peso
    pontuacaoObtida += c.peso * valor
  }

  return pesoTotal > 0 ? Math.round((pontuacaoObtida / pesoTotal) * 100) : 100
}

function determinarRisco(score: number, temCriticoFalho: boolean): 'ALTO' | 'MEDIO' | 'BAIXO' {
  if (temCriticoFalho || score < 40) return 'ALTO'
  if (score < 70) return 'MEDIO'
  return 'BAIXO'
}

export function calcularScoreDocumental(criterios: RespostaCriterio[]): ResultadoDocumental {
  const score_existencia     = calcularScoreDimensao(criterios, 'Existência')
  const score_estrutura      = calcularScoreDimensao(criterios, 'Estrutura')
  const score_aplicabilidade = calcularScoreDimensao(criterios, 'Aplicabilidade')
  const score_impacto        = calcularScoreDimensao(criterios, 'Impacto')

  const score_final = Math.round(
    score_existencia     * PESOS_DIMENSAO['Existência']     +
    score_estrutura      * PESOS_DIMENSAO['Estrutura']      +
    score_aplicabilidade * PESOS_DIMENSAO['Aplicabilidade'] +
    score_impacto        * PESOS_DIMENSAO['Impacto']
  )

  const classificacao: 'CONFORME' | 'PARCIAL' | 'NAO_CONFORME' =
    score_final >= 85 ? 'CONFORME' :
    score_final >= 60 ? 'PARCIAL' : 'NAO_CONFORME'

  // Critérios obrigatórios com NAO = falho crítico
  const criterios_criticos_falhos = criterios
    .filter(c => c.obrigatorio && c.resposta === 'NAO')
    .map(c => c.criterio_id)

  const temCritico = criterios_criticos_falhos.length > 0

  const risco_assistencial = determinarRisco(score_aplicabilidade, temCritico)
  const risco_operacional  = determinarRisco(score_estrutura, temCritico)
  const risco_regulatorio  = determinarRisco(score_existencia, temCritico)

  // Impacto econômico baseado em combinação de riscos
  const nivelNumerico = (r: string) => r === 'ALTO' ? 3 : r === 'MEDIO' ? 2 : 1
  const mediaRisco = (nivelNumerico(risco_assistencial) + nivelNumerico(risco_operacional) + nivelNumerico(risco_regulatorio)) / 3
  const impacto_economico: 'ALTO' | 'MEDIO' | 'BAIXO' =
    mediaRisco >= 2.5 ? 'ALTO' : mediaRisco >= 1.5 ? 'MEDIO' : 'BAIXO'

  return {
    score_existencia, score_estrutura, score_aplicabilidade, score_impacto,
    score_final, classificacao, risco_assistencial, risco_operacional,
    risco_regulatorio, impacto_economico, criterios_criticos_falhos,
  }
}
