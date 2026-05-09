// src/app/api/documentos/referencia/route.ts
// Lista os documentos de referência filtrados pelo perfil do cliente
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

    // Determina o perfil do cliente para filtrar documentos
    let perfilCliente: 'CONFORMIDADE' | 'ACREDITACAO' = 'CONFORMIDADE'
    if (clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { perfil_diagnostico: true },
      })
      perfilCliente = (cliente?.perfil_diagnostico as any) ?? 'CONFORMIDADE'
    }

    // Busca documentos compatíveis com o perfil
    // CONFORMIDADE → apenas AMBOS
    // ACREDITACAO  → AMBOS + ACREDITACAO
    const perfisPermitidos = perfilCliente === 'ACREDITACAO'
      ? ['AMBOS', 'ACREDITACAO']
      : ['AMBOS']

    const documentos = await prisma.documentoReferencia.findMany({
      where: {
        ativo: true,
        perfil_requerido: { in: perfisPermitidos as any },
      },
      include: {
        tipo_documento: { select: { nome: true } },
      },
      orderBy: [
        { grau_necessidade: 'asc' },
        { area: 'asc' },
        { titulo: 'asc' },
      ],
    })

    // Agrupa por área para facilitar renderização
    const porArea: Record<string, typeof documentos> = {}
    for (const doc of documentos) {
      const area = doc.area ?? 'Geral'
      if (!porArea[area]) porArea[area] = []
      porArea[area].push(doc)
    }

    return NextResponse.json({
      perfil_cliente: perfilCliente,
      total: documentos.length,
      documentos,
      por_area: porArea,
    })
  } catch (error) {
    console.error('[GET /api/documentos/referencia]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
