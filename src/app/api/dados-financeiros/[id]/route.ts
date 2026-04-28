export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const dado = await prisma.dadosFinanceiros.findUnique({
      where: { id: params.id },
      include: {
        cliente: { select: { id: true, nome: true } },
        indicadores: true,
        score: true,
        perdas: true,
        oportunidades: true,
      },
    })

    if (!dado) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    return NextResponse.json(dado)
  } catch (error) {
    console.error('[GET /api/dados-financeiros/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.perdaFinanceira.deleteMany({ where: { dados_financeiros_id: params.id } })
      await tx.oportunidadeFinanceira.deleteMany({ where: { dados_financeiros_id: params.id } })
      await tx.indicadorFinanceiro.deleteMany({ where: { dados_financeiros_id: params.id } })
      await tx.scoreFinanceiro.deleteMany({ where: { dados_financeiros_id: params.id } })
      await tx.snapshotEconomico.deleteMany({ where: { dados_financeiros_id: params.id } })
      await tx.dadosFinanceiros.delete({ where: { id: params.id } })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/dados-financeiros/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
