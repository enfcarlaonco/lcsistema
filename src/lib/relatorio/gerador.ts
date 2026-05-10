// src/lib/relatorio/gerador.ts
// Gerador de relatório diagnóstico PDF usando pdfkit
// Compatível com Vercel (Node.js serverless)

import PDFDocument from 'pdfkit'

// ── Paleta ───────────────────────────────────────────────────────────────────
const CORES = {
  azul:        '#1B3A5C',
  azulMed:     '#2E6DA4',
  azulClaro:   '#D6E4F0',
  verde:       '#166534',
  verdeBg:     '#DCFCE7',
  amarelo:     '#92400E',
  amareloBg:   '#FEF3C7',
  vermelho:    '#991B1B',
  vermelhoBg:  '#FEE2E2',
  cinza:       '#6B7280',
  cinzaClaro:  '#F9FAFB',
  cinzaBorda:  '#E5E7EB',
  texto:       '#111827',
  textoSec:    '#6B7280',
}

// ── Tipos ────────────────────────────────────────────────────────────────────
interface DadosRelatorio {
  cliente_nome: string
  periodo_diagnostico: string
  scores_resumo: {
    score_nc?: number | null
    score_documental?: number | null
    score_financeiro?: number | null
  }
  identificacao: Record<string, string>
  blocos_questionario: Array<{
    codigo: string; titulo: string
    respondidas: number; total: number; pct_completo: number
  }>
  resumo_nc: { total: number; criticas: number; importantes: number; moderadas: number }
  nao_conformidades: Array<{
    nivel: string; dominio: string; descricao: string
    prazo_limite: string; status: string
  }>
  documentos_avaliados: Array<{ titulo: string; tipo: string; score_final: number }>
  indicadores_financeiros?: Record<string, number> | null
  plano_acao: Array<{
    prioridade: string; titulo: string; origem: string
    prazo: string; status: string; agentes?: string[]
  }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function corScore(score: number): { fg: string; bg: string; label: string } {
  if (score >= 85) return { fg: CORES.verde,    bg: CORES.verdeBg,   label: 'CONFORME' }
  if (score >= 60) return { fg: CORES.amarelo,  bg: CORES.amareloBg, label: 'PARCIAL' }
  return              { fg: CORES.vermelho, bg: CORES.vermelhoBg, label: 'NÃO CONFORME' }
}

function corNC(nivel: string): string {
  if (nivel === 'NC_III') return CORES.vermelho
  if (nivel === 'NC_II')  return CORES.amarelo
  return '#854D0E'
}

function formatarData(iso: string): string {
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return iso }
}

