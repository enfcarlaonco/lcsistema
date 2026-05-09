// src/app/api/documentos/[id]/avaliar/route.ts
// Permite à LC avaliar um documento enviado pelo cliente
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: { id: string } }

// ─── Calcula score ponderado pelas 3 dimensões ─────────────────────────────
// Dimensões ativas (após validação da Luciana):
//   Existência    10%
//   Estrutura     40%
//   Aplicabilidade 50%
// Total: 100%

const DIMENSOES = [
  { nome: 'Existência',     peso: 0.10 },
  { nome: 'Estrutura',      peso: 0.40 },
  { nome: 'Aplicabilidade', peso: 0.50 },
]

type RespostaValor = 'SIM' | 'PARCIAL' | 'NAO' | 'NAO_SE_APLICA'

function pontuacaoResposta(resposta: RespostaValor): number | null {
  // Pontuação conforme validação da Luciana:
  // SIM = 90–100 → usamos 100 como base máxima
  // PARCIAL = 60–89 → usamos 75 como ponto médio
  // NÃO = 0–59 → usamos 0
  // NÃO_SE_APLICA = excluído do cálculo → null
  const mapa: Record<RespostaValor, number | null> = {
    SIM: 100,
    PARCIAL: 75,
    NAO: 0,
    NAO_SE_APLICA: null,
  }
  return mapa[resposta]
}

