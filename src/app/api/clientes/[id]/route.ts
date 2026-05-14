export const dynamic = "force-dynamic"

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
          orderBy: [{ prioridade: 'asc' }, { prazo: 'asc' }],
          take: 10,
        },
        questionarios: {
          orderBy: { created_at: 'desc' },
          take: 1,
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.perfil !== 'ADMIN_LC') {
      return NextResponse.json({ error: 'Apenas administradores podem excluir clientes' }, { status: 403 })
    }

    // Verificar se tem dados financeiros — não deletar se tiver histórico real
    const totalDados = await prisma.dadosFinanceiros.count({ where: { cliente_id: params.id } })
    if (totalDados > 0) {
      return NextResponse.json({
        error: 'Este cliente possui dados financeiros registrados. Para excluir, remova os dados financeiros primeiro.'
      }, { status: 409 })
    }

    await prisma.$transaction(async (tx) => {
      // Deletar questionários e seus dados
      const questionarios = await tx.questionario.findMany({ where: { cliente_id: params.id } })
      for (const q of questionarios) {
        await tx.respostaQuestionario.deleteMany({ where: { questionario_id: q.id } })
        await tx.progressoBloco.deleteMany({ where: { questionario_id: q.id } })
      }
      await tx.questionario.deleteMany({ where: { cliente_id: params.id } })

      // Avaliações documentais e impactos
      const avaliacoes = await tx.avaliacaoDocumento.findMany({ where: { cliente_id: params.id } })
      for (const av of avaliacoes) {
        await tx.avaliacaoCriterio.deleteMany({ where: { avaliacao_documento_id: av.id } })
        await tx.impactoIntegrado.deleteMany({ where: { avaliacao_documento_id: av.id } })
      }
      await tx.avaliacaoDocumento.deleteMany({ where: { cliente_id: params.id } })
      await tx.documentoEnviado.deleteMany({ where: { cliente_id: params.id } })

      // Ações corretivas e responsáveis
      const acoes = await tx.acaoCorretiva.findMany({ where: { cliente_id: params.id } })
      for (const acao of acoes) {
        await tx.acaoResponsavel.deleteMany({ where: { acao_id: acao.id } })
      }
      await tx.acaoCorretiva.deleteMany({ where: { cliente_id: params.id } })

      await tx.naoConformidade.deleteMany({ where: { cliente_id: params.id } })
      await tx.matrizGut.deleteMany({ where: { cliente_id: params.id } })
      await tx.checklistOna.deleteMany({ where: { cliente_id: params.id } })
      await tx.contrato.deleteMany({ where: { cliente_id: params.id } })
      await tx.clienteModalidade.deleteMany({ where: { cliente_id: params.id } })
      await tx.usuario.deleteMany({ where: { cliente_id: params.id } })
      await tx.cliente.delete({ where: { id: params.id } })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/clientes/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