function formatarMoeda(val: number): string {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

const AGENTE_LABELS: Record<string, string> = {
  ADMINISTRATIVO: 'Administrativo', MEDICO: 'Médico',
  ENFERMAGEM: 'Enfermagem', GESTAO: 'Gestão',
  QUALIDADE: 'Qualidade', TI: 'TI',
}

// ── Gerador principal ─────────────────────────────────────────────────────────
export async function gerarRelatorioPDF(dados: DadosRelatorio): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 40, right: 40 },
      info: {
        Title: `Relatório Diagnóstico — ${dados.cliente_nome}`,
        Author: 'LC Saúde Consultoria',
        Subject: 'Diagnóstico Organizacional em Nefrologia',
      },
    })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const W = doc.page.width
    const L = 40   // margem esquerda
    const R = 40   // margem direita
    const CW = W - L - R  // largura útil

    const dataGeracao = new Date().toLocaleString('pt-BR')

    // ── Funções de desenho ────────────────────────────────────────────────────

    function cabecalhoPagina() {
      // Barra azul no topo
      doc.rect(0, 0, W, 8).fill(CORES.azul)
    }

    function rodapePagina(pagina: number) {
      const y = doc.page.height - 35
      doc.moveTo(L, y).lineTo(W - R, y).lineWidth(0.5).strokeColor(CORES.cinzaBorda).stroke()
      doc.fontSize(7).fillColor(CORES.cinza)
        .text(`LC Saúde Consultoria — Diagnóstico ${dados.cliente_nome} — ${dataGeracao}`, L, y + 8, { width: CW - 60, align: 'left' })
        .text(`${pagina}`, W - R - 30, y + 8, { width: 30, align: 'right' })
    }

    function secao(titulo: string) {
      if (doc.y > doc.page.height - 120) {
        doc.addPage()
        cabecalhoPagina()
      }
      const y = doc.y + 10
      doc.rect(L, y, CW, 22).fill(CORES.azul)
      doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold')
        .text(titulo.toUpperCase(), L + 10, y + 7, { width: CW - 20 })
      doc.moveDown(0.2)
    }

    function badge(texto: string, x: number, y: number, fg: string, bg: string): number {
      const w = texto.length * 6 + 14
      doc.roundedRect(x, y - 2, w, 14, 6).fill(bg)
      doc.fontSize(7).fillColor(fg).font('Helvetica-Bold')
        .text(texto, x + 7, y + 1)
      return w
    }

    function linha() {
      doc.moveTo(L, doc.y).lineTo(W - R, doc.y).lineWidth(0.3).strokeColor(CORES.cinzaBorda).stroke()
      doc.moveDown(0.3)
    }

    // ── CAPA ──────────────────────────────────────────────────────────────────
    cabecalhoPagina()

    // Bloco azul escuro topo
    doc.rect(L, 30, CW, 70).fill(CORES.azul)
    doc.fontSize(11).fillColor('#FFFFFF').font('Helvetica-Bold')
      .text('LC SAÚDE', L + 16, 46)
    doc.fontSize(8).fillColor(CORES.azulClaro).font('Helvetica')
      .text('Consultoria em Nefrologia', L + 16, 60)

    doc.fontSize(20).fillColor(CORES.azul).font('Helvetica-Bold')
      .text('Relatório Diagnóstico', L, 120)
    doc.fontSize(14).fillColor(CORES.azulMed).font('Helvetica-Bold')
      .text(dados.cliente_nome, L, 148)
    doc.fontSize(9).fillColor(CORES.cinza).font('Helvetica')
      .text(`Período: ${dados.periodo_diagnostico}`, L, 168)

    doc.moveTo(L, 185).lineTo(W - R, 185).lineWidth(1.5).strokeColor(CORES.azulMed).stroke()

    // Cards de score na capa
    const scorePairs = [
      { label: 'Conformidade regulatória', chave: 'score_nc' },
      { label: 'Avaliação documental',     chave: 'score_documental' },
      { label: 'Desempenho financeiro',    chave: 'score_financeiro' },
    ]
    let yScore = 200
    for (const sp of scorePairs) {
      const val = dados.scores_resumo[sp.chave as keyof typeof dados.scores_resumo]
      if (val == null) continue
      const { fg, bg, label } = corScore(val)
      doc.rect(L, yScore, CW, 38).fill(bg)
      doc.fontSize(8).fillColor(CORES.textoSec).font('Helvetica')
        .text(sp.label, L + 12, yScore + 8)
      doc.fontSize(18).fillColor(fg).font('Helvetica-Bold')
        .text(`${Math.round(val)}%`, L + 12, yScore + 16)
      badge(label, L + CW - 90, yScore + 14, fg, '#FFFFFF')
      doc.moveTo(L, yScore + 38).lineTo(W - R, yScore + 38).lineWidth(0.3).strokeColor(CORES.cinzaBorda).stroke()
      yScore += 39
    }

    doc.fontSize(7).fillColor(CORES.cinza).font('Helvetica')
      .text(`Gerado em ${dataGeracao} — Documento Confidencial`, L, yScore + 20, { align: 'center', width: CW })

    doc.addPage()
    cabecalhoPagina()

    // ── 1. IDENTIFICAÇÃO ──────────────────────────────────────────────────────
    secao('1. Identificação do Serviço')
    doc.moveDown(0.4)

    const camposId = [
      ['Razão social',        dados.identificacao.razao_social],
      ['CNPJ',               dados.identificacao.cnpj],
      ['CNES',               dados.identificacao.cnes],
      ['Endereço',           dados.identificacao.endereco],
      ['Licença sanitária',  dados.identificacao.licenca],
      ['Natureza do serviço',dados.identificacao.natureza],
      ['Responsável técnico',dados.identificacao.responsavel_tecnico],
      ['Período diagnóstico',dados.identificacao.periodo],
    ]

    let yId = doc.y
    for (let i = 0; i < camposId.length; i += 2) {
      const bg = i % 4 === 0 ? CORES.cinzaClaro : '#FFFFFF'
      doc.rect(L, yId, CW, 24).fill(bg)
      for (let j = 0; j < 2 && i + j < camposId.length; j++) {
        const [label, valor] = camposId[i + j]
        const xCol = L + j * (CW / 2) + 8
        doc.fontSize(7).fillColor(CORES.cinza).font('Helvetica').text(label, xCol, yId + 4)
        doc.fontSize(9).fillColor(CORES.texto).font('Helvetica-Bold').text(valor ?? '—', xCol, yId + 13)
      }
      yId += 24
    }
    doc.rect(L, doc.y, CW, yId - doc.y).stroke(CORES.cinzaBorda)
    doc.y = yId
    doc.moveDown(0.8)

    // ── 2. QUESTIONÁRIO M2 ────────────────────────────────────────────────────
    secao('2. Resultado do Questionário M2')
    doc.moveDown(0.4)

    if (dados.blocos_questionario.length > 0) {
      // Cabeçalho
      let yB = doc.y
      doc.rect(L, yB, CW, 18).fill(CORES.azulClaro)
      doc.fontSize(8).fillColor(CORES.azul).font('Helvetica-Bold')
        .text('Bloco', L + 6, yB + 5, { width: CW * 0.1 })
        .text('Título', L + CW * 0.1 + 6, yB + 5, { width: CW * 0.55 })
        .text('Respondidas', L + CW * 0.65 + 6, yB + 5, { width: CW * 0.18 })
        .text('%', L + CW * 0.83 + 6, yB + 5, { width: CW * 0.17 })
      yB += 18

      for (let i = 0; i < dados.blocos_questionario.length; i++) {
        const b = dados.blocos_questionario[i]
        const { fg } = corScore(b.pct_completo)
        const bg = i % 2 === 0 ? '#FFFFFF' : CORES.cinzaClaro
        doc.rect(L, yB, CW, 18).fill(bg)
        doc.fontSize(8).fillColor(CORES.texto).font('Helvetica')
          .text(b.codigo, L + 6, yB + 5, { width: CW * 0.1 })
          .text(b.titulo, L + CW * 0.1 + 6, yB + 5, { width: CW * 0.55 })
          .text(`${b.respondidas}/${b.total}`, L + CW * 0.65 + 6, yB + 5, { width: CW * 0.18 })
        doc.fontSize(8).fillColor(fg).font('Helvetica-Bold')
          .text(`${Math.round(b.pct_completo)}%`, L + CW * 0.83 + 6, yB + 5, { width: CW * 0.17 })
        yB += 18
      }
      doc.rect(L, doc.y, CW, yB - doc.y).lineWidth(0.5).stroke(CORES.cinzaBorda)
      doc.y = yB
    } else {
      doc.fontSize(9).fillColor(CORES.cinza).text('Questionário não iniciado.', L, doc.y)
    }
    doc.moveDown(0.8)

    // ── 3. NÃO CONFORMIDADES ──────────────────────────────────────────────────
    secao('3. Não Conformidades Regulatórias (Motor M11)')
    doc.moveDown(0.4)

    // Cards resumo
    const cardsNC = [
      { val: dados.resumo_nc.total,       label: 'Total',          cor: CORES.azul,    bg: CORES.azulClaro },
      { val: dados.resumo_nc.criticas,    label: 'NC III Críticas', cor: CORES.vermelho, bg: CORES.vermelhoBg },
      { val: dados.resumo_nc.importantes, label: 'NC II Importantes',cor: CORES.amarelo, bg: CORES.amareloBg },
      { val: dados.resumo_nc.moderadas,   label: 'NC I Moderadas',  cor: '#854D0E',      bg: '#FEF3C7' },
    ]
    const cardW = CW / 4 - 4
    let yCards = doc.y
    for (let i = 0; i < cardsNC.length; i++) {
      const c = cardsNC[i]
      const xC = L + i * (cardW + 5)
      doc.roundedRect(xC, yCards, cardW, 42, 4).fill(c.bg)
      doc.fontSize(20).fillColor(c.cor).font('Helvetica-Bold')
        .text(String(c.val), xC + 8, yCards + 5, { width: cardW - 16, align: 'center' })
      doc.fontSize(7).fillColor(c.cor).font('Helvetica')
        .text(c.label, xC + 4, yCards + 28, { width: cardW - 8, align: 'center' })
    }
    doc.y = yCards + 50

    if (dados.nao_conformidades.length > 0) {
      let yNC = doc.y
      doc.rect(L, yNC, CW, 18).fill(CORES.azulClaro)
      doc.fontSize(7).fillColor(CORES.azul).font('Helvetica-Bold')
        .text('Nível', L + 4, yNC + 5, { width: CW * 0.09 })
        .text('Domínio', L + CW * 0.09 + 4, yNC + 5, { width: CW * 0.11 })
        .text('Descrição', L + CW * 0.2 + 4, yNC + 5, { width: CW * 0.50 })
        .text('Prazo', L + CW * 0.70 + 4, yNC + 5, { width: CW * 0.15 })
        .text('Status', L + CW * 0.85 + 4, yNC + 5, { width: CW * 0.15 })
      yNC += 18

      for (let i = 0; i < dados.nao_conformidades.length; i++) {
        const nc = dados.nao_conformidades[i]
        const altura = Math.max(24, Math.ceil(nc.descricao.length / 60) * 12 + 8)
        if (yNC + altura > doc.page.height - 60) {
          doc.addPage(); cabecalhoPagina(); yNC = 60
        }
        const bg = i % 2 === 0 ? '#FFFFFF' : CORES.cinzaClaro
        doc.rect(L, yNC, CW, altura).fill(bg)
        doc.fontSize(7).fillColor(corNC(nc.nivel)).font('Helvetica-Bold')
          .text(nc.nivel.replace('_', ' '), L + 4, yNC + 6, { width: CW * 0.09 })
        doc.fontSize(7).fillColor(CORES.texto).font('Helvetica')
          .text(nc.dominio, L + CW * 0.09 + 4, yNC + 6, { width: CW * 0.11 })
          .text(nc.descricao.slice(0, 140) + (nc.descricao.length > 140 ? '...' : ''), L + CW * 0.20 + 4, yNC + 6, { width: CW * 0.50 })
          .text(formatarData(nc.prazo_limite), L + CW * 0.70 + 4, yNC + 6, { width: CW * 0.15 })
          .text(nc.status.replace('_', ' '), L + CW * 0.85 + 4, yNC + 6, { width: CW * 0.15 })
        yNC += altura
      }
      doc.rect(L, doc.y, CW, yNC - doc.y).lineWidth(0.5).stroke(CORES.cinzaBorda)
      doc.y = yNC
    }
    doc.moveDown(0.8)

    // ── 4. SCORE DOCUMENTAL ───────────────────────────────────────────────────
    if (doc.y > doc.page.height - 150) { doc.addPage(); cabecalhoPagina() }
    secao('4. Avaliação Documental')
    doc.moveDown(0.4)

    if (dados.documentos_avaliados.length > 0) {
      let yDoc = doc.y
      doc.rect(L, yDoc, CW, 18).fill(CORES.azulClaro)
      doc.fontSize(7).fillColor(CORES.azul).font('Helvetica-Bold')
        .text('Documento', L + 4, yDoc + 5, { width: CW * 0.58 })
        .text('Tipo', L + CW * 0.58 + 4, yDoc + 5, { width: CW * 0.16 })
        .text('Score', L + CW * 0.74 + 4, yDoc + 5, { width: CW * 0.12 })
        .text('Classificação', L + CW * 0.86 + 4, yDoc + 5, { width: CW * 0.14 })
      yDoc += 18

      for (let i = 0; i < dados.documentos_avaliados.length; i++) {
        const d = dados.documentos_avaliados[i]
        const { fg, label } = corScore(d.score_final)
        const bg = i % 2 === 0 ? '#FFFFFF' : CORES.cinzaClaro
        doc.rect(L, yDoc, CW, 18).fill(bg)
        doc.fontSize(7).fillColor(CORES.texto).font('Helvetica')
          .text((d.titulo ?? '').slice(0, 70), L + 4, yDoc + 5, { width: CW * 0.58 })
          .text(d.tipo?.replace('_', ' ') ?? '', L + CW * 0.58 + 4, yDoc + 5, { width: CW * 0.16 })
        doc.fontSize(8).fillColor(fg).font('Helvetica-Bold')
          .text(`${Math.round(d.score_final)}%`, L + CW * 0.74 + 4, yDoc + 5, { width: CW * 0.12 })
        doc.fontSize(7).fillColor(fg).font('Helvetica')
          .text(label, L + CW * 0.86 + 4, yDoc + 5, { width: CW * 0.14 })
        yDoc += 18
      }
      doc.rect(L, doc.y, CW, yDoc - doc.y).lineWidth(0.5).stroke(CORES.cinzaBorda)
      doc.y = yDoc
    } else {
      doc.fontSize(9).fillColor(CORES.cinza).text('Nenhum documento avaliado ainda.', L, doc.y)
    }
    doc.moveDown(0.8)

    // ── 5. INDICADORES FINANCEIROS ────────────────────────────────────────────
    if (dados.indicadores_financeiros) {
      if (doc.y > doc.page.height - 180) { doc.addPage(); cabecalhoPagina() }
      secao('5. Indicadores Financeiros')
      doc.moveDown(0.4)

      const ind = dados.indicadores_financeiros
      const pares = [
        ['Faturamento bruto',         formatarMoeda(ind.faturamento_bruto ?? 0)],
        ['Taxa de glosa',             `${(ind.taxa_glosa ?? 0).toFixed(1)}%`],
        ['Taxa de ocupação',          `${(ind.taxa_ocupacao ?? 0).toFixed(1)}%`],
        ['Custo por sessão',          formatarMoeda(ind.custo_por_sessao ?? 0)],
        ['Margem operacional',        `${(ind.margem_percentual ?? 0).toFixed(1)}%`],
        ['Sessões realizadas',        String(ind.sessoes_realizadas ?? 0)],
        ['Custo insumos/sessão',      formatarMoeda(ind.custo_insumos_por_sessao ?? 0)],
        ['Folha sobre receita',       `${(ind.folha_sobre_receita ?? 0).toFixed(1)}%`],
      ]

      let yFin = doc.y
      for (let i = 0; i < pares.length; i += 2) {
        const bg = i % 4 === 0 ? CORES.cinzaClaro : '#FFFFFF'
        doc.rect(L, yFin, CW, 22).fill(bg)
        for (let j = 0; j < 2 && i + j < pares.length; j++) {
          const [label, valor] = pares[i + j]
          const xCol = L + j * (CW / 2) + 8
          doc.fontSize(7).fillColor(CORES.cinza).font('Helvetica').text(label, xCol, yFin + 4)
          doc.fontSize(9).fillColor(CORES.texto).font('Helvetica-Bold').text(valor, xCol, yFin + 13)
        }
        yFin += 22
      }
      doc.rect(L, doc.y, CW, yFin - doc.y).lineWidth(0.5).stroke(CORES.cinzaBorda)
      doc.y = yFin
      doc.moveDown(0.8)
    }

    // ── 6. PLANO DE AÇÃO ──────────────────────────────────────────────────────
    if (doc.y > doc.page.height - 150) { doc.addPage(); cabecalhoPagina() }
    secao('6. Plano de Ação Priorizado (Matriz GUT)')
    doc.moveDown(0.4)

    if (dados.plano_acao.length > 0) {
      let yAc = doc.y
      doc.rect(L, yAc, CW, 18).fill(CORES.azulClaro)
      doc.fontSize(7).fillColor(CORES.azul).font('Helvetica-Bold')
        .text('#', L + 4, yAc + 5, { width: CW * 0.04 })
        .text('Prioridade', L + CW * 0.04 + 4, yAc + 5, { width: CW * 0.10 })
        .text('Ação', L + CW * 0.14 + 4, yAc + 5, { width: CW * 0.32 })
        .text('Responsáveis', L + CW * 0.46 + 4, yAc + 5, { width: CW * 0.18 })
        .text('Origem', L + CW * 0.64 + 4, yAc + 5, { width: CW * 0.12 })
        .text('Prazo', L + CW * 0.76 + 4, yAc + 5, { width: CW * 0.12 })
        .text('Status', L + CW * 0.88 + 4, yAc + 5, { width: CW * 0.12 })
      yAc += 18

      for (let i = 0; i < dados.plano_acao.length; i++) {
        const a = dados.plano_acao[i]
        const corP = a.prioridade === 'CRITICA' ? CORES.vermelho
          : a.prioridade === 'ALTA' ? CORES.amarelo : CORES.cinza
        const altura = Math.max(22, Math.ceil((a.titulo.length / 35)) * 11 + 8)
        if (yAc + altura > doc.page.height - 60) {
          doc.addPage(); cabecalhoPagina(); yAc = 60
        }
        const bg = i % 2 === 0 ? '#FFFFFF' : CORES.cinzaClaro
        doc.rect(L, yAc, CW, altura).fill(bg)

        const agentesLabel = (a.agentes ?? [])
          .map(ag => AGENTE_LABELS[ag] ?? ag).join(', ') || '—'

        doc.fontSize(7).fillColor(CORES.cinza).font('Helvetica')
          .text(String(i + 1), L + 4, yAc + 6, { width: CW * 0.04 })
        doc.fontSize(7).fillColor(corP).font('Helvetica-Bold')
          .text(a.prioridade, L + CW * 0.04 + 4, yAc + 6, { width: CW * 0.10 })
        doc.fontSize(7).fillColor(CORES.texto).font('Helvetica')
          .text(a.titulo, L + CW * 0.14 + 4, yAc + 6, { width: CW * 0.32 })
          .text(agentesLabel, L + CW * 0.46 + 4, yAc + 6, { width: CW * 0.18 })
          .text(a.origem.replace('_', ' '), L + CW * 0.64 + 4, yAc + 6, { width: CW * 0.12 })
          .text(formatarData(a.prazo), L + CW * 0.76 + 4, yAc + 6, { width: CW * 0.12 })
          .text(a.status.replace('_', ' '), L + CW * 0.88 + 4, yAc + 6, { width: CW * 0.12 })
        yAc += altura
      }
      doc.rect(L, doc.y, CW, yAc - doc.y).lineWidth(0.5).stroke(CORES.cinzaBorda)
      doc.y = yAc
    } else {
      doc.fontSize(9).fillColor(CORES.cinza).text('Nenhuma ação registrada.', L, doc.y)
    }

    // Rodapé final
    doc.moveDown(1)
    doc.moveTo(L, doc.y).lineTo(W - R, doc.y).lineWidth(0.5).strokeColor(CORES.cinzaBorda).stroke()
    doc.moveDown(0.3)
    doc.fontSize(7).fillColor(CORES.cinza).font('Helvetica')
      .text(`LC Saúde Consultoria em Nefrologia — Relatório gerado em ${dataGeracao} — Documento Confidencial`, L, doc.y, { align: 'center', width: CW })

    doc.end()
  })
}
