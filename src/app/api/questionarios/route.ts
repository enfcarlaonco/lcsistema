export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const clienteId = searchParams.get('clienteId')
    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)

    const questionarios = await prisma.questionario.findMany({
      where: {
        ...(clienteId ? { cliente_id: clienteId } : {}),
        ...(!isLC ? { cliente_id: session.user.clienteId ?? undefined } : {}),
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        contrato: { select: { id: true, data_inicio: true, data_fim: true } },
        progresso: true,
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json(questionarios)
  } catch (error) {
    console.error('[GET /api/questionarios]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { cliente_id, contrato_id } = await req.json()
    if (!cliente_id || !contrato_id) {
      return NextResponse.json({ error: 'cliente_id e contrato_id obrigatórios' }, { status: 400 })
    }

    const blocos = await prisma.blocoQuestionario.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
    })

    const blocosAtivos = blocos.map(b => b.codigo)

    const questionario = await prisma.$transaction(async (tx) => {
      const q = await tx.questionario.create({
        data: {
          cliente_id,
          contrato_id,
          blocos_ativos: blocosAtivos,
          status: 'NAO_INICIADO',
        }
      })

      for (const bloco of blocos) {
        const perguntas = await tx.pergunta.count({
          where: { bloco_id: bloco.id, ativo: true }
        })
        await tx.progressoBloco.create({
          data: {
            questionario_id: q.id,
            bloco_id: bloco.id,
            total_perguntas: perguntas,
            bloco_ativo: true,
          }
        })
      }

      return q
    })

    return NextResponse.json(questionario, { status: 201 })
  } catch (error) {
    console.error('[POST /api/questionarios]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}