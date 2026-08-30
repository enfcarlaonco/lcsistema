// src/app/api/matriz-gut/route.ts
// Matriz GUT — priorização de problemas (Gravidade x Urgência x Tendência)
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
    const status = searchParams.get('status')
    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)

    if (!isLC && !session.user.clienteId) {
      return NextResponse.json([], { status: 200 })
    }

    const itens = await prisma.matrizGut.findMany({
      where: {
        ...(clienteId ? { cliente_id: clienteId } : {}),
        ...(!isLC ? { cliente_id: session.user.clienteId ?? undefined } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        cliente: { select: { id: true, nome: true } },
      },
      orderBy: [{ gut_score: 'desc' }, { created_at: 'desc' }],
    })

    return NextResponse.json(itens)
  } catch (error) {
    console.error('[GET /api/matriz-gut]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const {
      cliente_id, contrato_id, questionario_id, problema, area,
      gravidade, urgencia, tendencia, responsavel, prazo_acao,
      observacoes, nc_id, documento_ref_id,
    } = body

    if (!cliente_id || !problema) {
      return NextResponse.json({ error: 'Cliente e descrição do problema são obrigatórios.' }, { status: 400 })
    }

    const g = Number(gravidade)
    const u = Number(urgencia)
    const t = Number(tendencia)
    if (![g, u, t].every(n => Number.isInteger(n) && n >= 1 && n <= 5)) {
      return NextResponse.json({ error: 'Gravidade, urgência e tendência devem ser números inteiros de 1 a 5.' }, { status: 400 })
    }

    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC && session.user.clienteId !== cliente_id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
    }

    const item = await prisma.matrizGut.create({
      data: {
        cliente_id,
        contrato_id: contrato_id ?? null,
        questionario_id: questionario_id ?? null,
        problema,
        area: area ?? null,
        gravidade: g,
        urgencia: u,
        tendencia: t,
        gut_score: g * u * t,
        responsavel: responsavel ?? null,
        prazo_acao: prazo_acao ? new Date(prazo_acao) : null,
        observacoes: observacoes ?? null,
        origem: 'MANUAL',
        nc_id: nc_id ?? null,
        documento_ref_id: documento_ref_id ?? null,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/matriz-gut]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
