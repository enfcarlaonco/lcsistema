// src/app/api/checklist-ona/[id]/route.ts
// PATCH — atualiza status/evidência/responsável de um item do checklist ONA
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: { id: string } }

const STATUS_VALIDOS = ['NAO_AVALIADO', 'CONFORME', 'PARCIAL', 'NAO_CONFORME', 'EM_ELABORACAO', 'NAO_SE_APLICA']

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const item = await prisma.checklistOna.findUnique({ where: { id: params.id } })
    if (!item) return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 })

    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC && session.user.clienteId !== item.cliente_id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
    }

    const body = await req.json()
    const { status, responsavel, local_evidencia, data_verificacao, proxima_acao, observacoes } = body

    if (status !== undefined && !STATUS_VALIDOS.includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    const atualizacoes: Record<string, any> = {}
    if (status !== undefined) atualizacoes.status = status
    if (responsavel !== undefined) atualizacoes.responsavel = responsavel
    if (local_evidencia !== undefined) atualizacoes.local_evidencia = local_evidencia
    if (data_verificacao !== undefined) atualizacoes.data_verificacao = data_verificacao ? new Date(data_verificacao) : null
    if (proxima_acao !== undefined) atualizacoes.proxima_acao = proxima_acao
    if (observacoes !== undefined) atualizacoes.observacoes = observacoes

    const atualizado = await prisma.checklistOna.update({
      where: { id: params.id },
      data: atualizacoes,
    })

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error('[PATCH /api/checklist-ona/[id]]', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
