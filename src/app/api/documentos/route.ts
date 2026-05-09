// src/app/api/documentos/route.ts
// Lista documentos enviados e permite novo envio
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
    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)

    const documentos = await prisma.documentoEnviado.findMany({
      where: {
        ...(clienteId ? { cliente_id: clienteId } : {}),
        ...(!isLC ? { cliente_id: session.user.clienteId ?? undefined } : {}),
      },
      include: {
        cliente: { select: { id: true, nome: true, perfil_diagnostico: true } },
        documento_referencia: {
          select: {
            codigo: true,
            titulo: true,
            nome_documento: true,
            categoria: true,
            area: true,
            tema: true,
            grau_necessidade: true,
            perfil_requerido: true,
            legislacao_ref: true,
            ona_requisito: true,
            obrigatorio: true,
            tipo_documento: { select: { nome: true } },
          },
        },
        avaliacoes: {
          orderBy: { data_avaliacao: 'desc' },
          take: 1,
          select: {
            score_final: true,
            classificacao: true,
            data_avaliacao: true,
          },
        },
      },
      orderBy: { data_envio: 'desc' },
    })

    return NextResponse.json(documentos)
  } catch (error) {
    console.error('[GET /api/documentos]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const { cliente_id, contrato_id, documento_referencia_id, nome_arquivo, arquivo_url, versao_informada } = body

    if (!cliente_id || !contrato_id || !documento_referencia_id || !nome_arquivo || !arquivo_url) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    // Verifica acesso — LC pode enviar por qualquer cliente; cliente só pelo próprio
    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC && session.user.clienteId !== cliente_id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const documento = await prisma.documentoEnviado.create({
      data: {
        cliente_id,
        contrato_id,
        documento_referencia_id,
        nome_arquivo,
        arquivo_url,
        versao_informada: versao_informada ?? null,
        status_documento: 'ENVIADO',
      },
      include: {
        documento_referencia: {
          select: { titulo: true, nome_documento: true, grau_necessidade: true },
        },
      },
    })

    return NextResponse.json(documento, { status: 201 })
  } catch (error) {
    console.error('[POST /api/documentos]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
