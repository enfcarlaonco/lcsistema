// Seed adicional — perguntas B1 a B5
// Execute: npx tsx prisma/seed_perguntas.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Cadastrando perguntas B1 a B5...')

  // ── BLOCO 1 — Estrutura física ──
  const b1 = await prisma.blocoQuestionario.findUnique({ where: { codigo: 'B1' } })
  if (b1) {
    const perguntasB1 = [
      { codigo: 'B1_P01', enunciado: 'O serviço possui área exclusiva para hemodiálise separada de outras atividades?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 1 },
      { codigo: 'B1_P02', enunciado: 'Qual é o número total de poltronas/leitos disponíveis para hemodiálise?', tipo: 'NUMERO', obrigatoria: true, ordem: 2 },
      { codigo: 'B1_P03', enunciado: 'Quantos turnos de diálise são realizados por dia?', tipo: 'NUMERO', obrigatoria: true, ajuda: 'Informe o número de turnos (ex.: 2, 3 ou 4)', ordem: 3 },
      { codigo: 'B1_P04', enunciado: 'O serviço possui sala exclusiva para pacientes HBsAg positivo?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 4 },
      { codigo: 'B1_P05', enunciado: 'Quantas máquinas de hemodiálise estão em funcionamento?', tipo: 'NUMERO', obrigatoria: true, ordem: 5 },
      { codigo: 'B1_P06', enunciado: 'Quantas máquinas estão reservadas exclusivamente para pacientes HBsAg positivo?', tipo: 'NUMERO', obrigatoria: true, ordem: 6 },
      { codigo: 'B1_P07', enunciado: 'O serviço possui Sistema de Tratamento e Distribuição de Água para Hemodiálise (STDAH)?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 7 },
      { codigo: 'B1_P08', enunciado: 'O STDAH possui contrato de manutenção preventiva vigente?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 8 },
      { codigo: 'B1_P09', enunciado: 'Os laudos de análise da água para diálise estão em dia (mensal e semestral)?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 9 },
      { codigo: 'B1_P10', enunciado: 'O serviço realiza reprocessamento (reuso) de capilares?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 10 },
      { codigo: 'B1_P11', enunciado: 'Se realiza reuso, a sala de reprocessamento é exclusiva e separada do salão de diálise?', tipo: 'BOOLEAN', obrigatoria: false, ordem: 11 },
      { codigo: 'B1_P12', enunciado: 'O serviço possui área de expurgo adequada para descarte de resíduos biológicos?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 12 },
      { codigo: 'B1_P13', enunciado: 'O serviço possui lavatórios com torneiras sem acionamento manual dentro do salão?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 13 },
      { codigo: 'B1_P14', enunciado: 'Qual tipo de membrana (capilar) é utilizado predominantemente?', tipo: 'SELECAO_UNICA', obrigatoria: true, opcoes: ['ALTO_FLUXO', 'MEDIO_FLUXO', 'BAIXO_FLUXO', 'MISTO'], ordem: 14 },
      { codigo: 'B1_P15', enunciado: 'O serviço possui contrato de manutenção preventiva das máquinas de hemodiálise?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 15 },
    ]
    for (const p of perguntasB1) {
      await prisma.pergunta.upsert({
        where: { codigo: p.codigo },
        update: {},
        create: { ...p, bloco_id: b1.id } as any,
      })
    }
    console.log(`✅ Bloco B1: ${perguntasB1.length} perguntas`)
  }

  // ── BLOCO 2 — Recursos humanos ──
  const b2 = await prisma.blocoQuestionario.findUnique({ where: { codigo: 'B2' } })
  if (b2) {
    const perguntasB2 = [
      { codigo: 'B2_P01', enunciado: 'O serviço possui médico nefrologista como Responsável Técnico (RT) registrado na Vigilância Sanitária?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 1 },
      { codigo: 'B2_P02', enunciado: 'O serviço possui enfermeiro com habilitação em nefrologia como RT de enfermagem?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 2 },
      { codigo: 'B2_P03', enunciado: 'Qual é o número total de enfermeiros que atuam no serviço?', tipo: 'NUMERO', obrigatoria: true, ordem: 3 },
      { codigo: 'B2_P04', enunciado: 'Qual é o número total de técnicos de enfermagem que atuam no serviço?', tipo: 'NUMERO', obrigatoria: true, ordem: 4 },
      { codigo: 'B2_P05', enunciado: 'O dimensionamento de técnicos de enfermagem respeita a proporção de 1 técnico para cada 4 pacientes por turno?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 5 },
      { codigo: 'B2_P06', enunciado: 'O serviço conta com nutricionista?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 6 },
      { codigo: 'B2_P07', enunciado: 'O serviço conta com assistente social?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 7 },
      { codigo: 'B2_P08', enunciado: 'O serviço conta com psicólogo?', tipo: 'BOOLEAN', obrigatoria: false, ordem: 8 },
      { codigo: 'B2_P09', enunciado: 'O serviço conta com fisioterapeuta?', tipo: 'BOOLEAN', obrigatoria: false, ordem: 9 },
      { codigo: 'B2_P10', enunciado: 'O serviço possui Programa de Controle Médico de Saúde Ocupacional (PCMSO) vigente?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'NR_32', ordem: 10 },
      { codigo: 'B2_P11', enunciado: 'Os profissionais possuem registro de vacinação contra Hepatite B?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'NR_32', ordem: 11 },
      { codigo: 'B2_P12', enunciado: 'O serviço possui registro de capacitações realizadas nos últimos 12 meses?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 12 },
      { codigo: 'B2_P13', enunciado: 'Os profissionais receberam capacitação sobre boas práticas em hemodiálise nos últimos 12 meses?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 13 },
    ]
    for (const p of perguntasB2) {
      await prisma.pergunta.upsert({
        where: { codigo: p.codigo },
        update: {},
        create: { ...p, bloco_id: b2.id } as any,
      })
    }
    console.log(`✅ Bloco B2: ${perguntasB2.length} perguntas`)
  }

  // ── BLOCO 3 — Processos e documentos ──
  const b3 = await prisma.blocoQuestionario.findUnique({ where: { codigo: 'B3' } })
  if (b3) {
    const perguntasB3 = [
      { codigo: 'B3_P01', enunciado: 'O serviço possui Manual de Procedimentos Operacionais Padrão (MPOP) atualizado e assinado pelos RTs?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 1 },
      { codigo: 'B3_P02', enunciado: 'Existe POP para o procedimento de hemodiálise (montagem, conexão, monitoramento e desconexão)?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 2 },
      { codigo: 'B3_P03', enunciado: 'Existe POP para reprocessamento de capilares?', tipo: 'BOOLEAN', obrigatoria: false, ajuda: 'Obrigatório apenas se o serviço realiza reuso', ordem: 3 },
      { codigo: 'B3_P04', enunciado: 'Existe fluxo formal para admissão de novos pacientes em hemodiálise?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 4 },
      { codigo: 'B3_P05', enunciado: 'Os prontuários dos pacientes contêm todos os exames periódicos obrigatórios atualizados?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 5 },
      { codigo: 'B3_P06', enunciado: 'O serviço possui Programa de Controle e Prevenção de Infecção e Eventos Adversos (PCPIEA) implementado?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 6 },
      { codigo: 'B3_P07', enunciado: 'O serviço realiza notificação de infecções e eventos adversos à Vigilância Sanitária?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 7 },
      { codigo: 'B3_P08', enunciado: 'Existe checklist de auditoria interna aplicado periodicamente?', tipo: 'BOOLEAN', obrigatoria: false, ordem: 8 },
      { codigo: 'B3_P09', enunciado: 'O serviço possui fluxo documentado para manejo de intercorrências durante a sessão?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 9 },
      { codigo: 'B3_P10', enunciado: 'Existe controle de acesso vascular documentado (tipo, data de implante, avaliações e trocas)?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 10 },
      { codigo: 'B3_P11', enunciado: 'O serviço possui protocolo de anticoagulação (heparina/taurolok) documentado e atualizado?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 11 },
      { codigo: 'B3_P12', enunciado: 'Existe impresso/formulário de não conformidade utilizado pela equipe?', tipo: 'BOOLEAN', obrigatoria: false, ordem: 12 },
      { codigo: 'B3_P13', enunciado: 'O serviço possui fluxo de busca ativa de pacientes faltosos documentado?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 13 },
      { codigo: 'B3_P14', enunciado: 'Os contratos com serviços terceirizados (água, manutenção, alimentação, limpeza) estão vigentes e arquivados?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 14 },
    ]
    for (const p of perguntasB3) {
      await prisma.pergunta.upsert({
        where: { codigo: p.codigo },
        update: {},
        create: { ...p, bloco_id: b3.id } as any,
      })
    }
    console.log(`✅ Bloco B3: ${perguntasB3.length} perguntas`)
  }

  // ── BLOCO 4 — Faturamento e custos ──
  const b4 = await prisma.blocoQuestionario.findUnique({ where: { codigo: 'B4' } })
  if (b4) {
    const perguntasB4 = [
      { codigo: 'B4_P01', enunciado: 'Qual é o número total de sessões de hemodiálise realizadas no último mês?', tipo: 'NUMERO', obrigatoria: true, ordem: 1 },
      { codigo: 'B4_P02', enunciado: 'Qual é o número total de sessões faturadas no último mês?', tipo: 'NUMERO', obrigatoria: true, ordem: 2 },
      { codigo: 'B4_P03', enunciado: 'Qual foi o faturamento bruto total no último mês (R$)?', tipo: 'MOEDA', obrigatoria: true, ordem: 3 },
      { codigo: 'B4_P04', enunciado: 'Qual foi o valor total de glosas no último mês (R$)?', tipo: 'MOEDA', obrigatoria: true, ordem: 4 },
      { codigo: 'B4_P05', enunciado: 'Qual é o principal tipo de glosa recorrente?', tipo: 'SELECAO_UNICA', obrigatoria: false, opcoes: ['ADMINISTRATIVA', 'TECNICA', 'LINEAR', 'NAO_SEI_IDENTIFICAR'], ordem: 5 },
      { codigo: 'B4_P06', enunciado: 'O serviço realiza auditoria prévia das APACs antes do envio?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 6 },
      { codigo: 'B4_P07', enunciado: 'Qual foi o custo total com insumos (capilares, soluções, materiais) no último mês (R$)?', tipo: 'MOEDA', obrigatoria: true, ordem: 7 },
      { codigo: 'B4_P08', enunciado: 'Qual foi o custo total com mão de obra (folha + encargos + terceirizados) no último mês (R$)?', tipo: 'MOEDA', obrigatoria: true, ordem: 8 },
      { codigo: 'B4_P09', enunciado: 'Qual foi o custo com manutenção de equipamentos no último mês (R$)?', tipo: 'MOEDA', obrigatoria: false, ordem: 9 },
      { codigo: 'B4_P10', enunciado: 'Qual foi o custo com tratamento de água no último mês (R$)?', tipo: 'MOEDA', obrigatoria: false, ordem: 10 },
      { codigo: 'B4_P11', enunciado: 'O serviço tem controle mensal do custo por sessão de hemodiálise?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 11 },
      { codigo: 'B4_P12', enunciado: 'O serviço possui tabela atualizada com todos os códigos SIGTAP que podem ser faturados?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 12 },
      { codigo: 'B4_P13', enunciado: 'Existe calendário de fechamento mensal do faturamento com datas definidas?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 13 },
    ]
    for (const p of perguntasB4) {
      await prisma.pergunta.upsert({
        where: { codigo: p.codigo },
        update: {},
        create: { ...p, bloco_id: b4.id } as any,
      })
    }
    console.log(`✅ Bloco B4: ${perguntasB4.length} perguntas`)
  }

  // ── BLOCO 5 — Indicadores ──
  const b5 = await prisma.blocoQuestionario.findUnique({ where: { codigo: 'B5' } })
  if (b5) {
    const perguntasB5 = [
      { codigo: 'B5_P01', enunciado: 'O serviço monitora e registra a taxa de infecção de acesso vascular?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 1 },
      { codigo: 'B5_P02', enunciado: 'O serviço notifica infecções de corrente sanguínea associadas ao cateter (ICSAC) à VISA?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 2 },
      { codigo: 'B5_P03', enunciado: 'O serviço monitora a taxa de hospitalização de pacientes em hemodiálise?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 3 },
      { codigo: 'B5_P04', enunciado: 'O serviço possui painel de indicadores atualizado mensalmente?', tipo: 'BOOLEAN', obrigatoria: false, ordem: 4 },
      { codigo: 'B5_P05', enunciado: 'Os indicadores pactuados com a VISA/ANVISA estão sendo monitorados e reportados?', tipo: 'BOOLEAN', obrigatoria: true, legislacao_referencia: 'RDC_11_2014', ordem: 5 },
      { codigo: 'B5_P06', enunciado: 'O serviço monitora a adequação da diálise (Kt/V)?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 6 },
      { codigo: 'B5_P07', enunciado: 'O serviço possui registro de absenteísmo de pacientes e plano de busca ativa?', tipo: 'BOOLEAN', obrigatoria: true, ordem: 7 },
      { codigo: 'B5_P08', enunciado: 'O serviço de limpeza e higienização é próprio ou terceirizado?', tipo: 'SELECAO_UNICA', obrigatoria: true, opcoes: ['PROPRIO', 'TERCEIRIZADO'], ordem: 8 },
      { codigo: 'B5_P09', enunciado: 'O serviço de alimentação dos pacientes é próprio ou terceirizado?', tipo: 'SELECAO_UNICA', obrigatoria: true, opcoes: ['PROPRIO', 'TERCEIRIZADO', 'NAO_OFERECE'], ordem: 9 },
      { codigo: 'B5_P10', enunciado: 'O serviço de manutenção dos equipamentos é próprio ou terceirizado?', tipo: 'SELECAO_UNICA', obrigatoria: true, opcoes: ['PROPRIO', 'TERCEIRIZADO'], ordem: 10 },
      { codigo: 'B5_P11', enunciado: 'O laboratório de exames é próprio ou terceirizado?', tipo: 'SELECAO_UNICA', obrigatoria: true, opcoes: ['PROPRIO', 'TERCEIRIZADO'], ordem: 11 },
      { codigo: 'B5_P12', enunciado: 'O serviço realiza auditoria interna de qualidade periodicamente?', tipo: 'BOOLEAN', obrigatoria: false, ordem: 12 },
    ]
    for (const p of perguntasB5) {
      await prisma.pergunta.upsert({
        where: { codigo: p.codigo },
        update: {},
        create: { ...p, bloco_id: b5.id } as any,
      })
    }
    console.log(`✅ Bloco B5: ${perguntasB5.length} perguntas`)
  }

  console.log('🎉 Perguntas B1 a B5 cadastradas com sucesso!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
