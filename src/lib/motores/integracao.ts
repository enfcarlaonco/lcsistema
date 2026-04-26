/**
 * Motor de Integração — LC Sistema
 * Cruza falhas documentais com exposição financeira
 * e gera impacto integrado + ações corretivas prioritizadas
 */

import { ResultadoDocumental } from './documental'
import { IndicadoresCalculados, ScoreFinanceiro } from './financeiro'

export interface ImpactoIntegrado {
  tipo_falha: string
  descricao_falha: string
  peso_falha: 1 | 2 | 3
  gravidade_risco: 1 | 2 | 3
  exposicao_financeira: 1 | 2 | 3
  impacto_score: number  // 1-9
  impacto_financeiro_estimado: number
  prioridade: 'CRITICA' | 'ALTA' | 'MODERADA' | 'BAIXA'
  acao_recomendada: string
}

export interface AcaoGerada {
  origem: 'DOCUMENTAL' | 'FINANCEIRA' | 'INTEGRADA'
  titulo: string
  descricao: string
  prioridade: 'CRITICA' | 'ALTA' | 'MODERADA' | 'BAIXA'
  prazo_dias: number
  impacto_estimado: number
}

function calcularPrioridade(score: number): 'CRITICA' | 'ALTA' | 'MODERADA' | 'BAIXA' {
  if (score >= 7) return 'CRITICA'
  if (score >= 4) return 'ALTA'
  if (score >= 2) return 'MODERADA'
  return 'BAIXA'
}

function prazoParaPrioridade(p: string): number {
  const prazos: Record<string, number> = { CRITICA: 15, ALTA: 30, MODERADA: 60, BAIXA: 90 }
  return prazos[p] ?? 60
}

export function calcularImpactoIntegrado(
  documental: ResultadoDocumental,
  financeiro: IndicadoresCalculados,
  scoreFinanceiro: ScoreFinanceiro,
  perdaFinanceiraTotal: number
): ImpactoIntegrado[] {
  const impactos: ImpactoIntegrado[] = []

  // Peso da falha documental
  const peso_falha: 1 | 2 | 3 =
    documental.classificacao === 'NAO_CONFORME' ? 3 :
    documental.classificacao === 'PARCIAL' ? 2 : 1

  // Gravidade do risco assistencial
  const gravidade_risco: 1 | 2 | 3 =
    documental.risco_assistencial === 'ALTO' ? 3 :
    documental.risco_assistencial === 'MEDIO' ? 2 : 1

  // Exposição financeira baseada em perdas identificadas
  const exposicao_financeira: 1 | 2 | 3 =
    perdaFinanceiraTotal > 20000 ? 3 :
    perdaFinanceiraTotal > 8000  ? 2 : 1

  if (peso_falha > 1 || exposicao_financeira > 1) {
    const score = peso_falha * gravidade_risco * exposicao_financeira
    const prioridade = calcularPrioridade(score)

    impactos.push({
      tipo_falha: 'FALHA_DOCUMENTAL_FINANCEIRA',
      descricao_falha: `Score documental ${documental.score_final}/100 (${documental.classificacao}) com exposição financeira de R$ ${perdaFinanceiraTotal.toFixed(0)}/mês`,
      peso_falha,
      gravidade_risco,
      exposicao_financeira,
      impacto_score: score,
      impacto_financeiro_estimado: Math.round(perdaFinanceiraTotal * (peso_falha / 3)),
      prioridade,
      acao_recomendada: prioridade === 'CRITICA'
        ? 'Intervenção imediata: regularizar documentação crítica e iniciar auditoria financeira em paralelo'
        : prioridade === 'ALTA'
        ? 'Priorizar regularização documental com foco nos processos de maior impacto financeiro'
        : 'Monitorar e incluir no próximo ciclo de intervenção',
    })
  }

  // Impacto específico de glosa + documentação
  if (financeiro.taxa_glosa > 5 && documental.risco_regulatorio === 'ALTO') {
    impactos.push({
      tipo_falha: 'GLOSA_DOCUMENTAL',
      descricao_falha: `Taxa de glosa ${financeiro.taxa_glosa}% combinada com risco regulatório alto — documentação insuficiente para suportar o faturamento`,
      peso_falha: 3,
      gravidade_risco: 3,
      exposicao_financeira: exposicao_financeira,
      impacto_score: 9,
      impacto_financeiro_estimado: Math.round(financeiro.taxa_glosa / 100 * 1000 * 480),
      prioridade: 'CRITICA',
      acao_recomendada: 'Auditoria de APAC + regularização imediata dos documentos de controle de sessão (folha de sala, prescrição)',
    })
  }

  return impactos
}

