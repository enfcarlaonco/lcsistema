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

    if (!questionario) {
      return NextResponse.json({ error: 'Questionário não encontrado' }, { status: 404 })
    }

    // Carregar blocos e perguntas ativos
    const blocosAtivos = questionario.blocos_ativos as string[]
    const blocos = await prisma.blocoQuestionario.findMany({
      where: { codigo: { in: blocosAtivos }, ativo: true },
      include: {
        perguntas: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
        }
      },
      orderBy: { ordem: 'asc' },
    })

    // Mapear respostas existentes por pergunta
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
