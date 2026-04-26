/**
 * Motor Financeiro — LC Sistema
 * Calcula todos os indicadores econômicos a partir dos dados brutos
 * e compara com benchmarks de mercado (P25/P50/P75)
 */

export interface DadosEntrada {
  pacientes: number
  sessoes_realizadas: number
  sessoes_faturadas: number
  sessoes_perdidas: number
  faturamento_bruto: number
  total_glosas: number
  custo_insumos: number
  custo_mao_obra: number
  custo_manutencao: number
  custo_agua: number
  outros_custos: number
  maquinas: number
  turnos_dia: number
  dias_funcionamento: number
}

export interface IndicadoresCalculados {
  // Produção
  capacidade_maxima_sessoes: number
  taxa_ocupacao: number              // %

  // Financeiro
  faturamento_liquido: number
  faturamento_potencial: number
  perda_faturamento: number
  custo_total: number
  custo_por_sessao: number
  receita_por_sessao: number
  margem_operacional: number
  margem_percentual: number          // %

  // Qualidade financeira
  taxa_glosa: number                 // %
  custo_insumos_por_sessao: number
  folha_sobre_receita: number        // %
  perda_coagulacao: number           // %

  // Alertas
  alertas: Alerta[]
}

export interface Alerta {
  tipo: 'CRITICO' | 'ATENCAO' | 'INFO'
  codigo: string
  mensagem: string
  valor_atual: number
  valor_referencia: number
}

export interface ScoreFinanceiro {
  score_existencia: number
  score_confiabilidade: number
  score_coerencia: number
  score_eficiencia: number
  score_final: number
  classificacao: 'EFICIENTE' | 'PARCIALMENTE_EFICIENTE' | 'INEFICIENTE'
}

export interface ResultadoMotorFinanceiro {
  indicadores: IndicadoresCalculados
  score: ScoreFinanceiro
  perdas: PerdaIdentificada[]
  oportunidades: OportunidadeIdentificada[]
}

export interface PerdaIdentificada {
  tipo: string
  descricao: string
  valor_estimado: number
  prioridade: 'CRITICA' | 'ALTA' | 'MODERADA' | 'BAIXA'
}

export interface OportunidadeIdentificada {
  tipo: string
  descricao: string
  ganho_estimado: number
  prioridade: 'CRITICA' | 'ALTA' | 'MODERADA' | 'BAIXA'
}