export function gerarAcoesCorretivas(
  documental: ResultadoDocumental,
  financeiro: IndicadoresCalculados,
  scoreFinanceiro: ScoreFinanceiro,
  impactos: ImpactoIntegrado[]
): AcaoGerada[] {
  const acoes: AcaoGerada[] = []

  // Ações documentais
  if (documental.classificacao !== 'CONFORME') {
    const prioridade = documental.classificacao === 'NAO_CONFORME' ? 'CRITICA' : 'ALTA'
    acoes.push({
      origem: 'DOCUMENTAL',
      titulo: 'Regularização da documentação assistencial',
      descricao: `Score documental ${documental.score_final}/100. ${documental.criterios_criticos_falhos.length} critérios obrigatórios com falha. Elaborar e validar os documentos ausentes ou desatualizados.`,
      prioridade,
      prazo_dias: prazoParaPrioridade(prioridade),
      impacto_estimado: 0,
    })
  }

  // Ações financeiras
  if (financeiro.taxa_glosa > 5) {
    acoes.push({
      origem: 'FINANCEIRA',
      titulo: 'Implementar auditoria prévia de APAC',
      descricao: `Taxa de glosa ${financeiro.taxa_glosa}% — implementar rotina de verificação pré-submissão das APACs para reduzir glosas evitáveis.`,
      prioridade: financeiro.taxa_glosa > 8 ? 'CRITICA' : 'ALTA',
      prazo_dias: 30,
      impacto_estimado: Math.round(financeiro.taxa_glosa / 100 * 0.4 * 100000),
    })
  }

  if (financeiro.taxa_ocupacao < 80) {
    acoes.push({
      origem: 'FINANCEIRA',
      titulo: 'Plano de expansão de ocupação',
      descricao: `Taxa de ocupação ${financeiro.taxa_ocupacao}% — elaborar plano de captação e remanejamento de turnos para aumentar a utilização da capacidade instalada.`,
      prioridade: financeiro.taxa_ocupacao < 70 ? 'CRITICA' : 'MODERADA',
      prazo_dias: 60,
      impacto_estimado: Math.round((80 - financeiro.taxa_ocupacao) * financeiro.receita_por_sessao * 10),
    })
  }

  if (financeiro.custo_por_sessao > 350) {
    acoes.push({
      origem: 'FINANCEIRA',
      titulo: 'Revisão e padronização de insumos',
      descricao: `Custo/sessão R$ ${financeiro.custo_por_sessao} — renegociar contratos com fornecedores e padronizar insumos para reduzir custo direto.`,
      prioridade: 'ALTA',
      prazo_dias: 45,
      impacto_estimado: Math.round((financeiro.custo_por_sessao - 340) * 480),
    })
  }

  // Ações integradas (cruzamento)
  for (const impacto of impactos) {
    if (impacto.prioridade === 'CRITICA' && impacto.tipo_falha === 'GLOSA_DOCUMENTAL') {
      acoes.push({
        origem: 'INTEGRADA',
        titulo: 'Auditoria integrada de faturamento e documentação',
        descricao: impacto.acao_recomendada,
        prioridade: 'CRITICA',
        prazo_dias: 15,
        impacto_estimado: impacto.impacto_financeiro_estimado,
      })
    }
  }

  // Ordenar por prioridade
  const ordem: Record<string, number> = { CRITICA: 0, ALTA: 1, MODERADA: 2, BAIXA: 3 }
  acoes.sort((a, b) => ordem[a.prioridade] - ordem[b.prioridade])

  return acoes
}
