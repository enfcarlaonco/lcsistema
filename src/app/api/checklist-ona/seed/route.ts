// src/app/api/checklist-ona/seed/route.ts
// POST — insere no banco os 488 itens da lista mestre de preparação ONA
// (Checklist acompanhamento ONA_.xlsx) para um cliente específico.
// Idempotente: itens já existentes (mesmo ona_id) não são duplicados nem sobrescritos.
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import checklistMaster from '@/lib/data/checklist-ona-master.json'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC) return NextResponse.json({ error: 'Apenas a LC Saúde pode carregar o checklist.' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const clienteId = body.cliente_id as string
    if (!clienteId) return NextResponse.json({ error: 'cliente_id é obrigatório.' }, { status: 400 })

    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } })
    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })

    const resultado = await prisma.checklistOna.createMany({
      data: (checklistMaster as Array<{
        ona_id: number
        documento_base: string
        secao: string | null
        requisito: string | null
        descricao: string
        categoria: string | null
        item_verificacao: string | null
        criterios: string | null
      }>).map(item => ({
        cliente_id: clienteId,
        ona_id: item.ona_id,
        documento_base: item.documento_base,
        secao: item.secao,
        requisito: item.requisito,
        descricao: item.descricao,
        categoria: item.categoria,
        item_verificacao: item.item_verificacao,
        criterios: item.criterios,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      sucesso: true,
      total_mestre: checklistMaster.length,
      inseridos: resultado.count,
      mensagem: resultado.count > 0
        ? `${resultado.count} itens do checklist ONA foram inseridos para este cliente.`
        : 'Este cliente já possui todos os itens do checklist carregados.',
    }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/checklist-ona/seed]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
