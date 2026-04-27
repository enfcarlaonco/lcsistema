export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const questionario = await prisma.questionario.findUnique({
      where: { id: params.id },
      include: {
        cliente: { select: { id: true, nome: true, tipo_servico: true } },
        contrato: { select: { id: true, data_inicio: true, data_fim: true } },
        progresso: { include: { bloco: true } },
        respostas: true,
      },
    })

    if (!questionario) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const blocosAtivos = questionario.blocos_ativos as string[]
    const blocos = await prisma.blocoQuestionario.findMany({
      where: { codigo: { in: blocosAtivos }, ativo: true },
      include: { perguntas: { where: { ativo: true }, orderBy: { ordem: 'asc' } } },
      orderBy: { ordem: 'asc' },
    })

    const respostasMap: Record<string, any> = {}
    for (const r of questionario.respostas) {
      respostasMap[r.pergunta_id] = r
    }

    return NextResponse.json({ questionario, blocos, respostasMap })
  } catch (error) {
    console.error('[GET /api/questionarios/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Deletar em cascata: respostas e progresso primeiro
    await prisma.$transaction(async (tx) => {
      await tx.respostaQuestionario.deleteMany({ where: { questionario_id: params.id } })
      await tx.progressoBloco.deleteMany({ where: { questionario_id: params.id } })
      await tx.questionario.delete({ where: { id: params.id } })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/questionarios/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
