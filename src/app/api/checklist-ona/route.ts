// src/app/api/checklist-ona/route.ts
// Lista os itens do checklist de preparação ONA de um cliente
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
    const documentoBase = searchParams.get('documentoBase')
    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)

    const clienteAlvo = isLC ? clienteId : session.user.clienteId
    if (!clienteAlvo) {
      return NextResponse.json({ itens: [], resumo: null })
    }
    if (!isLC && clienteId && clienteId !== session.user.clienteId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
    }

    const itens = await prisma.checklistOna.findMany({
      where: {
        cliente_id: clienteAlvo,
        ...(status ? { status } : {}),
        ...(documentoBase ? { documento_base: documentoBase } : {}),
      },
      orderBy: [{ documento_base: 'asc' }, { ona_id: 'asc' }],
    })

    const resumo = {
      total: itens.length,
      conforme: itens.filter(i => i.status === 'CONFORME').length,
      parcial: itens.filter(i => i.status === 'PARCIAL').length,
      nao_conforme: itens.filter(i => i.status === 'NAO_CONFORME').length,
      em_elaboracao: itens.filter(i => i.status === 'EM_ELABORACAO').length,
      nao_se_aplica: itens.filter(i => i.status === 'NAO_SE_APLICA').length,
      nao_avaliado: itens.filter(i => i.status === 'NAO_AVALIADO').length,
    }

    return NextResponse.json({ itens, resumo })
  } catch (error) {
    console.error('[GET /api/checklist-ona]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
