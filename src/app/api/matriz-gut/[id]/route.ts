// src/app/api/matriz-gut/[id]/route.ts
// PATCH — atualiza item da Matriz GUT | DELETE — remove item (apenas LC)
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const item = await prisma.matrizGut.findUnique({ where: { id: params.id } })
    if (!item) return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 })

    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC && session.user.clienteId !== item.cliente_id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
    }

    const body = await req.json()
    const {
      problema, area, gravidade, urgencia, tendencia,
      responsavel, prazo_acao, status, observacoes,
    } = body

    const atualizacoes: Record<string, any> = {}

    if (problema !== undefined) atualizacoes.problema = problema
    if (area !== undefined) atualizacoes.area = area
    if (responsavel !== undefined) atualizacoes.responsavel = responsavel
    if (prazo_acao !== undefined) atualizacoes.prazo_acao = prazo_acao ? new Date(prazo_acao) : null
    if (status !== undefined) atualizacoes.status = status
    if (observacoes !== undefined) atualizacoes.observacoes = observacoes

    // Recalcula o score se qualquer um dos 3 pilares mudou
    const g = gravidade !== undefined ? Number(gravidade) : item.gravidade
    const u = urgencia !== undefined ? Number(urgencia) : item.urgencia
    const t = tendencia !== undefined ? Number(tendencia) : item.tendencia
    if (gravidade !== undefined || urgencia !== undefined || tendencia !== undefined) {
      if (![g, u, t].every(n => Number.isInteger(n) && n >= 1 && n <= 5)) {
        return NextResponse.json({ error: 'Gravidade, urgência e tendência devem ser números inteiros de 1 a 5.' }, { status: 400 })
      }
      atualizacoes.gravidade = g
      atualizacoes.urgencia = u
      atualizacoes.tendencia = t
      atualizacoes.gut_score = g * u * t
    }

    const atualizado = await prisma.matrizGut.update({
      where: { id: params.id },
      data: atualizacoes,
      include: { cliente: { select: { id: true, nome: true } } },
    })

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error('[PATCH /api/matriz-gut/[id]]', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC) return NextResponse.json({ error: 'Apenas a LC Saúde pode excluir itens.' }, { status: 403 })

    const item = await prisma.matrizGut.findUnique({ where: { id: params.id } })
    if (!item) return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 })

    await prisma.matrizGut.delete({ where: { id: params.id } })

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('[DELETE /api/matriz-gut/[id]]', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
