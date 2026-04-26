import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dadosFinanceirosSchema } from '@/lib/validators/schemas'
import { executarMotorFinanceiro } from '@/lib/motores/financeiro'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const clienteId = searchParams.get('clienteId')
    const mes = searchParams.get('mes')

    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC && session.user.clienteId !== clienteId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const dados = await prisma.dadosFinanceiros.findMany({
      where: {
        ...(clienteId ? { cliente_id: clienteId } : {}),
        ...(mes ? { mes_referencia: new Date(mes) } : {}),
      },
      include: { indicadores: true, score: true, perdas: true, oportunidades: true },
      orderBy: { mes_referencia: 'desc' },
    })

    return NextResponse.json(dados)
  } catch (error) {
    console.error('[GET /api/dados-financeiros]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const parsed = dadosFinanceirosSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Executar motor financeiro
    const resultado = executarMotorFinanceiro({
      pacientes:           data.pacientes,
      sessoes_realizadas:  data.sessoes_realizadas,
      sessoes_faturadas:   data.sessoes_faturadas,
      sessoes_perdidas:    data.sessoes_perdidas,
      faturamento_bruto:   Number(data.faturamento_bruto),
      total_glosas:        Number(data.total_glosas),
      custo_insumos:       Number(data.custo_insumos),
      custo_mao_obra:      Number(data.custo_mao_obra),
      custo_manutencao:    Number(data.custo_manutencao),
      custo_agua:          Number(data.custo_agua),
      outros_custos:       Number(data.outros_custos),
      maquinas:            data.maquinas,
      turnos_dia:          data.turnos_dia,
      dias_funcionamento:  data.dias_funcionamento,
    })

    const { indicadores, score, perdas, oportunidades } = resultado

    // Persistir tudo em transação
    const registrado = await prisma.$transaction(async (tx) => {
      // Dados brutos
      const df = await tx.dadosFinanceiros.create({
        data: {
          cliente_id:          data.cliente_id,
          contrato_id:         data.contrato_id,
          mes_referencia:      new Date(data.mes_referencia),
          pacientes:           data.pacientes,
          sessoes_realizadas:  data.sessoes_realizadas,
          sessoes_faturadas:   data.sessoes_faturadas,
          sessoes_perdidas:    data.sessoes_perdidas,
          faturamento_bruto:   data.faturamento_bruto,
          total_glosas:        data.total_glosas,
          custo_insumos:       data.custo_insumos,
          custo_mao_obra:      data.custo_mao_obra,
          custo_manutencao:    data.custo_manutencao,
          custo_agua:          data.custo_agua,
          outros_custos:       data.outros_custos,
          maquinas:            data.maquinas,
          turnos_dia:          data.turnos_dia,
          dias_funcionamento:  data.dias_funcionamento,
          fonte_pagadora:      data.fonte_pagadora,
        }
      })

      // Indicadores calculados
      await tx.indicadorFinanceiro.create({
        data: {
          dados_financeiros_id:     df.id,
          capacidade_maxima_sessoes: indicadores.capacidade_maxima_sessoes,
          taxa_ocupacao:            indicadores.taxa_ocupacao,
          faturamento_liquido:      indicadores.faturamento_liquido,
          faturamento_potencial:    indicadores.faturamento_potencial,
          perda_faturamento:        indicadores.perda_faturamento,
          custo_total:              indicadores.custo_total,
          custo_por_sessao:         indicadores.custo_por_sessao,
          receita_por_sessao:       indicadores.receita_por_sessao,
          margem_operacional:       indicadores.margem_operacional,
          margem_percentual:        indicadores.margem_percentual,
          taxa_glosa:               indicadores.taxa_glosa,
          custo_insumos_por_sessao: indicadores.custo_insumos_por_sessao,
          folha_sobre_receita:      indicadores.folha_sobre_receita,
          perda_coagulacao:         indicadores.perda_coagulacao,
          alerta_principal:         indicadores.alertas[0]?.mensagem ?? null,
        }
      })

      // Score financeiro
      await tx.scoreFinanceiro.create({
        data: {
          dados_financeiros_id: df.id,
          score_existencia:     score.score_existencia,
          score_confiabilidade: score.score_confiabilidade,
          score_coerencia:      score.score_coerencia,
          score_eficiencia:     score.score_eficiencia,
          score_final:          score.score_final,
          classificacao:        score.classificacao,
        }
      })

      // Perdas identificadas
      for (const perda of perdas) {
        await tx.perdaFinanceira.create({
          data: {
            cliente_id:          data.cliente_id,
            contrato_id:         data.contrato_id,
            dados_financeiros_id: df.id,
            mes_referencia:      new Date(data.mes_referencia),
            tipo_perda:          perda.tipo as any,
            descricao:           perda.descricao,
            valor_estimado:      perda.valor_estimado,
            prioridade:          perda.prioridade,
          }
        })
      }

      // Oportunidades identificadas
      for (const op of oportunidades) {
        await tx.oportunidadeFinanceira.create({
          data: {
            cliente_id:          data.cliente_id,
            contrato_id:         data.contrato_id,
            dados_financeiros_id: df.id,
            mes_referencia:      new Date(data.mes_referencia),
            tipo_ganho:          op.tipo as any,
            descricao:           op.descricao,
            ganho_estimado:      op.ganho_estimado,
            prioridade:          op.prioridade,
          }
        })
      }

      // Snapshot econômico
      await tx.snapshotEconomico.create({
        data: {
          dados_financeiros_id: df.id,
          cliente_id:           data.cliente_id,
          periodo_mes:          new Date(data.mes_referencia).getMonth() + 1,
          periodo_ano:          new Date(data.mes_referencia).getFullYear(),
          snapshot_data:        { indicadores, score, perdas, oportunidades } as any,
        }
      })

      return df
    })

    return NextResponse.json({
      id: registrado.id,
      indicadores,
      score,
      perdas,
      oportunidades,
      alertas: indicadores.alertas,
    }, { status: 201 })

  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Dados financeiros já registrados para este mês' }, { status: 409 })
    }
    console.error('[POST /api/dados-financeiros]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
