import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { avaliacaoDocumentoSchema } from '@/lib/validators/schemas'
import { calcularScoreDocumental } from '@/lib/motores/documental'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = avaliacaoDocumentoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Calcular score documental
    const resultado = calcularScoreDocumental(data.criterios.map(c => ({
      criterio_id: c.criterio_validacao_id,
      dimensao:    c.dimensao,
      peso:        c.peso,
      resposta:    c.resposta,
      obrigatorio: c.obrigatorio,
    })))

    // Persistir em transação
    const avaliacao = await prisma.$transaction(async (tx) => {
      const av = await tx.avaliacaoDocumento.create({
        data: {
          cliente_id:           data.cliente_id,
          contrato_id:          data.contrato_id,
          documento_enviado_id: data.documento_enviado_id,
          avaliador_usuario_id: session.user.id,
          score_final:          resultado.score_final,
          classificacao:        resultado.classificacao,
          risco_assistencial:   resultado.risco_assistencial,
          risco_operacional:    resultado.risco_operacional,
          risco_regulatorio:    resultado.risco_regulatorio,
          impacto_economico_final: resultado.impacto_economico,
          observacao_geral:     data.observacao_geral,
        }
      })

      // Salvar respostas por critério
      for (const c of data.criterios) {
        const valorResposta = c.resposta === 'SIM' ? c.peso :
                              c.resposta === 'PARCIAL' ? c.peso * 0.5 : 0

        await tx.avaliacaoCriterio.create({
          data: {
            avaliacao_documento_id: av.id,
            criterio_validacao_id:  c.criterio_validacao_id,
            resposta:               c.resposta,
            pontuacao_obtida:       valorResposta,
            comentario:             c.comentario,
          }
        })
      }

      // Atualizar status do documento
      await tx.documentoEnviado.update({
        where: { id: data.documento_enviado_id },
        data: {
          status_documento: resultado.classificacao === 'CONFORME' ? 'APROVADO' : 'REPROVADO'
        }
      })

      return av
    })

    return NextResponse.json({ id: avaliacao.id, ...resultado }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/avaliacoes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
