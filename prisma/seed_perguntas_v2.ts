// prisma/seed_perguntas_v2.ts
// Questionário completo — Roteiro Luciana Milagres / LC Saúde
// Execute: npx tsx prisma/seed_perguntas_v2.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function upsertBloco(dados: {
  tipo: string, codigo: string, titulo: string, ordem: number, obrigatorio: boolean
}) {
  return prisma.blocoQuestionario.upsert({
    where: { codigo: dados.codigo },
    update: { titulo: dados.titulo },
    create: dados as any,
  })
}

async function upsertPergunta(blocoId: string, p: {
  codigo: string
  enunciado: string
  tipo: string
  ordem: number
  obrigatoria?: boolean
  ajuda?: string
  opcoes?: string[]
  legislacao_referencia?: string
}) {
  await prisma.pergunta.upsert({
    where: { codigo: p.codigo },
    update: {},
    create: {
      ...p,
      obrigatoria: p.obrigatoria ?? true,
      bloco_id: blocoId,
    } as any,
  })
}

async function main() {
  console.log('🌱 Seed questionário completo — Roteiro Luciana Milagres...')

  // ══════════════════════════════════════════════════════════════════════
  // B0 — IDENTIFICAÇÃO DO SERVIÇO
  // ══════════════════════════════════════════════════════════════════════
  const b0 = await upsertBloco({
    tipo: 'IDENTIFICACAO', codigo: 'B0',
    titulo: 'Identificação do Serviço', ordem: 0, obrigatorio: true,
  })
  const perguntasB0 = [
    { codigo: 'B0_P01', enunciado: 'Razão social do serviço', tipo: 'TEXTO', ordem: 1 },
    { codigo: 'B0_P02', enunciado: 'Nome fantasia', tipo: 'TEXTO', ordem: 2 },
    { codigo: 'B0_P03', enunciado: 'CNPJ', tipo: 'TEXTO', ordem: 3 },
    { codigo: 'B0_P04', enunciado: 'Endereço completo', tipo: 'TEXTO', ordem: 4 },
    { codigo: 'B0_P05', enunciado: 'CNES', tipo: 'TEXTO', ordem: 5 },
    { codigo: 'B0_P06', enunciado: 'Licença sanitária nº (CVES)', tipo: 'TEXTO', ordem: 6 },
    { codigo: 'B0_P07', enunciado: 'Data de validade da licença sanitária', tipo: 'TEXTO', ordem: 7 },
    { codigo: 'B0_P08', enunciado: 'Natureza do serviço', tipo: 'TEXTO', ordem: 8 },
    { codigo: 'B0_P09', enunciado: 'Período de diagnóstico', tipo: 'TEXTO', ordem: 9 },
  ]
  for (const p of perguntasB0) await upsertPergunta(b0.id, p)
  console.log(`✅ B0: ${perguntasB0.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B1 — MAPEAMENTO DO ESPAÇO FÍSICO
  // ══════════════════════════════════════════════════════════════════════
  const b1 = await upsertBloco({
    tipo: 'ESTRUTURA_FISICA', codigo: 'B1',
    titulo: 'Mapeamento do Espaço Físico', ordem: 1, obrigatorio: true,
  })
  const perguntasB1 = [
    { codigo: 'B1_P01', enunciado: 'Quantas salas de hemodiálise o serviço possui?', tipo: 'NUMERO', ordem: 1 },
    { codigo: 'B1_P02', enunciado: 'Possui sala de Hepatite B?', tipo: 'BOOLEAN', ordem: 2, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P03', enunciado: 'Realiza reuso (acondicionamento de dialisadores)? Descreva: colmeia, materiais cobertos, processo de diluição, reprocessadoras e média de reutilização de materiais.', tipo: 'TEXTO', ordem: 3, obrigatoria: false },
    { codigo: 'B1_P04', enunciado: 'Quantos pontos de diálise?', tipo: 'NUMERO', ordem: 4 },
    { codigo: 'B1_P05', enunciado: 'Tratamento de água — manutenção dos equipamentos realizada por qual empresa?', tipo: 'TEXTO', ordem: 5 },
    { codigo: 'B1_P06', enunciado: 'Possui DML (Depósito de Material de Limpeza)?', tipo: 'BOOLEAN', ordem: 6 },
    { codigo: 'B1_P07', enunciado: 'Possui banheiro para paciente?', tipo: 'BOOLEAN', ordem: 7 },
    { codigo: 'B1_P08', enunciado: 'Possui copa?', tipo: 'BOOLEAN', ordem: 8 },
    { codigo: 'B1_P09', enunciado: 'Possui banheiro para funcionário?', tipo: 'BOOLEAN', ordem: 9 },
    { codigo: 'B1_P10', enunciado: 'Possui almoxarifado?', tipo: 'BOOLEAN', ordem: 10 },
    { codigo: 'B1_P11', enunciado: 'Possui secretaria?', tipo: 'BOOLEAN', ordem: 11 },
    { codigo: 'B1_P12', enunciado: 'Possui sala de pesagem com calibração de balanças?', tipo: 'BOOLEAN', ordem: 12 },
    // Art. 17 — ambientes mínimos (SIM/NÃO)
    { codigo: 'B1_P13', enunciado: 'Art. 17 — Possui consultório?', tipo: 'BOOLEAN', ordem: 13, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P14', enunciado: 'Art. 17 — Possui área para prescrição médica?', tipo: 'BOOLEAN', ordem: 14, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P15', enunciado: 'Art. 17 — Possui posto de enfermagem?', tipo: 'BOOLEAN', ordem: 15, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P16', enunciado: 'Art. 17 — Possui sala de recuperação e atendimento de emergência?', tipo: 'BOOLEAN', ordem: 16, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P17', enunciado: 'Art. 17 — Possui área para guarda dos pertences dos pacientes?', tipo: 'BOOLEAN', ordem: 17, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P18', enunciado: 'Art. 17 — Possui área de registro (arquivo) e espera de pacientes e acompanhantes?', tipo: 'BOOLEAN', ordem: 18, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P19', enunciado: 'Art. 17 — Possui sala de utilidades?', tipo: 'BOOLEAN', ordem: 19, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P20', enunciado: 'Art. 17 — Possui sanitários para pacientes (masculino, feminino e adaptado)?', tipo: 'BOOLEAN', ordem: 20, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P21', enunciado: 'Art. 17 — Possui sanitários para funcionários (masculino e feminino)?', tipo: 'BOOLEAN', ordem: 21, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P22', enunciado: 'Art. 17 — Possui depósito de material de limpeza?', tipo: 'BOOLEAN', ordem: 22, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P23', enunciado: 'Art. 17 — Possui depósito de material (almoxarifado)?', tipo: 'BOOLEAN', ordem: 23, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P24', enunciado: 'Art. 17 — Possui área para guarda dos pertences dos funcionários?', tipo: 'BOOLEAN', ordem: 24, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P25', enunciado: 'Art. 17 — Possui área de maca e cadeira de rodas?', tipo: 'BOOLEAN', ordem: 25, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P26', enunciado: 'Art. 17 — Possui sala para hemodiálise com área para lavagem de fístulas?', tipo: 'BOOLEAN', ordem: 26, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P27', enunciado: 'Art. 17 — Possui sala para hemodiálise de pacientes com sorologia positiva para Hepatite B com área para lavagem de fístulas?', tipo: 'BOOLEAN', ordem: 27, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P28', enunciado: 'Art. 17 — Possui sala para processamento dos dialisadores?', tipo: 'BOOLEAN', ordem: 28, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P29', enunciado: 'Art. 17 — Possui área específica para armazenamento dos recipientes de acondicionamento do dialisador?', tipo: 'BOOLEAN', ordem: 29, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P30', enunciado: 'Art. 17 — Possui sala do STDAH?', tipo: 'BOOLEAN', ordem: 30, legislacao_referencia: 'RDC_11_2014' },
    // Art. 18 — sala de processamento de dialisadores
    { codigo: 'B1_P31', enunciado: 'Art. 18 — A sala de processamento de dialisadores é exclusiva e contígua à sala de hemodiálise?', tipo: 'BOOLEAN', ordem: 31, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P32', enunciado: 'Art. 18 — A sala de processamento possui sistema de exaustão de ar?', tipo: 'BOOLEAN', ordem: 32, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P33', enunciado: 'Art. 18 — Possui bancadas específicas para etapa de limpeza abastecidas com água tratada para hemodiálise e cuba profunda?', tipo: 'BOOLEAN', ordem: 33, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P34', enunciado: 'Art. 18 — Possui bancada específica para etapa de esterilização do dialisador?', tipo: 'BOOLEAN', ordem: 34, legislacao_referencia: 'RDC_11_2014' },
    // Art. 20 — DP
    { codigo: 'B1_P35', enunciado: 'Art. 20 — (Se aplica DP) Possui sala de treinamento para pacientes de diálise peritoneal?', tipo: 'BOOLEAN', ordem: 35, obrigatoria: false, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P36', enunciado: 'Art. 20 — (Se aplica DP) Possui sala para diálise peritoneal?', tipo: 'BOOLEAN', ordem: 36, obrigatoria: false, legislacao_referencia: 'RDC_11_2014' },
    // Planos de contingência
    { codigo: 'B1_P37', enunciado: 'Art. 24 — Possui sistema de energia elétrica de emergência (gerador) para garantir continuidade em caso de interrupção do fornecimento?', tipo: 'BOOLEAN', ordem: 37, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B1_P38', enunciado: 'Possui plano de contingência documentado para situações de emergência?', tipo: 'BOOLEAN', ordem: 38 },
  ]
  for (const p of perguntasB1) await upsertPergunta(b1.id, p)
  console.log(`✅ B1: ${perguntasB1.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B2 — CAPACIDADE OPERACIONAL (Quadros I, II e III agrupados)
  // ══════════════════════════════════════════════════════════════════════
  const b2 = await upsertBloco({
    tipo: 'CAPACIDADE_OPERACIONAL', codigo: 'B2',
    titulo: 'Capacidade Operacional — Pacientes, Máquinas e Turnos', ordem: 2, obrigatorio: true,
  })
  const perguntasB2 = [
    // QUADRO I — Pacientes por modalidade × sorologia
    { codigo: 'B2_P01', enunciado: 'Quadro I — Hemodiálise: nº de pacientes SUS', tipo: 'NUMERO', ordem: 1 },
    { codigo: 'B2_P02', enunciado: 'Quadro I — Hemodiálise: nº de pacientes Convênio/Particular', tipo: 'NUMERO', ordem: 2 },
    { codigo: 'B2_P03', enunciado: 'Quadro I — Hemodiálise: total de pacientes', tipo: 'NUMERO', ordem: 3 },
    { codigo: 'B2_P04', enunciado: 'Quadro I — Hemodiálise: nº pacientes com sorologia não reagente', tipo: 'NUMERO', ordem: 4 },
    { codigo: 'B2_P05', enunciado: 'Quadro I — Hemodiálise: nº pacientes Hepatite B positivo', tipo: 'NUMERO', ordem: 5 },
    { codigo: 'B2_P06', enunciado: 'Quadro I — Hemodiálise: nº pacientes Hepatite C positivo', tipo: 'NUMERO', ordem: 6 },
    { codigo: 'B2_P07', enunciado: 'Quadro I — Hemodiálise: nº pacientes HIV positivo', tipo: 'NUMERO', ordem: 7 },
    { codigo: 'B2_P08', enunciado: 'Quadro I — Hemodiálise: códigos de faturamento utilizados', tipo: 'TEXTO', ordem: 8, ajuda: 'Informe todos os códigos SIGTAP utilizados para esta modalidade, separados por vírgula.' },
    { codigo: 'B2_P09', enunciado: 'Quadro I — DPAC: nº de pacientes SUS', tipo: 'NUMERO', ordem: 9 },
    { codigo: 'B2_P10', enunciado: 'Quadro I — DPAC: nº de pacientes Convênio/Particular', tipo: 'NUMERO', ordem: 10 },
    { codigo: 'B2_P11', enunciado: 'Quadro I — DPAC: total de pacientes', tipo: 'NUMERO', ordem: 11 },
    { codigo: 'B2_P12', enunciado: 'Quadro I — DPAC: nº pacientes com sorologia não reagente', tipo: 'NUMERO', ordem: 12 },
    { codigo: 'B2_P13', enunciado: 'Quadro I — DPAC: nº pacientes Hepatite B positivo', tipo: 'NUMERO', ordem: 13 },
    { codigo: 'B2_P14', enunciado: 'Quadro I — DPAC: nº pacientes Hepatite C positivo', tipo: 'NUMERO', ordem: 14 },
    { codigo: 'B2_P15', enunciado: 'Quadro I — DPAC: nº pacientes HIV positivo', tipo: 'NUMERO', ordem: 15 },
    { codigo: 'B2_P16', enunciado: 'Quadro I — DPAC: códigos de faturamento utilizados', tipo: 'TEXTO', ordem: 16, ajuda: 'Informe todos os códigos SIGTAP utilizados para esta modalidade, separados por vírgula.' },
    { codigo: 'B2_P17', enunciado: 'Quadro I — DPA: nº de pacientes SUS', tipo: 'NUMERO', ordem: 17 },
    { codigo: 'B2_P18', enunciado: 'Quadro I — DPA: nº de pacientes Convênio/Particular', tipo: 'NUMERO', ordem: 18 },
    { codigo: 'B2_P19', enunciado: 'Quadro I — DPA: total de pacientes', tipo: 'NUMERO', ordem: 19 },
    { codigo: 'B2_P20', enunciado: 'Quadro I — DPA: nº pacientes com sorologia não reagente', tipo: 'NUMERO', ordem: 20 },
    { codigo: 'B2_P21', enunciado: 'Quadro I — DPA: nº pacientes Hepatite B positivo', tipo: 'NUMERO', ordem: 21 },
    { codigo: 'B2_P22', enunciado: 'Quadro I — DPA: nº pacientes Hepatite C positivo', tipo: 'NUMERO', ordem: 22 },
    { codigo: 'B2_P23', enunciado: 'Quadro I — DPA: nº pacientes HIV positivo', tipo: 'NUMERO', ordem: 23 },
    { codigo: 'B2_P24', enunciado: 'Quadro I — DPA: códigos de faturamento utilizados', tipo: 'TEXTO', ordem: 24, ajuda: 'Informe todos os códigos SIGTAP utilizados para esta modalidade, separados por vírgula.' },
    { codigo: 'B2_P25', enunciado: 'Quadro I — DPI: nº de pacientes SUS', tipo: 'NUMERO', ordem: 25 },
    { codigo: 'B2_P26', enunciado: 'Quadro I — DPI: nº de pacientes Convênio/Particular', tipo: 'NUMERO', ordem: 26 },
    { codigo: 'B2_P27', enunciado: 'Quadro I — DPI: total de pacientes', tipo: 'NUMERO', ordem: 27 },
    { codigo: 'B2_P28', enunciado: 'Quadro I — DPI: nº pacientes com sorologia não reagente', tipo: 'NUMERO', ordem: 28 },
    { codigo: 'B2_P29', enunciado: 'Quadro I — DPI: nº pacientes Hepatite B positivo', tipo: 'NUMERO', ordem: 29 },
    { codigo: 'B2_P30', enunciado: 'Quadro I — DPI: nº pacientes Hepatite C positivo', tipo: 'NUMERO', ordem: 30 },
    { codigo: 'B2_P31', enunciado: 'Quadro I — DPI: nº pacientes HIV positivo', tipo: 'NUMERO', ordem: 31 },
    { codigo: 'B2_P32', enunciado: 'Quadro I — DPI: códigos de faturamento utilizados', tipo: 'TEXTO', ordem: 32, ajuda: 'Informe todos os códigos SIGTAP utilizados para esta modalidade, separados por vírgula.' },
    { codigo: 'B2_P33', enunciado: 'Quadro I — Observações: há pacientes com sorologia sem definição?', tipo: 'TEXTO', ordem: 33, obrigatoria: false },
    { codigo: 'B2_P34', enunciado: 'Quadro I — Tempo de liberação de exames de sorologia (dias)', tipo: 'NUMERO', ordem: 34, obrigatoria: false },
    { codigo: 'B2_P35', enunciado: 'Quadro I — Utiliza material de uso único?', tipo: 'BOOLEAN', ordem: 35 },
    { codigo: 'B2_P36', enunciado: 'Quadro I — Realiza diálises de CTI? Se sim, qual a perda por coagulação?', tipo: 'TEXTO', ordem: 36, obrigatoria: false },
    // QUADRO II — Máquinas
    { codigo: 'B2_P37', enunciado: 'Quadro II — Nº de máquinas em uso', tipo: 'NUMERO', ordem: 37 },
    { codigo: 'B2_P38', enunciado: 'Quadro II — Nº de máquinas reserva', tipo: 'NUMERO', ordem: 38 },
    { codigo: 'B2_P39', enunciado: 'Quadro II — Nº de máquinas para sorologia desconhecida', tipo: 'NUMERO', ordem: 39 },
    { codigo: 'B2_P40', enunciado: 'Quadro II — Nº de máquinas em manutenção', tipo: 'NUMERO', ordem: 40 },
    { codigo: 'B2_P41', enunciado: 'Quadro II — Total de máquinas', tipo: 'NUMERO', ordem: 41 },
    // Perguntas abaixo do Quadro II (texto — opcionais)
    { codigo: 'B2_P42', enunciado: 'Tempo de uso do maquinário (anos de uso médio)', tipo: 'TEXTO', ordem: 42, obrigatoria: false },
    { codigo: 'B2_P43', enunciado: 'Contrato de manutenção: periodicidade de preventiva e corretiva', tipo: 'TEXTO', ordem: 43, obrigatoria: false },
    { codigo: 'B2_P44', enunciado: 'O que contempla o contrato de manutenção em relação à reposição de peças e mão de obra?', tipo: 'TEXTO', ordem: 44, obrigatoria: false },
    { codigo: 'B2_P45', enunciado: 'Como funciona o processo de compra de peças (vinculado ao contrato ou compra direta)?', tipo: 'TEXTO', ordem: 45, obrigatoria: false },
    { codigo: 'B2_P46', enunciado: 'Quanto tempo as máquinas aguardam por manutenção (em média)?', tipo: 'TEXTO', ordem: 46, obrigatoria: false },
    { codigo: 'B2_P47', enunciado: 'Possui manual das máquinas disponível?', tipo: 'BOOLEAN', ordem: 47 },
    { codigo: 'B2_P48', enunciado: 'Descreva e quantifique os tipos de manutenção realizados por máquina', tipo: 'TEXTO', ordem: 48, obrigatoria: false },
    { codigo: 'B2_P49', enunciado: 'Responsável pelo gerenciamento de contratos (nome e cargo)', tipo: 'TEXTO', ordem: 49, obrigatoria: false },
    // QUADRO III — Turnos × Máquinas × Pacientes
    { codigo: 'B2_P50', enunciado: 'Quadro III — 1º Turno / Sala HBsAg Negativo: nº máquinas em uso', tipo: 'NUMERO', ordem: 50 },
    { codigo: 'B2_P51', enunciado: 'Quadro III — 1º Turno / Sala HBsAg Negativo: nº pacientes adulto', tipo: 'NUMERO', ordem: 51 },
    { codigo: 'B2_P52', enunciado: 'Quadro III — 1º Turno / Sala HBsAg Negativo: nº pacientes criança', tipo: 'NUMERO', ordem: 52 },
    { codigo: 'B2_P53', enunciado: 'Quadro III — 1º Turno / Sala HBsAg Positivo: nº máquinas em uso', tipo: 'NUMERO', ordem: 53 },
    { codigo: 'B2_P54', enunciado: 'Quadro III — 1º Turno / Sala HBsAg Positivo: nº pacientes adulto', tipo: 'NUMERO', ordem: 54 },
    { codigo: 'B2_P55', enunciado: 'Quadro III — 1º Turno / Sala HBsAg Positivo: nº pacientes criança', tipo: 'NUMERO', ordem: 55 },
    { codigo: 'B2_P56', enunciado: 'Quadro III — 2º Turno / Sala HBsAg Negativo: nº máquinas em uso', tipo: 'NUMERO', ordem: 56 },
    { codigo: 'B2_P57', enunciado: 'Quadro III — 2º Turno / Sala HBsAg Negativo: nº pacientes adulto', tipo: 'NUMERO', ordem: 57 },
    { codigo: 'B2_P58', enunciado: 'Quadro III — 2º Turno / Sala HBsAg Negativo: nº pacientes criança', tipo: 'NUMERO', ordem: 58 },
    { codigo: 'B2_P59', enunciado: 'Quadro III — 2º Turno / Sala HBsAg Positivo: nº máquinas em uso', tipo: 'NUMERO', ordem: 59 },
    { codigo: 'B2_P60', enunciado: 'Quadro III — 2º Turno / Sala HBsAg Positivo: nº pacientes adulto', tipo: 'NUMERO', ordem: 60 },
    { codigo: 'B2_P61', enunciado: 'Quadro III — 2º Turno / Sala HBsAg Positivo: nº pacientes criança', tipo: 'NUMERO', ordem: 61 },
    { codigo: 'B2_P62', enunciado: 'Quadro III — 3º Turno / Sala HBsAg Negativo: nº máquinas em uso', tipo: 'NUMERO', ordem: 62 },
    { codigo: 'B2_P63', enunciado: 'Quadro III — 3º Turno / Sala HBsAg Negativo: nº pacientes adulto', tipo: 'NUMERO', ordem: 63 },
    { codigo: 'B2_P64', enunciado: 'Quadro III — 3º Turno / Sala HBsAg Negativo: nº pacientes criança', tipo: 'NUMERO', ordem: 64 },
    { codigo: 'B2_P65', enunciado: 'Quadro III — 3º Turno / Sala HBsAg Positivo: nº máquinas em uso', tipo: 'NUMERO', ordem: 65 },
    { codigo: 'B2_P66', enunciado: 'Quadro III — 3º Turno / Sala HBsAg Positivo: nº pacientes adulto', tipo: 'NUMERO', ordem: 66 },
    { codigo: 'B2_P67', enunciado: 'Quadro III — 3º Turno / Sala HBsAg Positivo: nº pacientes criança', tipo: 'NUMERO', ordem: 67 },
    { codigo: 'B2_P68', enunciado: 'Quadro III — 4º Turno / Sala HBsAg Negativo: nº máquinas em uso (se houver, justificar)', tipo: 'NUMERO', ordem: 68, obrigatoria: false },
    { codigo: 'B2_P69', enunciado: 'Quadro III — 4º Turno / Sala HBsAg Negativo: nº pacientes adulto', tipo: 'NUMERO', ordem: 69, obrigatoria: false },
    { codigo: 'B2_P70', enunciado: 'Quadro III — 4º Turno / Sala HBsAg Negativo: nº pacientes criança', tipo: 'NUMERO', ordem: 70, obrigatoria: false },
    { codigo: 'B2_P71', enunciado: 'Quadro III — 4º Turno / Sala HBsAg Positivo: nº máquinas em uso', tipo: 'NUMERO', ordem: 71, obrigatoria: false },
    { codigo: 'B2_P72', enunciado: 'Quadro III — 4º Turno / Sala HBsAg Positivo: nº pacientes adulto', tipo: 'NUMERO', ordem: 72, obrigatoria: false },
    { codigo: 'B2_P73', enunciado: 'Quadro III — 4º Turno / Sala HBsAg Positivo: nº pacientes criança', tipo: 'NUMERO', ordem: 73, obrigatoria: false },
    { codigo: 'B2_P74', enunciado: 'Quadro III — Justificativa para 4º turno (se aplicável)', tipo: 'TEXTO', ordem: 74, obrigatoria: false },
  ]
  for (const p of perguntasB2) await upsertPergunta(b2.id, p)
  console.log(`✅ B2: ${perguntasB2.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B3 — RECURSOS HUMANOS
  // ══════════════════════════════════════════════════════════════════════
  const b3 = await upsertBloco({
    tipo: 'RECURSOS_HUMANOS', codigo: 'B3',
    titulo: 'Recursos Humanos', ordem: 3, obrigatorio: true,
  })
  const perguntasB3 = [
    // Checklist RH (SIM/NÃO)
    { codigo: 'B3_P01', enunciado: 'Item 1 — Médico RT com especialidade em Nefrologia ou titulado (informar nome e CRM)', tipo: 'TEXTO', ordem: 1, legislacao_referencia: 'PT_389_2014', ajuda: 'Nível III — PT nº 389/2014 art. 20, 21 e 30; RDC 11 Art. 5' },
    { codigo: 'B3_P02', enunciado: 'Item 1 — Médico RT está devidamente registrado?', tipo: 'BOOLEAN', ordem: 2, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B3_P03', enunciado: 'Item 2 — Médico RT substituto com especialidade em Nefrologia (informar nome e CRM)', tipo: 'TEXTO', ordem: 3, obrigatoria: false, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B3_P04', enunciado: 'Item 2 — Médico RT substituto está devidamente registrado?', tipo: 'BOOLEAN', ordem: 4, obrigatoria: false, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B3_P05', enunciado: 'Item 3 — Enfermeiro RT com especialidade em nefrologia (informar nome e COREN)', tipo: 'TEXTO', ordem: 5, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B3_P06', enunciado: 'Item 3 — Enfermeiro RT está devidamente registrado?', tipo: 'BOOLEAN', ordem: 6, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B3_P07', enunciado: 'Item 4 — Técnico responsável pela operação do STDAH com treinamento específico (informar nome)', tipo: 'TEXTO', ordem: 7, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B3_P08', enunciado: 'Item 4 — Técnico do STDAH possui treinamento comprovado?', tipo: 'BOOLEAN', ordem: 8, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B3_P09', enunciado: 'Item 5 — Funcionários capacitados para medida do volume interno das fibras (priming)?', tipo: 'BOOLEAN', ordem: 9, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B3_P10', enunciado: 'Item 6 — Técnico/Auxiliar de enfermagem capacitado para diluir solução, desinfecção de linhas e dialisadores, enxágue e teste de níveis residuais do agente químico?', tipo: 'BOOLEAN', ordem: 10, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B3_P11', enunciado: 'Item 7 — Possui PCMSO elaborado de acordo com PPRA, atualizado?', tipo: 'BOOLEAN', ordem: 11, legislacao_referencia: 'NR_32' },
    { codigo: 'B3_P12', enunciado: 'Item 8 — O serviço registra e realiza notificação de acidente de trabalho?', tipo: 'BOOLEAN', ordem: 12 },
    { codigo: 'B3_P13', enunciado: 'Item 9 — Número suficiente de médico por turno × nº de pacientes inscritos no programa?', tipo: 'BOOLEAN', ordem: 13, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B3_P14', enunciado: 'Item 10 — Número suficiente de enfermeiro por turno × nº de pacientes inscritos no programa?', tipo: 'BOOLEAN', ordem: 14, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B3_P15', enunciado: 'Item 11 — Número suficiente de auxiliar ou técnico de enfermagem por turno × nº de pacientes inscritos?', tipo: 'BOOLEAN', ordem: 15, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B3_P16', enunciado: 'Item 12 — Auxiliar ou técnico de enfermagem exclusivo para a(s) sala(s) de reuso?', tipo: 'BOOLEAN', ordem: 16, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B3_P17', enunciado: 'Item 13 — Funcionário(s) exclusivo(s) para os serviços de limpeza?', tipo: 'BOOLEAN', ordem: 17, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B3_P18', enunciado: 'Item 14 — Funcionários exclusivos para manipular pacientes com sorologia positiva para Hepatite B e pacientes com sorologia não reativa no mesmo turno?', tipo: 'BOOLEAN', ordem: 18, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B3_P19', enunciado: 'Item 15 — Profissional capacitado para diluir a solução desinfetante no reuso?', tipo: 'BOOLEAN', ordem: 19, obrigatoria: false, legislacao_referencia: 'RDC_11_2014' },
    // Quadro IV — Médicos e Enfermagem por turno (NUMERO)
    { codigo: 'B3_P20', enunciado: 'Quadro IV — Médico nefrologista no 1º turno: quantidade', tipo: 'NUMERO', ordem: 20 },
    { codigo: 'B3_P21', enunciado: 'Quadro IV — Médico nefrologista no 2º turno: quantidade', tipo: 'NUMERO', ordem: 21 },
    { codigo: 'B3_P22', enunciado: 'Quadro IV — Médico nefrologista no 3º turno: quantidade', tipo: 'NUMERO', ordem: 22 },
    { codigo: 'B3_P23', enunciado: 'Quadro IV — Médico nefrologista no 4º turno: quantidade', tipo: 'NUMERO', ordem: 23, obrigatoria: false },
    { codigo: 'B3_P24', enunciado: 'Quadro IV — Enfermeiro no 1º turno: quantidade', tipo: 'NUMERO', ordem: 24 },
    { codigo: 'B3_P25', enunciado: 'Quadro IV — Enfermeiro no 2º turno: quantidade', tipo: 'NUMERO', ordem: 25 },
    { codigo: 'B3_P26', enunciado: 'Quadro IV — Enfermeiro no 3º turno: quantidade', tipo: 'NUMERO', ordem: 26 },
    { codigo: 'B3_P27', enunciado: 'Quadro IV — Enfermeiro no 4º turno: quantidade', tipo: 'NUMERO', ordem: 27, obrigatoria: false },
    { codigo: 'B3_P28', enunciado: 'Quadro IV — Técnico de enfermagem (sala HBsAg Negativo) no 1º turno: quantidade', tipo: 'NUMERO', ordem: 28 },
    { codigo: 'B3_P29', enunciado: 'Quadro IV — Técnico de enfermagem (sala HBsAg Negativo) no 2º turno: quantidade', tipo: 'NUMERO', ordem: 29 },
    { codigo: 'B3_P30', enunciado: 'Quadro IV — Técnico de enfermagem (sala HBsAg Negativo) no 3º turno: quantidade', tipo: 'NUMERO', ordem: 30 },
    { codigo: 'B3_P31', enunciado: 'Quadro IV — Técnico de enfermagem (sala HBsAg Negativo) no 4º turno: quantidade', tipo: 'NUMERO', ordem: 31, obrigatoria: false },
    { codigo: 'B3_P32', enunciado: 'Quadro IV — Observações sobre quadro de pessoal', tipo: 'TEXTO', ordem: 32, obrigatoria: false },
    // Quadro V — Outros profissionais (NUMERO)
    { codigo: 'B3_P33', enunciado: 'Quadro V — Número de psicólogos', tipo: 'NUMERO', ordem: 33 },
    { codigo: 'B3_P34', enunciado: 'Quadro V — Número de nutricionistas', tipo: 'NUMERO', ordem: 34 },
    { codigo: 'B3_P35', enunciado: 'Quadro V — Número de assistentes sociais', tipo: 'NUMERO', ordem: 35 },
    { codigo: 'B3_P36', enunciado: 'Quadro V — Número de funcionários exclusivos para limpeza', tipo: 'NUMERO', ordem: 36 },
    { codigo: 'B3_P37', enunciado: 'Quadro V — Número de copeiras (não obrigatório, mas verificar preparo de lanches e condições de higiene)', tipo: 'NUMERO', ordem: 37, obrigatoria: false },
  ]
  for (const p of perguntasB3) await upsertPergunta(b3.id, p)
  console.log(`✅ B3: ${perguntasB3.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B4 — ESTRUTURA FÍSICO-FUNCIONAL
  // ══════════════════════════════════════════════════════════════════════
  const b4 = await upsertBloco({
    tipo: 'ESTRUTURA_FUNCIONAL', codigo: 'B4',
    titulo: 'Estrutura Físico-Funcional', ordem: 4, obrigatorio: true,
  })
  const perguntasB4 = [
    { codigo: 'B4_P01', enunciado: 'Item 1 — Construção de acordo com Projeto Arquitetônico – LTA deferido?', tipo: 'BOOLEAN', ordem: 1, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B4_P02', enunciado: 'Item 2 — Acesso independente para ambulância (quando serviço autônomo)?', tipo: 'BOOLEAN', ordem: 2, obrigatoria: false },
    { codigo: 'B4_P03', enunciado: 'Item 3 — Área coberta para desembarque e remoção de pacientes transportados?', tipo: 'BOOLEAN', ordem: 3 },
    { codigo: 'B4_P04', enunciado: 'Item 4.1 — Consultório médico (in loco ou não)?', tipo: 'BOOLEAN', ordem: 4 },
    { codigo: 'B4_P05', enunciado: 'Item 4.2 — Área de prescrição médica?', tipo: 'BOOLEAN', ordem: 5 },
    { codigo: 'B4_P06', enunciado: 'Item 4.3 — Sala de recuperação de pacientes?', tipo: 'BOOLEAN', ordem: 6, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B4_P07', enunciado: 'Item 4.4 — Área para lavagem de fístula (1 lavabo com 1,10 m² a cada 25 poltronas; cuba 50×100×50 cm)?', tipo: 'BOOLEAN', ordem: 7, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B4_P08', enunciado: 'Item 4.5 — Sala de hemodiálise para HBsAg Negativo?', tipo: 'BOOLEAN', ordem: 8, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B4_P09', enunciado: 'Item 4.6 — Posto de enfermagem e serviços (1 posto com 6,0 m² a cada 25 poltronas)?', tipo: 'BOOLEAN', ordem: 9 },
    { codigo: 'B4_P10', enunciado: 'Item 4.7 — Sala para reprocessamento (reuso) HBsAg Negativo?', tipo: 'BOOLEAN', ordem: 10, obrigatoria: false, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B4_P11', enunciado: 'Item 4.8 — Sala para tratamento e reservatório de água tratada para diálise (STDAH)?', tipo: 'BOOLEAN', ordem: 11, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B4_P12', enunciado: 'Item 5 — Salas e ambientes, acessos (inclusive PCD), corredores, iluminação, circulação, ventilação e fluxo de acordo com legislação vigente?', tipo: 'BOOLEAN', ordem: 12 },
    { codigo: 'B4_P13', enunciado: 'Item 6 — Salas para hemodiálise compatíveis com o nº de pacientes, com espaço para circulação conforme legislação?', tipo: 'BOOLEAN', ordem: 13 },
    { codigo: 'B4_P14', enunciado: 'Item 7 — Sistema de energia emergencial (gerador com manutenção preventiva registrada)?', tipo: 'BOOLEAN', ordem: 14, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B4_P15', enunciado: 'Item 8 — Sala de hemodiálise para HBsAg Positivo (ou contrato com serviço de referência)?', tipo: 'BOOLEAN', ordem: 15, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B4_P16', enunciado: 'Item 9 — Sala de DPAC (se aplicável) ou contrato com serviço de referência?', tipo: 'BOOLEAN', ordem: 16, obrigatoria: false },
    { codigo: 'B4_P17', enunciado: 'Observações sobre a estrutura físico-funcional', tipo: 'TEXTO', ordem: 17, obrigatoria: false },
  ]
  for (const p of perguntasB4) await upsertPergunta(b4.id, p)
  console.log(`✅ B4: ${perguntasB4.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B5 — TERCEIRIZAÇÃO
  // ══════════════════════════════════════════════════════════════════════
  const b5 = await upsertBloco({
    tipo: 'TERCEIRIZACAO', codigo: 'B5',
    titulo: 'Terceirização', ordem: 5, obrigatorio: true,
  })
  const perguntasB5 = [
    { codigo: 'B5_P01', enunciado: 'Item 1 — Hospital de retaguarda com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 1 },
    { codigo: 'B5_P02', enunciado: 'Item 2 — Serviço de remoção com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 2 },
    { codigo: 'B5_P03', enunciado: 'Item 3 — Confecção de Fístula Arterio-Venosa (própria ou terceirizada)?', tipo: 'BOOLEAN', ordem: 3, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B5_P04', enunciado: 'Item 4 — Serviço de diagnóstico (análises clínicas) com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 4 },
    { codigo: 'B5_P05', enunciado: 'Item 5 — Serviço de diagnóstico por imagem com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 5 },
    { codigo: 'B5_P06', enunciado: 'Item 6 — Laboratório para análise da água com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 6, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B5_P07', enunciado: 'Item 7 — Processamento de roupas com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 7 },
    { codigo: 'B5_P08', enunciado: 'Item 8 — Central de Esterilização com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 8 },
    { codigo: 'B5_P09', enunciado: 'Item 9 — Manutenção de equipamentos e infraestrutura predial (própria ou terceirizada)?', tipo: 'BOOLEAN', ordem: 9, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B5_P10', enunciado: 'Item 10 — Manutenção do STDAH (própria ou terceirizada)?', tipo: 'BOOLEAN', ordem: 10, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B5_P11', enunciado: 'Item 11 — Resíduos de saúde com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 11 },
    { codigo: 'B5_P12', enunciado: 'Item 12 — Laboratório de Histocompatibilidade com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 12, obrigatoria: false },
    { codigo: 'B5_P13', enunciado: 'Item 13 — Serviço Hemoterápico com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 13 },
    { codigo: 'B5_P14', enunciado: 'Item 14 — Serviço de Limpeza (próprio ou terceirizado)?', tipo: 'BOOLEAN', ordem: 14, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B5_P15', enunciado: 'Item 15 — Serviço de Alimentação com Licença de Funcionamento?', tipo: 'BOOLEAN', ordem: 15, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B5_P16', enunciado: 'Item 16 — Outros serviços terceirizados (descrever quais)', tipo: 'TEXTO', ordem: 16, obrigatoria: false },
    { codigo: 'B5_P17', enunciado: 'Observações sobre terceirização', tipo: 'TEXTO', ordem: 17, obrigatoria: false },
  ]
  for (const p of perguntasB5) await upsertPergunta(b5.id, p)
  console.log(`✅ B5: ${perguntasB5.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B6 — REGISTROS
  // ══════════════════════════════════════════════════════════════════════
  const b6 = await upsertBloco({
    tipo: 'REGISTROS', codigo: 'B6',
    titulo: 'Registros', ordem: 6, obrigatorio: true,
  })
  const perguntasB6 = [
    { codigo: 'B6_P01', enunciado: 'Item 1 — Possui contrato(s) formal(is) das atividades terceirizadas?', tipo: 'BOOLEAN', ordem: 1 },
    { codigo: 'B6_P02', enunciado: 'Item 2 — Prontuários possuem: identificação do paciente, história clínica, exame físico, motivo do ingresso, resultado de exames, diagnóstico, plano terapêutico e consultas da equipe multiprofissional?', tipo: 'BOOLEAN', ordem: 2, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B6_P03', enunciado: 'Item 3 — Prontuários atualizados: consultas mensais do nefrologista, internações, intercorrências, carimbados, assinados e datados?', tipo: 'BOOLEAN', ordem: 3, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B6_P04', enunciado: 'Item 4 — Prontuários com exames mensais atualizados: hematócrito, hemoglobina, ureia pré e pós sessão, sódio, potássio, cálcio, fósforo, TGP, glicemia (diabéticos) e creatinina (1º ano)?', tipo: 'BOOLEAN', ordem: 4, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B6_P05', enunciado: 'Item 5 — Prontuários com exames trimestrais: hemograma completo, saturação da transferrina, ferritina, PTH, proteínas totais e frações, hemoglobina glicolisada (diabéticos) e fosfatase alcalina?', tipo: 'BOOLEAN', ordem: 5, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B6_P06', enunciado: 'Item 6 — Prontuários com exames semestrais: Vitamina D, anti HBs e (para susceptíveis) HBsAg e ANTI HCV?', tipo: 'BOOLEAN', ordem: 6, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B6_P07', enunciado: 'Item 7 — Prontuários com exames anuais: colesterol total e fracionado, triglicérides, alumínio sérico, glicemia, TSH, T4, anticorpos HIV, RX tórax PA e perfil, USG renal, ECG?', tipo: 'BOOLEAN', ordem: 7, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B6_P08', enunciado: 'Item 8 — Possui PCPIEA contemplando vigilância epidemiológica sistematizada, investigação de eventos adversos graves e avaliação de rotinas de controle de doenças infecciosas?', tipo: 'BOOLEAN', ordem: 8, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B6_P09', enunciado: 'Item 9 — MPOP atualizado, datado e assinado pelo RT médico, enfermeiro, assistente social, psicólogo e nutricionista, contemplando todos os itens exigidos?', tipo: 'BOOLEAN', ordem: 9, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B6_P10', enunciado: 'Item 10 — Registro (no dia do 1º uso) da utilização de novo conjunto de dialisador e linha arterial e venosa, assinado pelo paciente e arquivado?', tipo: 'BOOLEAN', ordem: 10, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B6_P11', enunciado: 'Item 11 — Apresenta ao paciente, em até 90 dias após início do tratamento, a opção de inscrição na CNCDO?', tipo: 'BOOLEAN', ordem: 11, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B6_P12', enunciado: 'Item 12 — Disponibiliza informações de monitoramento de indicadores durante inspeção sanitária ou investigação de surtos e eventos adversos?', tipo: 'BOOLEAN', ordem: 12, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B6_P13', enunciado: 'Observações sobre registros', tipo: 'TEXTO', ordem: 13, obrigatoria: false },
  ]
  for (const p of perguntasB6) await upsertPergunta(b6.id, p)
  console.log(`✅ B6: ${perguntasB6.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B7 — EQUIPAMENTOS E DISPOSITIVOS
  // ══════════════════════════════════════════════════════════════════════
  const b7 = await upsertBloco({
    tipo: 'EQUIPAMENTOS', codigo: 'B7',
    titulo: 'Equipamentos e Dispositivos', ordem: 7, obrigatorio: true,
  })
  const perguntasB7 = [
    { codigo: 'B7_P01', enunciado: 'Item 1 — Realiza e registra intervenções nos equipamentos (instalação, manutenção, troca de componentes e calibração)?', tipo: 'BOOLEAN', ordem: 1, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P02', enunciado: 'Item 2 — Realiza e registra manutenção preventiva dos equipamentos conforme recomendado pelo fabricante?', tipo: 'BOOLEAN', ordem: 2, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P03', enunciado: 'Item 3 — Realiza e registra manutenção preventiva do sistema de climatização e exaustão conforme recomendado pelo fabricante?', tipo: 'BOOLEAN', ordem: 3 },
    { codigo: 'B7_P04', enunciado: 'Item 4.1 — Máquinas de HD possuem dispositivo que permita tamponamento por bicarbonato de sódio?', tipo: 'BOOLEAN', ordem: 4, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P05', enunciado: 'Item 4.2 — Máquinas possuem controlador e monitor de temperatura?', tipo: 'BOOLEAN', ordem: 5, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P06', enunciado: 'Item 4.3 — Máquinas possuem controle automático de ultrafiltração e monitor de pressão transmembrana com alarmes sonoros e visuais?', tipo: 'BOOLEAN', ordem: 6, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P07', enunciado: 'Item 4.4 — Máquinas possuem monitor contínuo de condutividade com alarmes sonoros e visuais?', tipo: 'BOOLEAN', ordem: 7, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P08', enunciado: 'Item 4.5 — Máquinas possuem detector de ruptura do dialisador com alarmes sonoros e visuais?', tipo: 'BOOLEAN', ordem: 8, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P09', enunciado: 'Item 4.6 — Máquinas possuem detector de bolhas e proteção contra embolismo gasoso com alarmes sonoros e visuais?', tipo: 'BOOLEAN', ordem: 9, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P10', enunciado: 'Item 4.7 — Máquinas possuem proteção contra operação em modo de diálise quando em modo de desinfecção?', tipo: 'BOOLEAN', ordem: 10, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P11', enunciado: 'Item 4.8 — Máquinas possuem monitor de pressão de linha venosa e arterial com alarmes sonoros e visuais?', tipo: 'BOOLEAN', ordem: 11, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P12', enunciado: 'Item 4.9 — Equipamentos em uso são limpos e desinfetados após cada sessão de hemodiálise?', tipo: 'BOOLEAN', ordem: 12, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P13', enunciado: 'Item 5 — Para atendimento de emergência, possui em condições de funcionamento: eletrocardiógrafo, carro de emergência (monitor + desfibrilador), ambu com reservatório, medicamentos de emergência, ponto de oxigênio, aspirador portátil e material completo de intubação?', tipo: 'BOOLEAN', ordem: 13, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P14', enunciado: 'Item 6 — Balança para pesagem de pacientes e aparelho de pressão arterial (1 para cada 4 pacientes por turno)?', tipo: 'BOOLEAN', ordem: 14, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P15', enunciado: 'Item 7 — Pacientes recém-admitidos com sorologia desconhecida são dialisados em máquina específica e seus dialisadores reprocessados na própria máquina?', tipo: 'BOOLEAN', ordem: 15, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P16', enunciado: 'Item 8 — Dialisadores e linhas utilizadas no tratamento dialítico possuem registro na ANVISA/MS?', tipo: 'BOOLEAN', ordem: 16, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B7_P17', enunciado: 'Item 9 — Equipamentos de combate a incêndio dentro do prazo de validade?', tipo: 'BOOLEAN', ordem: 17 },
    { codigo: 'B7_P18', enunciado: 'Item 10 — Possui Auto de Vistoria do Corpo de Bombeiros?', tipo: 'BOOLEAN', ordem: 18 },
    { codigo: 'B7_P19', enunciado: 'Observações sobre equipamentos', tipo: 'TEXTO', ordem: 19, obrigatoria: false },
  ]
  for (const p of perguntasB7) await upsertPergunta(b7.id, p)
  console.log(`✅ B7: ${perguntasB7.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B8 — PROCEDIMENTOS TÉCNICOS E OPERACIONAIS
  // ══════════════════════════════════════════════════════════════════════
  const b8 = await upsertBloco({
    tipo: 'PROCEDIMENTOS_TECNICOS', codigo: 'B8',
    titulo: 'Procedimentos Técnicos e Operacionais', ordem: 8, obrigatorio: true,
  })
  const perguntasB8 = [
    { codigo: 'B8_P01', enunciado: 'Item 1 — Dialisadores e linhas utilizadas até 20 vezes quando usado reprocessamento automático (conforme MPOP)?', tipo: 'BOOLEAN', ordem: 1, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B8_P02', enunciado: 'Item 2 — Realiza medida do volume interno das fibras (priming) em todos os dialisadores antes do 1º uso e após cada reuso, descartando quando redução superior a 20%?', tipo: 'BOOLEAN', ordem: 2, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B8_P03', enunciado: 'Item 3 — Dialisadores e linhas reutilizáveis acondicionados em recipiente limpo, desinfetado, identificado com nome do paciente, data, grupo de sorologia, em áreas específicas?', tipo: 'BOOLEAN', ordem: 3, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B8_P04', enunciado: 'Item 4 — Dialisadores e linhas desinfetados com preenchimento total com solução; recipiente identificado com produto, diluição, data, validade e responsável?', tipo: 'BOOLEAN', ordem: 4, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B8_P05', enunciado: 'Item 5 — Registra e monitora níveis residuais do agente químico após enxágue dos dialisadores e linhas, antes da conexão ao paciente?', tipo: 'BOOLEAN', ordem: 5, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B8_P06', enunciado: 'Item 6 — Análise microbiológica mensal de amostra do dialisato colhida da máquina imediatamente antes do dialisador, no final da sessão (máx. 200 UFC/mL), cobrindo todas as máquinas anualmente?', tipo: 'BOOLEAN', ordem: 6, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B8_P07', enunciado: 'Item 7 — Realiza procedimentos de limpeza e desinfecção do sistema quando verificada não conformidade nos padrões da água (análise microbiológica ≥ 50 UFC/mL)?', tipo: 'BOOLEAN', ordem: 7, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B8_P08', enunciado: 'Item 8 — Fornece alimentação ao paciente no dia do procedimento dialítico, de acordo com orientação do nutricionista e médico?', tipo: 'BOOLEAN', ordem: 8, legislacao_referencia: 'PT_389_2014' },
    { codigo: 'B8_P09', enunciado: 'Observações sobre procedimentos técnicos', tipo: 'TEXTO', ordem: 9, obrigatoria: false },
  ]
  for (const p of perguntasB8) await upsertPergunta(b8.id, p)
  console.log(`✅ B8: ${perguntasB8.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B9 — BIOSSEGURANÇA E SEGURANÇA DO PACIENTE
  // ══════════════════════════════════════════════════════════════════════
  const b9 = await upsertBloco({
    tipo: 'BIOSSEGURANCA', codigo: 'B9',
    titulo: 'Biossegurança e Segurança do Paciente', ordem: 9, obrigatorio: true,
  })
  const perguntasB9 = [
    { codigo: 'B9_P01', enunciado: 'Item 1 — MPOP contempla medidas de biossegurança e são realizadas conforme descrito?', tipo: 'BOOLEAN', ordem: 1, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B9_P02', enunciado: 'Item 2 — Registro de treinamento periódico de toda a equipe em biossegurança e manuseio de resíduos de saúde (inclusive equipe terceirizada)?', tipo: 'BOOLEAN', ordem: 2 },
    { codigo: 'B9_P03', enunciado: 'Item 3 — Procedimentos de limpeza, desinfecção e esterilização de superfícies, instalações e equipamentos conforme normas vigentes; saneantes regularizados na ANVISA?', tipo: 'BOOLEAN', ordem: 3, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B9_P04', enunciado: 'Item 4 — EPI em número suficiente, em boas condições e utilizados por todos os funcionários conforme protocolos assistenciais?', tipo: 'BOOLEAN', ordem: 4, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B9_P05', enunciado: 'Item 5 — Funcionários vacinados contra Hepatite B conforme Programa Nacional de Imunização?', tipo: 'BOOLEAN', ordem: 5, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B9_P06', enunciado: 'Item 6 — Pacientes não portadores de Hepatite B com imunidade negativa vacinados precocemente conforme PNI/MS?', tipo: 'BOOLEAN', ordem: 6, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B9_P07', enunciado: 'Item 7 — Obtém resultados sorológicos de paciente recém-admitido no programa de diálise?', tipo: 'BOOLEAN', ordem: 7, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B9_P08', enunciado: 'Observações sobre biossegurança', tipo: 'TEXTO', ordem: 8, obrigatoria: false },
  ]
  for (const p of perguntasB9) await upsertPergunta(b9.id, p)
  console.log(`✅ B9: ${perguntasB9.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B10 — QUALIDADE DA ÁGUA
  // ══════════════════════════════════════════════════════════════════════
  const b10 = await upsertBloco({
    tipo: 'QUALIDADE_AGUA', codigo: 'B10',
    titulo: 'Qualidade da Água', ordem: 10, obrigatorio: true,
  })
  const perguntasB10 = [
    { codigo: 'B10_P01', enunciado: 'Item 1 — Subsistema de abastecimento de água potável identificado com: pontos de coleta, pontos de derivação, reservatórios, derivações e válvulas de alívio de pressão?', tipo: 'BOOLEAN', ordem: 1, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P02', enunciado: 'Item 2 — Laudos que atestam padrão de potabilidade da água de abastecimento conforme legislação vigente?', tipo: 'BOOLEAN', ordem: 2, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P03', enunciado: 'Item 3 — Analisa e registra diariamente características físicas e organolépticas da água (cor, sabor, odor, turbidez, pH 6,5-8,5 e cloro residual livre)?', tipo: 'BOOLEAN', ordem: 3, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P04', enunciado: 'Item 4 — Registro do controle bacteriológico do reservatório de água potável mensalmente?', tipo: 'BOOLEAN', ordem: 4, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P05', enunciado: 'Item 5 — Registro da limpeza do reservatório de água potável semestralmente?', tipo: 'BOOLEAN', ordem: 5, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P06', enunciado: 'Item 6 — Reservatório de água potável exclusivo, com autonomia de 2 dias, mínimo 200 litros/paciente/dia, protegido contra vetores e intempéries?', tipo: 'BOOLEAN', ordem: 6, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P07', enunciado: 'Item 7 — Subsistema de tratamento de água (STAH) identificado com: pontos de coleta após cada componente, tipo de operação, osmose reversa, destino da água de rejeito e reservatório?', tipo: 'BOOLEAN', ordem: 7, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P08', enunciado: 'Item 8 — Subsistema de distribuição de água identificado com: alça de distribuição, ambientes servidos, postos de utilização e pontos de coleta para análise laboratorial?', tipo: 'BOOLEAN', ordem: 8, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P09', enunciado: 'Item 9 — Desinfecção do reservatório, sistema de tratamento e distribuição realizada por pessoa capacitada, conforme plano de gerenciamento de tecnologia em saúde?', tipo: 'BOOLEAN', ordem: 9, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P10', enunciado: 'Item 10 — Registro da limpeza e desinfecção do reservatório e rede de distribuição de água tratada para diálise mensalmente?', tipo: 'BOOLEAN', ordem: 10, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P11', enunciado: 'Item 11 — Amostras para análise físico-química colhidas após o STAH; amostras microbiológicas colhidas no ponto de retorno da alça (Loop) e em ponto da sala de reprocessamento?', tipo: 'BOOLEAN', ordem: 11, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P12', enunciado: 'Item 12 — Reservatório de água tratada construído com material opaco, liso, resistente, impermeável, inerte, sem amianto, com fechamento hermético, filtro bacteriológico, fundo cônico e recirculação contínua 24h/7d?', tipo: 'BOOLEAN', ordem: 12, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P13', enunciado: 'Item 13 — Reservatórios de água tratada mantidos ao abrigo da luz solar direta e com acesso para inspeção e limpeza?', tipo: 'BOOLEAN', ordem: 13, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P14', enunciado: 'Item 14 — Condutivímetro com alarme visual e auditivo na saída do STDAH, apresentando condutividade ≤ 10 microsiemens/cm a 25°C?', tipo: 'BOOLEAN', ordem: 14, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P15', enunciado: 'Item 15 — Equipamentos para tratamento da água: filtro de areia, resina catiônica e aniônica, filtro de carvão e osmose reversa?', tipo: 'BOOLEAN', ordem: 15, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P16', enunciado: 'Item 16 — Realiza e registra manutenção do STDAH: regeneração de resinas, retrolavagem/troca do filtro de carvão, limpeza do filtro de areia, troca da membrana de osmose reversa?', tipo: 'BOOLEAN', ordem: 16, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P17', enunciado: 'Item 17 — Sistema de tratamento de água especificado e dimensionado para o nº de pacientes inscritos no programa?', tipo: 'BOOLEAN', ordem: 17, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P18', enunciado: 'Item 18 — Validação dos parâmetros microbiológicos mensalmente (Coliformes totais, bactérias heterotróficas e endotoxinas) — verificar laudos das 3 últimas coletas?', tipo: 'BOOLEAN', ordem: 18, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P19', enunciado: 'Item 19 — Validação dos parâmetros físico-químicos semestralmente (nitrato, alumínio, cloro total, cobre, fluoreto, cálcio, magnésio, potássio, bário, zinco, sulfato e demais metais pesados) — verificar laudos das 2 últimas coletas?', tipo: 'BOOLEAN', ordem: 19, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B10_P20', enunciado: 'Observações sobre qualidade da água', tipo: 'TEXTO', ordem: 20, obrigatoria: false },
  ]
  for (const p of perguntasB10) await upsertPergunta(b10.id, p)
  console.log(`✅ B10: ${perguntasB10.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B11 — DEPÓSITO DE MATERIAIS E INSUMOS + RESÍDUOS
  // ══════════════════════════════════════════════════════════════════════
  const b11 = await upsertBloco({
    tipo: 'DEPOSITO_RESIDUOS', codigo: 'B11',
    titulo: 'Depósito de Materiais, Insumos e Resíduos de Saúde', ordem: 11, obrigatorio: true,
  })
  const perguntasB11 = [
    // Depósito de Materiais e Insumos
    { codigo: 'B11_P01', enunciado: 'Depósito — Item 1: Área(s) específica(s) destinada(s) ao armazenamento de produtos e insumos?', tipo: 'BOOLEAN', ordem: 1 },
    { codigo: 'B11_P02', enunciado: 'Depósito — Item 2: Área em bom estado de conservação, higiene e ventilação?', tipo: 'BOOLEAN', ordem: 2 },
    { codigo: 'B11_P03', enunciado: 'Depósito — Item 3: Armazenamento em condições adequadas de temperatura, umidade e iluminação conforme instruções do fabricante?', tipo: 'BOOLEAN', ordem: 3 },
    { codigo: 'B11_P04', enunciado: 'Depósito — Item 4: MPOP atualizado e disponível no depósito?', tipo: 'BOOLEAN', ordem: 4, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B11_P05', enunciado: 'Depósito — Item 5: Procedimentos executados conforme MPOP?', tipo: 'BOOLEAN', ordem: 5 },
    { codigo: 'B11_P06', enunciado: 'Depósito — Item 6: Mecanismos de prevenção e combate a insetos e roedores devidamente registrados?', tipo: 'BOOLEAN', ordem: 6 },
    { codigo: 'B11_P07', enunciado: 'Depósito — Item 7: Controle de entrada e saída de materiais conforme legislação (prazo de validade, conservação) devidamente registrado?', tipo: 'BOOLEAN', ordem: 7 },
    { codigo: 'B11_P08', enunciado: 'Depósito — Item 8: Produtos armazenados sem contato com o piso e com distância mínima da parede que permita manejo, circulação e limpeza?', tipo: 'BOOLEAN', ordem: 8 },
    { codigo: 'B11_P09', enunciado: 'Depósito — Item 9: Concentrados químicos utilizados para diálise possuem registro na ANVISA/MS?', tipo: 'BOOLEAN', ordem: 9, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B11_P10', enunciado: 'Depósito — Observações', tipo: 'TEXTO', ordem: 10, obrigatoria: false },
    // Resíduos de Serviço de Saúde
    { codigo: 'B11_P11', enunciado: 'Resíduos — Item 1: Executa o Plano de Gerenciamento de Resíduos de Serviços de Saúde (PGRSS) conforme legislação vigente?', tipo: 'BOOLEAN', ordem: 11 },
    { codigo: 'B11_P12', enunciado: 'Resíduos — Item 2: Segrega adequadamente resíduos infectantes dos resíduos comuns em sacos plásticos próprios?', tipo: 'BOOLEAN', ordem: 12 },
    { codigo: 'B11_P13', enunciado: 'Resíduos — Item 3: Perfurocortantes acondicionados em recipientes com paredes rígidas, identificados com símbolo de infectante e respeitando linha máxima?', tipo: 'BOOLEAN', ordem: 13 },
    { codigo: 'B11_P14', enunciado: 'Resíduos — Item 4: Transporte, tratamento e destinação final dos resíduos realizados por empresa contratada regularizada junto aos órgãos competentes?', tipo: 'BOOLEAN', ordem: 14 },
    { codigo: 'B11_P15', enunciado: 'Resíduos — Observações', tipo: 'TEXTO', ordem: 15, obrigatoria: false },
  ]
  for (const p of perguntasB11) await upsertPergunta(b11.id, p)
  console.log(`✅ B11: ${perguntasB11.length} perguntas`)

  // ══════════════════════════════════════════════════════════════════════
  // B12 — SEGURANÇA E QUALIDADE
  // ══════════════════════════════════════════════════════════════════════
  const b12 = await upsertBloco({
    tipo: 'SEGURANCA_QUALIDADE', codigo: 'B12',
    titulo: 'Segurança do Paciente e Qualidade', ordem: 12, obrigatorio: true,
  })
  const perguntasB12 = [
    { codigo: 'B12_P01', enunciado: 'Art. 6 — Todos os membros da equipe de saúde responsáveis pelo atendimento ao paciente permanecem no ambiente de diálise durante toda a sessão?', tipo: 'BOOLEAN', ordem: 1, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B12_P02', enunciado: 'Art. 8 — Possui Núcleo de Segurança do Paciente (NSP) constituído, com Plano de Segurança do Paciente elaborado e implantado conforme normativa vigente?', tipo: 'BOOLEAN', ordem: 2, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B12_P03', enunciado: 'Art. 9 — Possui mecanismos de avaliação da qualidade e monitoramento dos processos por meio de indicadores ou outras ferramentas, com informações disponíveis para as autoridades sanitárias?', tipo: 'BOOLEAN', ordem: 3, legislacao_referencia: 'RDC_11_2014' },
    { codigo: 'B12_P04', enunciado: 'Observações sobre segurança e qualidade', tipo: 'TEXTO', ordem: 4, obrigatoria: false },
  ]
  for (const p of perguntasB12) await upsertPergunta(b12.id, p)
  console.log(`✅ B12: ${perguntasB12.length} perguntas`)

  // ── Totais ────────────────────────────────────────────────────────────
  const total = [
    perguntasB0, perguntasB1, perguntasB2, perguntasB3, perguntasB4,
    perguntasB5, perguntasB6, perguntasB7, perguntasB8, perguntasB9,
    perguntasB10, perguntasB11, perguntasB12,
  ].reduce((s, arr) => s + arr.length, 0)

  console.log('')
  console.log('🎉 Seed concluído!')
  console.log(`📊 Total de perguntas: ${total}`)
  console.log('   B0  Identificação              → 9 perguntas')
  console.log('   B1  Espaço Físico               → 38 perguntas')
  console.log('   B2  Cap. Operacional (Q I-III)  → 74 perguntas')
  console.log('   B3  Recursos Humanos            → 37 perguntas')
  console.log('   B4  Estrutura Físico-Funcional  → 17 perguntas')
  console.log('   B5  Terceirização               → 17 perguntas')
  console.log('   B6  Registros                   → 13 perguntas')
  console.log('   B7  Equipamentos                → 19 perguntas')
  console.log('   B8  Procedimentos Técnicos      → 9 perguntas')
  console.log('   B9  Biossegurança               → 8 perguntas')
  console.log('   B10 Qualidade da Água           → 20 perguntas')
  console.log('   B11 Depósito e Resíduos         → 15 perguntas')
  console.log('   B12 Segurança e Qualidade       → 4 perguntas')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
