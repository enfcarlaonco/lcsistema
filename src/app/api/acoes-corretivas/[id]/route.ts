// src/app/api/acoes-corretivas/[id]/route.ts
// GET — detalhe da ação | PATCH — atualiza status/responsáveis/evidência
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: { id: string } }

const AGENTES_VALIDOS = ['ADMINISTRATIVO', 'MEDICO', 'ENFERMAGEM', 'GESTAO', 'QUALIDADE', 'TI']

// Transições de status permitidas por perfil
function podeTransicionar(
  perfilUsuario: string,
  statusAtual: string,
  novoStatus: string
): boolean {
  const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(perfilUsuario)
  const isCliente = ['GESTOR_CLIENTE', 'VISUALIZADOR_CLIENTE'].includes(perfilUsuario)

  // Cancelamento só a LC pode fazer
  if (novoStatus === 'CANCELADA') return isLC

  // Cliente pode: PENDENTE→EM_ANDAMENTO, EM_ANDAMENTO→CONCLUIDA
  if (isCliente) {
    return (
      (statusAtual === 'PENDENTE'     && novoStatus === 'EM_ANDAMENTO') ||
      (statusAtual === 'EM_ANDAMENTO' && novoStatus === 'CONCLUIDA')
    )
  }

  // LC pode qualquer transição válida
  if (isLC) {
    return (
      (statusAtual === 'PENDENTE'     && novoStatus === 'EM_ANDAMENTO') ||
      (statusAtual === 'EM_ANDAMENTO' && novoStatus === 'CONCLUIDA')    ||
      (statusAtual === 'CONCLUIDA'    && novoStatus === 'EM_ANDAMENTO') || // reverter
      (novoStatus === 'CANCELADA')
    )
  }

  return false
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const acao = await prisma.acaoCorretiva.findUnique({
      where: { id: params.id },
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        nao_conformidade: { select: { nivel: true, dominio: true, descricao: true } },
        avaliacao_documento: {
          select: {
            score_final: true,
            classificacao: true,
            documento_enviado: {
              select: {
                documento_referencia: { select: { titulo: true, nome_documento: true } },
              },
            },
          },
        },
      },
    })

    if (!acao) return NextResponse.json({ error: 'Ação não encontrada.' }, { status: 404 })

    // Verifica acesso: cliente só vê as próprias
    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC && acao.cliente_id !== session.user.clienteId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
    }

    // Busca responsáveis da ação
    const responsaveis = await prisma.$queryRaw<{ agente: string }[]>`
      SELECT agente::text FROM "acoes_responsaveis" WHERE acao_id = ${params.id}
    `

    return NextResponse.json({
      ...acao,
      agentes_responsaveis: responsaveis.map(r => r.agente),
    })
  } catch (error) {
    console.error('[GET /api/acoes-corretivas/[id]]', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const acao = await prisma.acaoCorretiva.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, cliente_id: true, historico: true },
    })

    if (!acao) return NextResponse.json({ error: 'Ação não encontrada.' }, { status: 404 })

    // Verifica acesso
    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC && acao.cliente_id !== session.user.clienteId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
    }

    const body = await req.json()
    const { novo_status, agentes, evidencia_texto, observacao } = body

    const atualizacoes: Record<string, any> = {
      updated_at: new Date(),
      atualizado_por: session.user.id,
    }

    // Valida e aplica novo status
    if (novo_status && novo_status !== acao.status) {
      if (!podeTransicionar(session.user.perfil, acao.status, novo_status)) {
        return NextResponse.json(
          { error: `Transição de ${acao.status} para ${novo_status} não permitida.` },
          { status: 422 }
        )
      }
      atualizacoes.status = novo_status
      if (novo_status === 'CONCLUIDA') {
        atualizacoes.concluida_at = new Date()
      }
    }

    if (evidencia_texto !== undefined) {
      atualizacoes.evidencia_texto = evidencia_texto
    }

    // Adiciona entrada ao histórico
    const historicoAtual = (acao.historico as any[]) ?? []
    const novaEntrada = {
      data: new Date().toISOString(),
      usuario_id: session.user.id,
      usuario_nome: session.user.name ?? session.user.email,
      perfil: session.user.perfil,
      status_anterior: acao.status,
      novo_status: novo_status ?? acao.status,
      observacao: observacao ?? null,
    }
    atualizacoes.historico = [...historicoAtual, novaEntrada]

    // Executa tudo em transação
    const acaoAtualizada = await prisma.$transaction(async (tx) => {
      // Atualiza a ação
      const updated = await tx.acaoCorretiva.update({
        where: { id: params.id },
        data: atualizacoes,
      })

      // Atualiza responsáveis se fornecidos (apenas LC pode)
      if (agentes !== undefined && isLC) {
        const agentesValidos = (agentes as string[]).filter(a => AGENTES_VALIDOS.includes(a))

        // Remove todos os responsáveis atuais e recria
        await tx.$executeRaw`DELETE FROM "acoes_responsaveis" WHERE acao_id = ${params.id}`

        for (const agente of agentesValidos) {
          await tx.$executeRaw`
            INSERT INTO "acoes_responsaveis" (acao_id, agente)
            VALUES (${params.id}, ${agente}::"AgenteResponsavel")
            ON CONFLICT DO NOTHING
          `
        }
      }

      return updated
    })

    // Busca responsáveis atualizados
    const responsaveis = await prisma.$queryRaw<{ agente: string }[]>`
      SELECT agente::text FROM "acoes_responsaveis" WHERE acao_id = ${params.id}
    `

    return NextResponse.json({
      sucesso: true,
      acao: {
        ...acaoAtualizada,
        agentes_responsaveis: responsaveis.map(r => r.agente),
      },
      mensagem: novo_status
        ? `Status atualizado para ${novo_status}.`
        : 'Ação atualizada.',
    })
  } catch (error) {
    console.error('[PATCH /api/acoes-corretivas/[id]]', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
