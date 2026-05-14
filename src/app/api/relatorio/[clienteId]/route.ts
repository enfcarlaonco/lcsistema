// src/app/api/relatorio/[clienteId]/route.ts
// GET — gera e retorna o relatório diagnóstico em PDF
// Usa @react-pdf/renderer via dynamic import para funcionar no Vercel
export const dynamic = "force-dynamic"
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { gerarRelatorioPDF } from '@/lib/relatorio/gerador'

interface Params { params: { clienteId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const contratoId = searchParams.get('contratoId')

    // ── Busca todos os dados necessários ──────────────────────────────────────

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.clienteId },
      include: {
        modalidades: true,
        contratos: {
          where: contratoId ? { id: contratoId } : { status: 'ATIVO' },
          orderBy: { data_inicio: 'desc' },
          take: 1,
        },
      },
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })
    }

    const contrato = cliente.contratos[0]

    // Questionário mais recente
    const questionario = await prisma.questionario.findFirst({
      where: {
        cliente_id: params.clienteId,
        ...(contratoId ? { contrato_id: contratoId } : {}),
      },
      orderBy: { created_at: 'desc' },
      include: {
        progresso: {
          include: { bloco: { select: { codigo: true, titulo: true } } },
          orderBy: { bloco: { ordem: 'asc' } },
        },
        respostas: {
          include: {
            pergunta: { select: { codigo: true, enunciado: true } },
          },
        },
      },
    })

    // Não conformidades
    const naoConformidades = await prisma.naoConformidade.findMany({
      where: { cliente_id: params.clienteId },
      orderBy: [{ nivel: 'desc' }, { prazo_limite: 'asc' }],
      take: 50,
    })

    // Documentos avaliados
    const documentosAvaliados = await prisma.documentoEnviado.findMany({
      where: {
        cliente_id: params.clienteId,
        avaliacoes: { some: {} },
      },
      include: {
        documento_referencia: {
          select: { titulo: true, nome_documento: true, grau_necessidade: true },
        },
        avaliacoes: {
          orderBy: { data_avaliacao: 'desc' },
          take: 1,
          select: { score_final: true, classificacao: true },
        },
      },
      take: 30,
    })

    // Indicadores financeiros mais recentes
    const dadosFinanceiros = await prisma.dadosFinanceiros.findFirst({
      where: { cliente_id: params.clienteId },
      orderBy: { mes_referencia: 'desc' },
      include: { indicadores: true, score: true },
    })

    // Plano de ação
    const acoes = await prisma.acaoCorretiva.findMany({
      where: {
        cliente_id: params.clienteId,
        status: { not: 'CANCELADA' },
      },
      orderBy: [{ prioridade: 'asc' }, { prazo: 'asc' }],
      take: 30,
    })

    // Responsáveis das ações
    const acaoIds = acoes.map(a => a.id)
    const responsaveis: { acao_id: string; agente: string }[] = acaoIds.length > 0
      ? await prisma.$queryRaw`
          SELECT acao_id, agente::text FROM "acoes_responsaveis"
          WHERE acao_id = ANY(${acaoIds}::text[])
        `
      : []

    // ── Monta payload para o gerador ──────────────────────────────────────────

    const respMap: Record<string, string> = {}
    if (questionario) {
      for (const r of questionario.respostas) {
        const val = r.valor_texto ?? r.valor_numero?.toString() ??
          (r.valor_boolean !== null ? (r.valor_boolean ? 'Sim' : 'Não') : '')
        respMap[r.pergunta.codigo] = val
      }
    }

    const dados = {
      cliente_nome: cliente.nome,
      periodo_diagnostico: contrato
        ? `${new Date(contrato.data_inicio).toLocaleDateString('pt-BR')} a ${new Date(contrato.data_fim).toLocaleDateString('pt-BR')}`
        : 'Período não definido',

      scores_resumo: {
        score_nc: naoConformidades.length === 0 ? 100
          : Math.max(0, 100 - (naoConformidades.filter(n => n.nivel === 'NC_III').length * 15) -
            (naoConformidades.filter(n => n.nivel === 'NC_II').length * 8) -
            (naoConformidades.filter(n => n.nivel === 'NC_I').length * 3)),
        score_documental: documentosAvaliados.length > 0
          ? documentosAvaliados.reduce((s, d) => s + (d.avaliacoes[0]?.score_final ?? 0), 0) / documentosAvaliados.length
          : null,
        score_financeiro: dadosFinanceiros?.score?.score_final ?? null,
      },

      identificacao: {
        razao_social: cliente.nome,
        cnpj: cliente.cnpj,
        cnes: cliente.cnes ?? '—',
        endereco: [cliente.cidade, cliente.estado].filter(Boolean).join(', ') || '—',
        licenca: respMap['B0_P06'] ?? '—',
        natureza: respMap['B0_P08'] ?? '—',
        responsavel_tecnico: respMap['B3_P01'] ?? '—',
        periodo: contrato
          ? `${new Date(contrato.data_inicio).toLocaleDateString('pt-BR')} a ${new Date(contrato.data_fim).toLocaleDateString('pt-BR')}`
          : '—',
      },

      blocos_questionario: questionario?.progresso.map(p => ({
        codigo: p.bloco.codigo,
        titulo: p.bloco.titulo,
        respondidas: p.respondidas,
        total: p.total_perguntas,
        pct_completo: p.pct_completo,
      })) ?? [],

      resumo_nc: {
        total: naoConformidades.length,
        criticas:    naoConformidades.filter(n => n.nivel === 'NC_III').length,
        importantes: naoConformidades.filter(n => n.nivel === 'NC_II').length,
        moderadas:   naoConformidades.filter(n => n.nivel === 'NC_I').length,
      },

      nao_conformidades: naoConformidades.map(nc => ({
        nivel: nc.nivel,
        dominio: nc.dominio,
        descricao: nc.descricao,
        prazo_limite: nc.prazo_limite.toISOString(),
        status: nc.status,
      })),

      documentos_avaliados: documentosAvaliados.map(d => ({
        titulo: d.documento_referencia.titulo ?? d.documento_referencia.nome_documento,
        tipo: d.documento_referencia.grau_necessidade,
        score_final: d.avaliacoes[0]?.score_final ?? 0,
      })),

      indicadores_financeiros: dadosFinanceiros?.indicadores ? {
        faturamento_bruto:       Number(dadosFinanceiros.faturamento_bruto),
        taxa_glosa:              dadosFinanceiros.indicadores.taxa_glosa,
        taxa_ocupacao:           dadosFinanceiros.indicadores.taxa_ocupacao,
        custo_por_sessao:        Number(dadosFinanceiros.indicadores.custo_por_sessao),
        margem_percentual:       dadosFinanceiros.indicadores.margem_percentual,
        sessoes_realizadas:      dadosFinanceiros.sessoes_realizadas,
        custo_insumos_por_sessao: Number(dadosFinanceiros.indicadores.custo_insumos_por_sessao),
        folha_sobre_receita:     dadosFinanceiros.indicadores.folha_sobre_receita,
      } : null,

      plano_acao: acoes.map(a => ({
        prioridade: a.prioridade,
        titulo: a.titulo,
        origem: a.origem,
        prazo: a.prazo.toISOString(),
        status: a.status,
        agentes: responsaveis.filter(r => r.acao_id === a.id).map(r => r.agente),
      })),
    }

    // ── Gera o PDF ────────────────────────────────────────────────────────────
    const pdfBuffer = await gerarRelatorioPDF(dados)

    const nomeArquivo = `diagnostico_${cliente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('[GET /api/relatorio/[clienteId]]', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório.' }, { status: 500 })
  }
}
