import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteSchema } from '@/lib/validators/schemas'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC && session.user.clienteId !== params.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        modalidades: true,
        contratos: { orderBy: { data_inicio: 'desc' } },
        dados_financeiros: {
          orderBy: { mes_referencia: 'desc' },
          take: 6,
          include: { indicadores: true, score: true },
        },
        nao_conformidades: {
          where: { status: { not: 'RESOLVIDA' } },
          orderBy: { nivel: 'asc' },
        },
        acoes_corretivas: {
          where: { status: { not: 'CONCLUIDA' } },
          orderBy: { prioridade: 'asc' },
          take: 10,
        },
      },
    })

    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    return NextResponse.json(cliente)
  } catch (error) {
    console.error('[GET /api/clientes/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = clienteSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
    }

    const cliente = await prisma.cliente.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json(cliente)
  } catch (error) {
    console.error('[PUT /api/clientes/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
