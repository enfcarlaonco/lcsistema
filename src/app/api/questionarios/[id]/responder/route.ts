export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { pergunta_id, bloco_codigo, valor_texto, valor_numero, valor_boolean, valor_multiplo } = await req.json()

    const questionario = await prisma.questionario.findUnique({ where: { id: params.id } })
    if (!questionario) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    // Upsert da resposta
    await prisma.respostaQuestionario.upsert({
      where: { questionario_id_pergunta_id: { questionario_id: params.id, pergunta_id } },
      update: { valor_texto, valor_numero, valor_boolean, valor_multiplo, respondida_at: new Date() },
      create: {
        questionario_id: params.id,
        pergunta_id,
        respondido_por: session.user.id,
        valor_texto, valor_numero, valor_boolean, valor_multiplo,
      }
    })

    // Atualizar progresso do bloco
    const bloco = await prisma.blocoQuestionario.findFirst({ where: { codigo: bloco_codigo } })
    if (bloco) {
      const totalRespondidas = await prisma.respostaQuestionario.count({
        where: {
          questionario_id: params.id,
          pergunta: { bloco_id: bloco.id }
        }
      })
      const totalPerguntas = await prisma.pergunta.count({
        where: { bloco_id: bloco.id, ativo: true }
      })
      const pct = totalPerguntas > 0 ? Math.round((totalRespondidas / totalPerguntas) * 100) : 0

      await prisma.progressoBloco.updateMany({
        where: { questionario_id: params.id, bloco_id: bloco.id },
        data: { respondidas: totalRespondidas, pct_completo: pct }
      })
    }

    // Se B0 foi respondido, ativar B4 se modalidades de HD/DP presentes
    if (bloco_codigo === 'B0' && valor_multiplo) {
      const modalidadesHDDP = ['HD_CRONICO_AMBULATORIAL','HD_AGUDO_AMBULATORIAL','HD_INTERNADO','DP_CAPD','DP_DPA']
      const temHDDP = (valor_multiplo as string[]).some(m => modalidadesHDDP.includes(m))

      const blocosAtivos = questionario.blocos_ativos as string[]
      if (temHDDP && !blocosAtivos.includes('B4')) {
        const novoBlocos = [...blocosAtivos, 'B4']
        await prisma.questionario.update({
          where: { id: params.id },
          data: { blocos_ativos: novoBlocos }
        })
        await prisma.progressoBloco.updateMany({
          where: {
            questionario_id: params.id,
            bloco: { codigo: 'B4' }
          },
          data: { bloco_ativo: true }
        })
      }
    }

    // Calcular progresso geral
    const totalRespondidas = await prisma.respostaQuestionario.count({
      where: { questionario_id: params.id }
    })
    const blocosAtivosAtuais = (await prisma.questionario.findUnique({
      where: { id: params.id }
    }))?.blocos_ativos as string[]

    const totalPerguntas = await prisma.pergunta.count({
      where: { bloco: { codigo: { in: blocosAtivosAtuais }, ativo: true }, ativo: true }
    })
    const pctGeral = totalPerguntas > 0 ? Math.round((totalRespondidas / totalPerguntas) * 100) : 0

    await prisma.questionario.update({
      where: { id: params.id },
      data: {
        pct_completo: pctGeral,
        status: pctGeral === 100 ? 'AGUARDANDO_VALIDACAO' : 'EM_ANDAMENTO',
        iniciado_at: questionario.iniciado_at ?? new Date(),
      }
    })

    return NextResponse.json({ ok: true, pct_completo: pctGeral })
  } catch (error) {
    console.error('[POST /api/questionarios/[id]/responder]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