function classificarScore(score: number): 'CONFORME' | 'PARCIAL' | 'NAO_CONFORME' {
  if (score >= 85) return 'CONFORME'
  if (score >= 60) return 'PARCIAL'
  return 'NAO_CONFORME'
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)) {
      return NextResponse.json({ error: 'Apenas consultores LC podem avaliar documentos.' }, { status: 403 })
    }

    const documentoEnviadoId = params.id

    const documentoEnviado = await prisma.documentoEnviado.findUnique({
      where: { id: documentoEnviadoId },
      select: {
        id: true,
        cliente_id: true,
        contrato_id: true,
        documento_referencia_id: true,
      },
    })

    if (!documentoEnviado) {
      return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })
    }

    const body = await req.json()
    // body.respostas: Array de { dimensao: string, resposta: RespostaValor, comentario?: string }
    const { respostas, observacao_geral } = body

    if (!respostas || !Array.isArray(respostas) || respostas.length === 0) {
      return NextResponse.json({ error: 'Respostas das dimensões são obrigatórias.' }, { status: 400 })
    }

    // Calcula score ponderado
    let scoreTotal = 0
    let pesoTotal = 0

    for (const dim of DIMENSOES) {
      const resposta = respostas.find((r: any) => r.dimensao === dim.nome)
      if (!resposta) continue

      const pontuacao = pontuacaoResposta(resposta.resposta as RespostaValor)
      if (pontuacao === null) continue // NAO_SE_APLICA — exclui do cálculo

      scoreTotal += pontuacao * dim.peso
      pesoTotal += dim.peso
    }

    // Normaliza se alguma dimensão foi excluída por NAO_SE_APLICA
    const scoreFinal = pesoTotal > 0 ? (scoreTotal / pesoTotal) * 100 / 100 : 0
    const classificacao = classificarScore(scoreFinal)

    // Persiste a avaliação
    const avaliacao = await prisma.$transaction(async (tx) => {
      // Busca ou cria os critérios de validação para cada dimensão
      const dimensoesDb = await tx.dimensaoValidacao.findMany({
        where: { ativo: true },
      })

      // Cria avaliação principal
      const av = await tx.avaliacaoDocumento.create({
        data: {
          cliente_id: documentoEnviado.cliente_id,
          contrato_id: documentoEnviado.contrato_id,
          documento_enviado_id: documentoEnviadoId,
          avaliador_usuario_id: session.user.id,
          score_final: scoreFinal,
          classificacao,
          risco_assistencial: scoreFinal < 60 ? 'ALTO' : scoreFinal < 85 ? 'MEDIO' : 'BAIXO',
          risco_operacional: scoreFinal < 60 ? 'ALTO' : scoreFinal < 85 ? 'MEDIO' : 'BAIXO',
          risco_regulatorio: scoreFinal < 60 ? 'ALTO' : scoreFinal < 85 ? 'MEDIO' : 'BAIXO',
          impacto_economico_final: scoreFinal < 60 ? 'ALTO' : scoreFinal < 85 ? 'MEDIO' : 'BAIXO',
          observacao_geral: observacao_geral ?? null,
        },
      })

      // Cria avaliações por critério/dimensão
      for (const dim of DIMENSOES) {
        const resposta = respostas.find((r: any) => r.dimensao === dim.nome)
        if (!resposta) continue

        const dimensaoDb = dimensoesDb.find(d => d.nome_dimensao === dim.nome)
        if (!dimensaoDb) continue

        // Busca ou cria critério para esta dimensão + documento
        let criterio = await tx.criterioValidacao.findFirst({
          where: {
            dimensao_id: dimensaoDb.id,
            tipo_documento_id: documentoEnviado.documento_referencia_id,
          },
        })

        if (!criterio) {
          criterio = await tx.criterioValidacao.create({
            data: {
              dimensao_id: dimensaoDb.id,
              tipo_documento_id: documentoEnviado.documento_referencia_id,
              nome_criterio: `${dim.nome} — avaliação automática`,
              descricao: `Critério gerado automaticamente para a dimensão ${dim.nome}`,
              peso: dim.peso,
              obrigatorio: true,
              ativo: true,
            },
          })
        }

        const pontuacao = pontuacaoResposta(resposta.resposta as RespostaValor) ?? 0

        await tx.avaliacaoCriterio.create({
          data: {
            avaliacao_documento_id: av.id,
            criterio_validacao_id: criterio.id,
            resposta: resposta.resposta,
            pontuacao_obtida: pontuacao,
            comentario: resposta.comentario ?? null,
          },
        })
      }

      // Atualiza status do documento
      await tx.documentoEnviado.update({
        where: { id: documentoEnviadoId },
        data: {
          status_documento: classificacao === 'CONFORME'
            ? 'APROVADO'
            : classificacao === 'PARCIAL'
              ? 'EM_AVALIACAO'
              : 'REPROVADO',
        },
      })

      // Gera ação corretiva automaticamente se NC ou PARCIAL
      if (classificacao !== 'CONFORME') {
        await tx.acaoCorretiva.create({
          data: {
            cliente_id: documentoEnviado.cliente_id,
            contrato_id: documentoEnviado.contrato_id,
            origem: 'DOCUMENTAL',
            avaliacao_documento_id: av.id,
            titulo: `Adequação documental — score ${scoreFinal.toFixed(0)}%`,
            descricao: classificacao === 'PARCIAL'
              ? `Documento avaliado como PARCIALMENTE CONFORME (${scoreFinal.toFixed(0)}%). Requer incremento para atingir conformidade plena (≥ 85%).`
              : `Documento avaliado como NÃO CONFORME (${scoreFinal.toFixed(0)}%). Requer elaboração ou reestruturação completa.`,
            prioridade: classificacao === 'NAO_CONFORME' ? 'CRITICA' : 'ALTA',
            prazo: new Date(Date.now() + (classificacao === 'NAO_CONFORME' ? 15 : 30) * 24 * 60 * 60 * 1000),
            status: 'PENDENTE',
          },
        })
      }

      return av
    })

    return NextResponse.json({
      sucesso: true,
      avaliacao_id: avaliacao.id,
      score_final: scoreFinal,
      classificacao,
      mensagem: classificacao === 'CONFORME'
        ? `Documento conforme — score ${scoreFinal.toFixed(0)}%.`
        : classificacao === 'PARCIAL'
          ? `Documento parcialmente conforme — score ${scoreFinal.toFixed(0)}%. Ação corretiva gerada.`
          : `Documento não conforme — score ${scoreFinal.toFixed(0)}%. Ação corretiva crítica gerada.`,
    })
  } catch (error) {
    console.error('[POST /api/documentos/[id]/avaliar]', error)
    return NextResponse.json({ error: 'Erro interno ao salvar avaliação.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const avaliacao = await prisma.avaliacaoDocumento.findFirst({
      where: { documento_enviado_id: params.id },
      orderBy: { data_avaliacao: 'desc' },
      include: {
        criterios_avaliados: {
          include: {
            criterio_validacao: {
              include: { dimensao: true },
            },
          },
        },
        avaliador: { select: { nome: true } },
      },
    })

    if (!avaliacao) {
      return NextResponse.json({ avaliacao: null })
    }

    return NextResponse.json({ avaliacao })
  } catch (error) {
    console.error('[GET /api/documentos/[id]/avaliar]', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
