export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const { status, resultado_realizado, evidencias } = body

    const acao = await prisma.acaoCorretiva.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(resultado_realizado !== undefined ? { resultado_realizado } : {}),
        ...(evidencias ? { evidencias } : {}),
        ...(status === 'CONCLUIDA' ? { concluida_at: new Date() } : {}),
      }
    })

    return NextResponse.json(acao)
  } catch (error) {
    console.error('[PATCH /api/acoes-corretivas/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
