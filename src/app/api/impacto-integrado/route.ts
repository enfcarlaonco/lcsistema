export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcularImpactoIntegrado, gerarAcoesCorretivas } from '@/lib/motores/integracao'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { avaliacao_documento_id, dados_financeiros_id } = await req.json()
    if (!avaliacao_documento_id || !dados_financeiros_id) {
      return NextResponse.json({ error: 'avaliacao_documento_id e dados_financeiros_id são obrigatórios' }, { status: 400 })
    }

    const [avaliacao, dadosFinanceiros] = await Promise.all([
      prisma.avaliacaoDocumento.findUnique({ where: { id: avaliacao_documento_id } }),
      prisma.dadosFinanceiros.findUnique({
        where: { id: dados_financeiros_id },
        include: { indicadores: true, score: true, perdas: true },
      }),
    ])

    if (!avaliacao || !dadosFinanceiros?.indicadores || !dadosFinanceiros?.score) {
      return NextResponse.json({ error: 'Registros não encontrados' }, { status: 404 })
    }

    const ind = dadosFinanceiros.indicadores
    const scoreF = dadosFinanceiros.score
    const perdaTotal = dadosFinanceiros.perdas.reduce((s, p) => s + Number(p.valor_estimado), 0)

    const resultadoDocumental = {
      score_final:             avaliacao.score_final,
      classificacao:           avaliacao.classificacao as any,
      risco_assistencial:      avaliacao.risco_assistencial as any,
      risco_operacional:       avaliacao.risco_operacional as any,
      risco_regulatorio:       avaliacao.risco_regulatorio as any,
      impacto_economico:       avaliacao.impacto_economico_final as any,
      criterios_criticos_falhos: [],
      score_existencia: 0, score_estrutura: 0, score_aplicabilidade: 0, score_impacto: 0,
    }

    const indicadoresFinanceiros = {
      taxa_glosa:          Number(ind.taxa_glosa),
      taxa_ocupacao:       Number(ind.taxa_ocupacao),
      margem_percentual:   Number(ind.margem_percentual),
      custo_por_sessao:    Number(ind.custo_por_sessao),
      receita_por_sessao:  Number(ind.receita_por_sessao),
      custo_insumos_por_sessao: Number(ind.custo_insumos_por_sessao),
      folha_sobre_receita: Number(ind.folha_sobre_receita),
      faturamento_liquido: Number(ind.faturamento_liquido),
      faturamento_potencial: Number(ind.faturamento_potencial),
      perda_faturamento:   Number(ind.perda_faturamento),
      custo_total:         Number(ind.custo_total),
      margem_operacional:  Number(ind.margem_operacional),
      perda_coagulacao:    Number(ind.perda_coagulacao),
      capacidade_maxima_sessoes: ind.capacidade_maxima_sessoes,
      alertas: [],
    }

    const scoreFinanceiro = {
      score_existencia:     Number(scoreF.score_existencia),
      score_confiabilidade: Number(scoreF.score_confiabilidade),
      score_coerencia:      Number(scoreF.score_coerencia),
      score_eficiencia:     Number(scoreF.score_eficiencia),
      score_final:          Number(scoreF.score_final),
      classificacao:        scoreF.classificacao,
    }

    const impactos = calcularImpactoIntegrado(resultadoDocumental, indicadoresFinanceiros, scoreFinanceiro, perdaTotal)
    const acoes = gerarAcoesCorretivas(resultadoDocumental, indicadoresFinanceiros, scoreFinanceiro, impactos)

    // Persistir impactos e ações
    await prisma.$transaction(async (tx) => {
      for (const imp of impactos) {
        const impactoSalvo = await tx.impactoIntegrado.create({
          data: {
            avaliacao_documento_id,
            dados_financeiros_id,
            tipo_falha:                    imp.tipo_falha,
            descricao_falha:               imp.descricao_falha,
            peso_falha:                    imp.peso_falha,
            gravidade_risco:               imp.gravidade_risco,
            exposicao_financeira:          imp.exposicao_financeira,
            impacto_score:                 imp.impacto_score,
            impacto_financeiro_estimado:   imp.impacto_financeiro_estimado,
            prioridade:                    imp.prioridade,
            acao_recomendada:              imp.acao_recomendada,
          }
        })

        // Criar ação corretiva integrada
        const acaoImpacto = acoes.find(a => a.origem === 'INTEGRADA')
        if (acaoImpacto) {
          await tx.acaoCorretiva.create({
            data: {
              cliente_id:             dadosFinanceiros.cliente_id,
              contrato_id:            dadosFinanceiros.contrato_id,
              origem:                 'INTEGRADA',
              impacto_integrado_id:   impactoSalvo.id,
              avaliacao_documento_id,
              titulo:                 acaoImpacto.titulo,
              descricao:              acaoImpacto.descricao,
              prioridade:             acaoImpacto.prioridade,
              prazo:                  new Date(Date.now() + acaoImpacto.prazo_dias * 86400000),
              impacto_estimado:       acaoImpacto.impacto_estimado,
            }
          })
        }
      }

      // Ações financeiras e documentais independentes
      for (const acao of acoes.filter(a => a.origem !== 'INTEGRADA')) {
        await tx.acaoCorretiva.create({
          data: {
            cliente_id:          dadosFinanceiros.cliente_id,
            contrato_id:         dadosFinanceiros.contrato_id,
            origem:              acao.origem,
            avaliacao_documento_id: acao.origem === 'DOCUMENTAL' ? avaliacao_documento_id : null,
            dados_financeiros_id:   acao.origem === 'FINANCEIRA'  ? dados_financeiros_id   : null,
            titulo:              acao.titulo,
            descricao:           acao.descricao,
            prioridade:          acao.prioridade,
            prazo:               new Date(Date.now() + acao.prazo_dias * 86400000),
            impacto_estimado:    acao.impacto_estimado,
          }
        })
      }
    })

    return NextResponse.json({ impactos, acoes }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/impacto-integrado]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