// Benchmarks internos (P25/P50/P75) — alimentados pelo seed
const BENCHMARK = {
  custo_por_sessao:        { p25: 280, p50: 340, p75: 420 },
  taxa_glosa:              { p25: 2,   p50: 5,   p75: 8   },
  taxa_ocupacao:           { p25: 72,  p50: 84,  p75: 92  },
  margem_percentual:       { p25: 8,   p50: 18,  p75: 28  },
  custo_insumos_por_sessao:{ p25: 120, p50: 145, p75: 175 },
  folha_sobre_receita:     { p25: 24,  p50: 30,  p75: 38  },
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function pct(value: number, total: number): number {
  if (total === 0) return 0
  return round2((value / total) * 100)
}

export function calcularIndicadores(d: DadosEntrada): IndicadoresCalculados {
  const capacidade_maxima_sessoes = d.maquinas * d.turnos_dia * d.dias_funcionamento
  const taxa_ocupacao = pct(d.sessoes_realizadas, capacidade_maxima_sessoes)
  const faturamento_liquido = round2(d.faturamento_bruto - d.total_glosas)
  const faturamento_potencial = round2(
    d.sessoes_realizadas * (d.sessoes_faturadas > 0 ? d.faturamento_bruto / d.sessoes_faturadas : 0)
  )
  const perda_faturamento = round2(Math.max(0, faturamento_potencial - faturamento_liquido))
  const custo_total = round2(
    d.custo_insumos + d.custo_mao_obra + d.custo_manutencao + d.custo_agua + d.outros_custos
  )
  const custo_por_sessao = d.sessoes_realizadas > 0
    ? round2(custo_total / d.sessoes_realizadas) : 0
  const receita_por_sessao = d.sessoes_faturadas > 0
    ? round2(faturamento_liquido / d.sessoes_faturadas) : 0
  const margem_operacional = round2(faturamento_liquido - custo_total)
  const margem_percentual = pct(margem_operacional, d.faturamento_bruto)
  const taxa_glosa = pct(d.total_glosas, d.faturamento_bruto)
  const custo_insumos_por_sessao = d.sessoes_realizadas > 0
    ? round2(d.custo_insumos / d.sessoes_realizadas) : 0
  const folha_sobre_receita = faturamento_liquido > 0
    ? pct(d.custo_mao_obra, faturamento_liquido) : 0
  const perda_coagulacao = pct(d.sessoes_perdidas, d.sessoes_realizadas + d.sessoes_perdidas)

  // ── Alertas automáticos ──
  const alertas: Alerta[] = []

  if (taxa_glosa > BENCHMARK.taxa_glosa.p75) {
    alertas.push({ tipo: 'CRITICO', codigo: 'GLOSA_CRITICA',
      mensagem: `Taxa de glosa ${taxa_glosa}% está acima do P75 de mercado (${BENCHMARK.taxa_glosa.p75}%)`,
      valor_atual: taxa_glosa, valor_referencia: BENCHMARK.taxa_glosa.p50 })
  } else if (taxa_glosa > BENCHMARK.taxa_glosa.p50) {
    alertas.push({ tipo: 'ATENCAO', codigo: 'GLOSA_ATENCAO',
      mensagem: `Taxa de glosa ${taxa_glosa}% acima da mediana de mercado`,
      valor_atual: taxa_glosa, valor_referencia: BENCHMARK.taxa_glosa.p50 })
  }

  if (margem_percentual < 5) {
    alertas.push({ tipo: 'CRITICO', codigo: 'MARGEM_CRITICA',
      mensagem: `Margem operacional ${margem_percentual}% — risco de inviabilidade financeira`,
      valor_atual: margem_percentual, valor_referencia: 15 })
  } else if (margem_percentual < BENCHMARK.margem_percentual.p25) {
    alertas.push({ tipo: 'ATENCAO', codigo: 'MARGEM_BAIXA',
      mensagem: `Margem ${margem_percentual}% abaixo do P25 de mercado`,
      valor_atual: margem_percentual, valor_referencia: BENCHMARK.margem_percentual.p50 })
  }

  if (custo_por_sessao > BENCHMARK.custo_por_sessao.p75) {
    alertas.push({ tipo: 'CRITICO', codigo: 'CUSTO_CRITICO',
      mensagem: `Custo/sessão R$ ${custo_por_sessao} — ${Math.round((custo_por_sessao/BENCHMARK.custo_por_sessao.p50-1)*100)}% acima do P50`,
      valor_atual: custo_por_sessao, valor_referencia: BENCHMARK.custo_por_sessao.p50 })
  }

  if (taxa_ocupacao < 70) {
    alertas.push({ tipo: 'CRITICO', codigo: 'OCUPACAO_CRITICA',
      mensagem: `Taxa de ocupação ${taxa_ocupacao}% — capacidade ociosa significativa`,
      valor_atual: taxa_ocupacao, valor_referencia: BENCHMARK.taxa_ocupacao.p50 })
  } else if (taxa_ocupacao < BENCHMARK.taxa_ocupacao.p50) {
    alertas.push({ tipo: 'ATENCAO', codigo: 'OCUPACAO_BAIXA',
      mensagem: `Taxa de ocupação ${taxa_ocupacao}% abaixo da mediana de mercado (${BENCHMARK.taxa_ocupacao.p50}%)`,
      valor_atual: taxa_ocupacao, valor_referencia: BENCHMARK.taxa_ocupacao.p50 })
  }

  if (folha_sobre_receita > BENCHMARK.folha_sobre_receita.p75) {
    alertas.push({ tipo: 'ATENCAO', codigo: 'FOLHA_ALTA',
      mensagem: `Folha/receita ${folha_sobre_receita}% acima do P75 de mercado`,
      valor_atual: folha_sobre_receita, valor_referencia: BENCHMARK.folha_sobre_receita.p50 })
  }

  return {
    capacidade_maxima_sessoes, taxa_ocupacao, faturamento_liquido,
    faturamento_potencial, perda_faturamento, custo_total, custo_por_sessao,
    receita_por_sessao, margem_operacional, margem_percentual, taxa_glosa,
    custo_insumos_por_sessao, folha_sobre_receita, perda_coagulacao, alertas,
  }
}

export function calcularScore(d: DadosEntrada, ind: IndicadoresCalculados): ScoreFinanceiro {
  // Existência (10%) — dados foram preenchidos e são positivos
  const camposObrigatorios = [d.pacientes, d.sessoes_realizadas, d.faturamento_bruto, d.custo_insumos]
  const existencia = camposObrigatorios.every(v => v > 0) ? 100 : 40

  // Confiabilidade (25%) — dados internamente consistentes
  let confiabilidade = 100
  if (d.sessoes_faturadas > d.sessoes_realizadas) confiabilidade -= 40
  if (d.faturamento_bruto < d.total_glosas) confiabilidade -= 40
  if (d.custo_insumos <= 0) confiabilidade -= 20
  if (d.pacientes > 0 && d.sessoes_realizadas < d.pacientes) confiabilidade -= 10
  confiabilidade = Math.max(0, confiabilidade)

  // Coerência (25%) — indicadores dentro de faixas plausíveis
  let coerencia = 100
  if (ind.custo_por_sessao > BENCHMARK.custo_por_sessao.p75 * 1.5) coerencia -= 30
  else if (ind.custo_por_sessao > BENCHMARK.custo_por_sessao.p75) coerencia -= 15
  if (ind.taxa_glosa > 15) coerencia -= 30
  else if (ind.taxa_glosa > BENCHMARK.taxa_glosa.p75) coerencia -= 15
  if (ind.taxa_ocupacao > 100) coerencia -= 40
  coerencia = Math.max(0, coerencia)

  // Eficiência (40%) — performance econômica real
  let eficiencia = 0
  // Ocupação (0-25 pts)
  if (ind.taxa_ocupacao >= BENCHMARK.taxa_ocupacao.p75) eficiencia += 25
  else if (ind.taxa_ocupacao >= BENCHMARK.taxa_ocupacao.p50) eficiencia += 18
  else if (ind.taxa_ocupacao >= BENCHMARK.taxa_ocupacao.p25) eficiencia += 10
  // Margem (0-35 pts)
  if (ind.margem_percentual >= BENCHMARK.margem_percentual.p75) eficiencia += 35
  else if (ind.margem_percentual >= BENCHMARK.margem_percentual.p50) eficiencia += 25
  else if (ind.margem_percentual >= BENCHMARK.margem_percentual.p25) eficiencia += 15
  else if (ind.margem_percentual >= 0) eficiencia += 5
  // Glosa (0-20 pts)
  if (ind.taxa_glosa <= BENCHMARK.taxa_glosa.p25) eficiencia += 20
  else if (ind.taxa_glosa <= BENCHMARK.taxa_glosa.p50) eficiencia += 14
  else if (ind.taxa_glosa <= BENCHMARK.taxa_glosa.p75) eficiencia += 7
  // Custo (0-20 pts)
  if (ind.custo_por_sessao <= BENCHMARK.custo_por_sessao.p25) eficiencia += 20
  else if (ind.custo_por_sessao <= BENCHMARK.custo_por_sessao.p50) eficiencia += 14
  else if (ind.custo_por_sessao <= BENCHMARK.custo_por_sessao.p75) eficiencia += 7

  // Score final ponderado
  const score_final = round2(
    existencia * 0.10 +
    confiabilidade * 0.25 +
    coerencia * 0.25 +
    eficiencia * 0.40
  )

  const classificacao =
    score_final >= 85 ? 'EFICIENTE' :
    score_final >= 60 ? 'PARCIALMENTE_EFICIENTE' : 'INEFICIENTE'

  return {
    score_existencia: round2(existencia),
    score_confiabilidade: round2(confiabilidade),
    score_coerencia: round2(coerencia),
    score_eficiencia: round2(eficiencia),
    score_final,
    classificacao,
  }
}

export function identificarPerdas(d: DadosEntrada, ind: IndicadoresCalculados): PerdaIdentificada[] {
  const perdas: PerdaIdentificada[] = []
  const valorMedioSessao = d.sessoes_faturadas > 0 ? d.faturamento_bruto / d.sessoes_faturadas : 0

  if (ind.taxa_glosa > BENCHMARK.taxa_glosa.p50) {
    const glosa_excesso = round2((ind.taxa_glosa - BENCHMARK.taxa_glosa.p50) / 100 * d.faturamento_bruto)
    perdas.push({
      tipo: 'GLOSA_EXCESSIVA',
      descricao: `Taxa de glosa ${ind.taxa_glosa}% acima da mediana de mercado (${BENCHMARK.taxa_glosa.p50}%). Perda estimada vs. benchmark.`,
      valor_estimado: glosa_excesso,
      prioridade: ind.taxa_glosa > BENCHMARK.taxa_glosa.p75 ? 'CRITICA' : 'ALTA',
    })
  }

  if (ind.taxa_ocupacao < BENCHMARK.taxa_ocupacao.p50) {
    const sessoes_ociosas = Math.round(ind.capacidade_maxima_sessoes * (BENCHMARK.taxa_ocupacao.p50 - ind.taxa_ocupacao) / 100)
    const perda_ociosidade = round2(sessoes_ociosas * valorMedioSessao)
    perdas.push({
      tipo: 'OCIOSIDADE',
      descricao: `${sessoes_ociosas} sessões ociosas/mês vs. mediana de ocupação. Receita potencial não realizada.`,
      valor_estimado: perda_ociosidade,
      prioridade: ind.taxa_ocupacao < 70 ? 'CRITICA' : 'ALTA',
    })
  }

  if (ind.custo_por_sessao > BENCHMARK.custo_por_sessao.p50 && d.sessoes_realizadas > 0) {
    const custo_excesso = round2((ind.custo_por_sessao - BENCHMARK.custo_por_sessao.p50) * d.sessoes_realizadas)
    perdas.push({
      tipo: 'CUSTO_EXCESSIVO',
      descricao: `Custo/sessão R$ ${ind.custo_por_sessao} acima do P50 (R$ ${BENCHMARK.custo_por_sessao.p50}). Impacto mensal estimado.`,
      valor_estimado: custo_excesso,
      prioridade: ind.custo_por_sessao > BENCHMARK.custo_por_sessao.p75 ? 'CRITICA' : 'MODERADA',
    })
  }

  return perdas
}

export function identificarOportunidades(d: DadosEntrada, ind: IndicadoresCalculados): OportunidadeIdentificada[] {
  const oportunidades: OportunidadeIdentificada[] = []
  const valorMedioSessao = d.sessoes_faturadas > 0 ? d.faturamento_bruto / d.sessoes_faturadas : 0

  if (ind.taxa_glosa > BENCHMARK.taxa_glosa.p25) {
    const ganho = round2((ind.taxa_glosa - BENCHMARK.taxa_glosa.p25) / 100 * d.faturamento_bruto * 0.6)
    oportunidades.push({
      tipo: 'RECUPERACAO_GLOSA',
      descricao: `Implementando auditoria prévia de APAC é possível reduzir glosa para próximo do P25 de mercado.`,
      ganho_estimado: ganho,
      prioridade: 'ALTA',
    })
  }

  if (ind.taxa_ocupacao < BENCHMARK.taxa_ocupacao.p75) {
    const sessoes_potenciais = Math.round(
      ind.capacidade_maxima_sessoes * (BENCHMARK.taxa_ocupacao.p75 - ind.taxa_ocupacao) / 100
    )
    const ganho = round2(sessoes_potenciais * valorMedioSessao * 0.5)
    oportunidades.push({
      tipo: 'AUMENTO_OCUPACAO',
      descricao: `Plano de expansão de ocupação pode recuperar até ${sessoes_potenciais} sessões/mês.`,
      ganho_estimado: ganho,
      prioridade: 'MODERADA',
    })
  }

  if (ind.custo_insumos_por_sessao > BENCHMARK.custo_insumos_por_sessao.p50 && d.sessoes_realizadas > 0) {
    const ganho = round2(
      (ind.custo_insumos_por_sessao - BENCHMARK.custo_insumos_por_sessao.p50) * d.sessoes_realizadas * 0.7
    )
    oportunidades.push({
      tipo: 'REDUCAO_CUSTO_INSUMO',
      descricao: `Padronização e renegociação de insumos pode reduzir custo/sessão ao nível do P50 de mercado.`,
      ganho_estimado: ganho,
      prioridade: 'ALTA',
    })
  }

  return oportunidades
}

export function executarMotorFinanceiro(dados: DadosEntrada): ResultadoMotorFinanceiro {
  const indicadores = calcularIndicadores(dados)
  const score = calcularScore(dados, indicadores)
  const perdas = identificarPerdas(dados, indicadores)
  const oportunidades = identificarOportunidades(dados, indicadores)
  return { indicadores, score, perdas, oportunidades }
}
