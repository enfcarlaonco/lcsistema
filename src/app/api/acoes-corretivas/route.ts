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
    const prioridade = searchParams.get('prioridade')
    const status = searchParams.get('status')
    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)

    const acoes = await prisma.acaoCorretiva.findMany({
      where: {
        ...(clienteId ? { cliente_id: clienteId } : {}),
        ...(!isLC ? { cliente_id: session.user.clienteId ?? undefined } : {}),
        ...(prioridade ? { prioridade: prioridade as any } : {}),
        ...(status ? { status: status as any } : { status: { not: 'CONCLUIDA' } }),
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
      },
      orderBy: [{ prioridade: 'asc' }, { prazo: 'asc' }],
    })

    return NextResponse.json(acoes)
  } catch (error) {
    console.error('[GET /api/acoes-corretivas]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
