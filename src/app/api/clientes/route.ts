export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteSchema } from '@/lib/validators/schemas'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)

    const clientes = await prisma.cliente.findMany({
      where: isLC ? {} : { id: session.user.clienteId ?? undefined },
      include: {
        modalidades: true,
        contratos: {
          where: { status: 'ATIVO' },
          take: 1,
          orderBy: { data_inicio: 'desc' },
        },
        _count: {
          select: { acoes_corretivas: { where: { status: { not: 'CONCLUIDA' } } } }
        }
      },
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('[GET /api/clientes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = clienteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
    }

    const cliente = await prisma.cliente.create({ data: parsed.data })
    return NextResponse.json(cliente, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'CNPJ já cadastrado' }, { status: 409 })
    }
    console.error('[POST /api/clientes]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
