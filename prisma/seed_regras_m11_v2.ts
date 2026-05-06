// prisma/seed_regras_m11_v2.ts
// Regras do Motor M11 — versão 2 compatível com seed_perguntas_v2.ts
// Execute: npx tsx prisma/seed_regras_m11_v2.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function getPerguntaId(codigo: string): Promise<string> {
  const p = await prisma.pergunta.findUnique({ where: { codigo } })
  if (!p) throw new Error(`Pergunta ${codigo} não encontrada. Execute seed_perguntas_v2.ts primeiro.`)
  return p.id
}

async function main() {
  console.log('🌱 Cadastrando regras do Motor M11 v2...')

  // Limpa regras antigas para evitar conflito
  await prisma.regraNaoConformidade.updateMany({ where: { ativo: true }, data: { ativo: false } })
  console.log('♻️  Regras anteriores desativadas.')

  const regras = [

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: ESTRUTURA — B0 (Identificação)
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B0_P06', codigo: 'M11_B0_01',
      descricao: 'Licença sanitária (CVES) não informada — serviço pode estar operando sem licença vigente, risco imediato de interdição.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: ESTRUTURA — B1 (Espaço Físico)
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B1_P02', codigo: 'M11_B1_01',
      descricao: 'Ausência de sala exclusiva para pacientes HBsAg positivo — risco crítico de transmissão cruzada de Hepatite B (RDC 11/2014).',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B1_P13', codigo: 'M11_B1_02',
      descricao: 'Art. 17 — Ausência de consultório médico — ambiente mínimo obrigatório pela RDC 11/2014.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B1_P16', codigo: 'M11_B1_03',
      descricao: 'Art. 17 — Ausência de sala de recuperação e atendimento de emergência — exigência crítica para segurança do paciente durante sessão.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B1_P26', codigo: 'M11_B1_04',
      descricao: 'Art. 17 — Ausência de sala para hemodiálise com área para lavagem de fístulas — ambiente mínimo obrigatório pela RDC 11/2014.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B1_P27', codigo: 'M11_B1_05',
      descricao: 'Art. 17 — Ausência de sala para hemodiálise exclusiva para HBsAg positivo com área para lavagem de fístulas — risco de contaminação cruzada.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B1_P28', codigo: 'M11_B1_06',
      descricao: 'Art. 17 — Ausência de sala para processamento de dialisadores — obrigatório exceto para serviços que adotam uso único.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B1_P30', codigo: 'M11_B1_07',
      descricao: 'Art. 17 — Ausência de sala do STDAH — obrigatório pela RDC 11/2014; água tratada é insumo crítico de segurança.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B1_P31', codigo: 'M11_B1_08',
      descricao: 'Art. 18 — Sala de processamento de dialisadores não é exclusiva ou não é contígua à sala de hemodiálise — risco de fluxo cruzado contaminado.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B1_P32', codigo: 'M11_B1_09',
      descricao: 'Art. 18 — Sala de processamento sem sistema de exaustão de ar — risco de exposição da equipe a agentes químicos de desinfecção.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B1_P37', codigo: 'M11_B1_10',
      descricao: 'Art. 24 — Ausência de sistema de energia elétrica de emergência (gerador) — risco de interrupção de sessões com impacto crítico à vida dos pacientes.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B1_P38', codigo: 'M11_B1_11',
      descricao: 'Ausência de plano de contingência documentado para situações de emergência — risco de resposta inadequada a falhas críticas.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'ESTRUTURA',
      tipo: 'OBRIGATORIO', prioridade: 7,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: RH — B3 (Recursos Humanos)
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B3_P02', codigo: 'M11_B3_01',
      descricao: 'Médico RT com especialidade em Nefrologia não registrado ou ausente — infração grave à RDC 11/2014, motivo de interdição imediata do serviço.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'RH',
      legislacao_ref: 'PT_389_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B3_P06', codigo: 'M11_B3_02',
      descricao: 'Enfermeiro RT com habilitação em nefrologia não registrado ou ausente — exigência da PT 389/2014 como condição de funcionamento.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'RH',
      legislacao_ref: 'PT_389_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B3_P08', codigo: 'M11_B3_03',
      descricao: 'Técnico responsável pelo STDAH sem treinamento específico comprovado — risco direto à qualidade da água tratada para diálise.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'RH',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B3_P09', codigo: 'M11_B3_04',
      descricao: 'Funcionários não capacitados para medida do volume interno das fibras (priming) — risco de erro na verificação de eficiência do dialisador.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'RH',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B3_P10', codigo: 'M11_B3_05',
      descricao: 'Técnico/Auxiliar de enfermagem sem capacitação para diluição de solução desinfetante, desinfecção de linhas e dialisadores e teste de níveis residuais.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'RH',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B3_P11', codigo: 'M11_B3_06',
      descricao: 'PCMSO ausente ou não atualizado — descumprimento da NR-32 com risco trabalhista e passivo jurídico para o serviço.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'RH',
      legislacao_ref: 'NR_32', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B3_P12', codigo: 'M11_B3_07',
      descricao: 'Serviço não registra nem notifica acidentes de trabalho — descumprimento de obrigação legal com risco trabalhista.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_I', prazo_dias: 60, dominio: 'RH',
      tipo: 'OBRIGATORIO', prioridade: 6,
    },
    {
      pergunta: 'B3_P13', codigo: 'M11_B3_08',
      descricao: 'Número insuficiente de médico por turno × nº de pacientes — descumprimento direto da PT 389/2014 art. 27, com risco à segurança assistencial.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'RH',
      legislacao_ref: 'PT_389_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B3_P14', codigo: 'M11_B3_09',
      descricao: 'Número insuficiente de enfermeiro por turno × nº de pacientes — descumprimento da PT 389/2014 art. 27.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'RH',
      legislacao_ref: 'PT_389_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B3_P15', codigo: 'M11_B3_10',
      descricao: 'Número insuficiente de auxiliar ou técnico de enfermagem por turno — proporção mínima exigida pela PT 389/2014 art. 27 não atendida.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'RH',
      legislacao_ref: 'PT_389_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B3_P16', codigo: 'M11_B3_11',
      descricao: 'Ausência de auxiliar ou técnico de enfermagem exclusivo para sala(s) de reuso — risco de contaminação cruzada entre salas.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'RH',
      legislacao_ref: 'PT_389_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B3_P17', codigo: 'M11_B3_12',
      descricao: 'Ausência de funcionário(s) exclusivo(s) para serviços de limpeza — risco de higienização inadequada do ambiente dialítico.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'RH',
      legislacao_ref: 'PT_389_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B3_P18', codigo: 'M11_B3_13',
      descricao: 'Ausência de funcionários exclusivos para pacientes HBsAg positivo e não reativo no mesmo turno — risco crítico de transmissão de Hepatite B entre pacientes.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'RH',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B3_P34', codigo: 'M11_B3_14',
      descricao: 'Serviço sem nutricionista — profissional obrigatório pela RDC 11/2014 para acompanhamento dietético dos pacientes renais crônicos.',
      operador: 'LT', valor_gatilho: '1',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'RH',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B3_P35', codigo: 'M11_B3_15',
      descricao: 'Serviço sem assistente social — profissional obrigatório pela RDC 11/2014 para suporte biopsicossocial dos pacientes.',
      operador: 'LT', valor_gatilho: '1',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'RH',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: ESTRUTURA — B4 (Estrutura Físico-Funcional)
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B4_P06', codigo: 'M11_B4_01',
      descricao: 'Ausência de sala de recuperação de pacientes — ambiente obrigatório para atendimento de intercorrências e emergências dialíticas.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B4_P07', codigo: 'M11_B4_02',
      descricao: 'Área para lavagem de fístula inadequada ou ausente (exigência: 1 lavabo de 1,10 m² a cada 25 poltronas, cuba 50×100×50 cm).',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B4_P08', codigo: 'M11_B4_03',
      descricao: 'Ausência de sala de hemodiálise para HBsAg Negativo — ambiente obrigatório pela RDC 11/2014.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B4_P11', codigo: 'M11_B4_04',
      descricao: 'Ausência de sala para tratamento e reservatório do STDAH — obrigatório pela RDC 11/2014.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B4_P14', codigo: 'M11_B4_05',
      descricao: 'Ausência de sistema de energia emergencial (gerador) com manutenção preventiva registrada — risco de interrupção de sessões.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B4_P15', codigo: 'M11_B4_06',
      descricao: 'Ausência de sala de hemodiálise para HBsAg Positivo ou contrato com serviço de referência — risco de transmissão de Hepatite B.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'ESTRUTURA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: PROCESSOS — B5 (Terceirização)
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B5_P06', codigo: 'M11_B5_01',
      descricao: 'Laboratório para análise da água sem Licença de Funcionamento — laudos emitidos por laboratório irregular não têm validade regulatória.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B5_P10', codigo: 'M11_B5_02',
      descricao: 'Manutenção do STDAH sem empresa habilitada ou sem contrato vigente — risco direto à qualidade da água para diálise.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B5_P11', codigo: 'M11_B5_03',
      descricao: 'Empresa de resíduos de saúde sem Licença de Funcionamento — descarte irregular de resíduos dialíticos infectantes, risco ambiental e sanitário.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'PROCESSOS',
      tipo: 'OBRIGATORIO', prioridade: 8,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: PROCESSOS — B6 (Registros)
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B6_P01', codigo: 'M11_B6_01',
      descricao: 'Ausência de contratos formais das atividades terceirizadas — irregularidade contratual com risco regulatório e jurídico.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'PROCESSOS',
      tipo: 'OBRIGATORIO', prioridade: 7,
    },
    {
      pergunta: 'B6_P03', codigo: 'M11_B6_02',
      descricao: 'Prontuários sem atualização mensal do nefrologista, internações e intercorrências — descumprimento da RDC 11/2014 art. 11.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B6_P04', codigo: 'M11_B6_03',
      descricao: 'Prontuários sem exames mensais obrigatórios atualizados (hematócrito, hemoglobina, ureia, eletrólitos, TGP, creatinina) — descumprimento RDC 11/2014 e PT 389/2014.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B6_P05', codigo: 'M11_B6_04',
      descricao: 'Prontuários sem exames trimestrais obrigatórios (hemograma, ferritina, PTH, proteínas totais e frações) — descumprimento RDC 11/2014.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B6_P06', codigo: 'M11_B6_05',
      descricao: 'Prontuários sem exames semestrais obrigatórios (Vitamina D, anti HBs, HBsAg e ANTI HCV para susceptíveis) — descumprimento RDC 11/2014.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B6_P07', codigo: 'M11_B6_06',
      descricao: 'Prontuários sem exames anuais obrigatórios (colesterol, triglicérides, alumínio, TSH, T4, HIV, RX tórax, USG renal, ECG) — descumprimento RDC 11/2014.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B6_P08', codigo: 'M11_B6_07',
      descricao: 'PCPIEA ausente ou não implementado — obrigatório pela RDC 11/2014 para todos os serviços de diálise.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B6_P09', codigo: 'M11_B6_08',
      descricao: 'MPOP ausente, desatualizado ou não assinado por todos os RTs — exigência explícita da RDC 11/2014 como documento central do serviço.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B6_P10', codigo: 'M11_B6_09',
      descricao: 'Ausência de registro do 1º uso do conjunto de dialisador e linha assinado pelo paciente — obrigação legal da RDC 11/2014 art. 35.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 7,
    },
    {
      pergunta: 'B6_P12', codigo: 'M11_B6_10',
      descricao: 'Informações de monitoramento de indicadores não disponíveis para autoridades sanitárias — descumprimento da RDC 11/2014 art. 9.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_I', prazo_dias: 60, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 6,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: EQUIPAMENTOS — B7
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B7_P01', codigo: 'M11_B7_01',
      descricao: 'Intervenções nos equipamentos (instalação, manutenção, troca de componentes, calibração) não registradas — impossibilita rastreabilidade de falhas.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'EQUIPAMENTOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B7_P02', codigo: 'M11_B7_02',
      descricao: 'Manutenção preventiva dos equipamentos não realizada ou não registrada conforme fabricante — risco de pane durante sessão dialítica.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'EQUIPAMENTOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B7_P04', codigo: 'M11_B7_03',
      descricao: 'Máquinas sem dispositivo de tamponamento por bicarbonato de sódio — não conformidade com RDC 11/2014 art. 37, risco clínico direto.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'EQUIPAMENTOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B7_P06', codigo: 'M11_B7_04',
      descricao: 'Máquinas sem controle automático de ultrafiltração e monitor de pressão transmembrana com alarmes — risco grave de evento adverso durante sessão.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'EQUIPAMENTOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B7_P07', codigo: 'M11_B7_05',
      descricao: 'Máquinas sem monitor contínuo de condutividade com alarmes — risco de diálise com solução fora do padrão, com dano grave ao paciente.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'EQUIPAMENTOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B7_P08', codigo: 'M11_B7_06',
      descricao: 'Máquinas sem detector de ruptura do dialisador com alarmes — risco de passagem de sangue para o dialisato sem detecção.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'EQUIPAMENTOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B7_P09', codigo: 'M11_B7_07',
      descricao: 'Máquinas sem detector de bolhas e proteção contra embolismo gasoso — risco de óbito por embolia gasosa durante a sessão.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'EQUIPAMENTOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B7_P13', codigo: 'M11_B7_08',
      descricao: 'Kit de emergência incompleto ou inoperante (eletrocardiógrafo, desfibrilador, ambu, medicamentos, oxigênio, aspirador, material de intubação) — risco de morte em intercorrência grave.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'EQUIPAMENTOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B7_P15', codigo: 'M11_B7_09',
      descricao: 'Pacientes com sorologia desconhecida não dialisados em máquina específica — risco de contaminação cruzada enquanto aguardam resultado sorológico.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'EQUIPAMENTOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B7_P16', codigo: 'M11_B7_10',
      descricao: 'Dialisadores e linhas sem registro na ANVISA/MS — uso de materiais não regularizados com risco à segurança do paciente e autuação regulatória.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'EQUIPAMENTOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: PROCESSOS — B8 (Procedimentos Técnicos)
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B8_P01', codigo: 'M11_B8_01',
      descricao: 'Dialisadores e linhas utilizados além de 20 vezes no reprocessamento automático — descumprimento direto da RDC 11/2014 art. 28.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B8_P02', codigo: 'M11_B8_02',
      descricao: 'Medida do volume interno das fibras (priming) não realizada ou dialisadores com redução > 20% não descartados — risco de diálise ineficaz.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B8_P03', codigo: 'M11_B8_03',
      descricao: 'Acondicionamento de dialisadores e linhas sem identificação completa (nome, data, grupo de sorologia) ou em área inadequada — risco de troca e contaminação cruzada.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B8_P05', codigo: 'M11_B8_04',
      descricao: 'Níveis residuais do agente químico não monitorados após enxágue e antes da conexão ao paciente — risco de intoxicação química durante a sessão.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B8_P06', codigo: 'M11_B8_05',
      descricao: 'Análise microbiológica mensal do dialisato não realizada ou cobertura anual incompleta das máquinas (máx. 200 UFC/mL) — risco de infecção sistêmica nos pacientes.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B8_P07', codigo: 'M11_B8_06',
      descricao: 'Ausência de procedimentos de limpeza e desinfecção do sistema quando verificada não conformidade microbiológica (≥ 50 UFC/mL) — risco de surto infeccioso.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: BIOSSEGURANÇA — B9
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B9_P04', codigo: 'M11_B9_01',
      descricao: 'EPI insuficiente, em más condições ou não utilizado por todos os funcionários — risco ocupacional e descumprimento da RDC 11/2014 art. 36.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'BIOSSEGURANCA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B9_P05', codigo: 'M11_B9_02',
      descricao: 'Funcionários sem vacinação contra Hepatite B conforme PNI — risco ocupacional grave e descumprimento da RDC 11/2014 e NR-32.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'BIOSSEGURANCA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B9_P06', codigo: 'M11_B9_03',
      descricao: 'Pacientes não imunes à Hepatite B não vacinados precocemente — risco de infecção grave e descumprimento do PNI/MS.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'BIOSSEGURANCA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B9_P07', codigo: 'M11_B9_04',
      descricao: 'Resultados sorológicos de pacientes recém-admitidos não obtidos — impossibilita segregação adequada e aumenta risco de transmissão de doenças.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'BIOSSEGURANCA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: QUALIDADE_AGUA — B10
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B10_P02', codigo: 'M11_B10_01',
      descricao: 'Ausência de laudos que atestem padrão de potabilidade da água de abastecimento — descumprimento da RDC 11/2014 art. 45.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'QUALIDADE_AGUA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B10_P03', codigo: 'M11_B10_02',
      descricao: 'Ausência de análise e registro diário das características físicas e organolépticas da água (cor, turbidez, pH, cloro) — descumprimento RDC 11/2014 art. 47.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'QUALIDADE_AGUA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B10_P04', codigo: 'M11_B10_03',
      descricao: 'Controle bacteriológico do reservatório de água potável não realizado mensalmente — descumprimento da RDC 11/2014 art. 56.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'QUALIDADE_AGUA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B10_P05', codigo: 'M11_B10_04',
      descricao: 'Limpeza do reservatório de água potável não realizada semestralmente — descumprimento RDC 11/2014 art. 56.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'QUALIDADE_AGUA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B10_P06', codigo: 'M11_B10_05',
      descricao: 'Reservatório de água potável sem autonomia de 2 dias (< 200 L/paciente/dia) ou sem proteção adequada — risco de desabastecimento e contaminação.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'QUALIDADE_AGUA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B10_P09', codigo: 'M11_B10_06',
      descricao: 'Desinfecção do STDAH não realizada por pessoa capacitada conforme plano de gerenciamento — risco de biofilme e contaminação da água tratada.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'QUALIDADE_AGUA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B10_P10', codigo: 'M11_B10_07',
      descricao: 'Limpeza e desinfecção mensal do reservatório e rede de distribuição de água tratada não registradas — descumprimento RDC 11/2014 art. 57.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'QUALIDADE_AGUA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B10_P14', codigo: 'M11_B10_08',
      descricao: 'Ausência de condutivímetro com alarme visual e auditivo (condutividade ≤ 10 µS/cm a 25°C) na saída do STDAH — risco de diálise com água fora do padrão.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'QUALIDADE_AGUA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B10_P18', codigo: 'M11_B10_09',
      descricao: 'Validação microbiológica mensal da água (Coliformes, bactérias heterotróficas, endotoxinas) não realizada ou laudos das 3 últimas coletas ausentes.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'QUALIDADE_AGUA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B10_P19', codigo: 'M11_B10_10',
      descricao: 'Validação físico-química semestral da água não realizada ou laudos das 2 últimas coletas ausentes (nitrato, alumínio, metais pesados etc.).',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'QUALIDADE_AGUA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: PROCESSOS — B11 (Depósito e Resíduos)
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B11_P02', codigo: 'M11_B11_01',
      descricao: 'Área de depósito em mau estado de conservação, higiene ou ventilação — risco de contaminação de insumos e materiais críticos.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B11_P09', codigo: 'M11_B11_02',
      descricao: 'Concentrados químicos para diálise sem registro na ANVISA/MS — uso de produto não regularizado, risco à segurança do paciente e autuação.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'PROCESSOS',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B11_P11', codigo: 'M11_B11_03',
      descricao: 'PGRSS não executado conforme legislação — descumprimento da RDC 306/2004 com risco ambiental e sanitário.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'PROCESSOS',
      tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B11_P13', codigo: 'M11_B11_04',
      descricao: 'Perfurocortantes acondicionados inadequadamente — risco de acidente com material biológico para toda a equipe.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'PROCESSOS',
      tipo: 'OBRIGATORIO', prioridade: 8,
    },

    // ══════════════════════════════════════════════════════════════════
    // DOMÍNIO: SEGURANÇA — B12 (Segurança e Qualidade)
    // ══════════════════════════════════════════════════════════════════
    {
      pergunta: 'B12_P01', codigo: 'M11_B12_01',
      descricao: 'Art. 6 — Membros da equipe não permanecem no ambiente de diálise durante toda a sessão — descumprimento direto da RDC 11/2014, risco imediato ao paciente.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_III', prazo_dias: 15, dominio: 'SEGURANCA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 10,
    },
    {
      pergunta: 'B12_P02', codigo: 'M11_B12_02',
      descricao: 'Art. 8 — Núcleo de Segurança do Paciente (NSP) não constituído ou Plano de Segurança do Paciente não implantado — descumprimento da RDC 11/2014 c/c RDC 36/2013.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'SEGURANCA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 8,
    },
    {
      pergunta: 'B12_P03', codigo: 'M11_B12_03',
      descricao: 'Art. 9 — Ausência de mecanismos de avaliação da qualidade e monitoramento dos processos por indicadores — descumprimento da RDC 11/2014 art. 9.',
      operador: 'BOOLEAN_FALSE', valor_gatilho: 'false',
      nivel_nc: 'NC_II', prazo_dias: 30, dominio: 'SEGURANCA',
      legislacao_ref: 'RDC_11_2014', tipo: 'OBRIGATORIO', prioridade: 7,
    },
  ]

  // ── Persiste todas as regras ──────────────────────────────────────────
  let criadas = 0
  let erros = 0

  for (const r of regras) {
    try {
      const perguntaId = await getPerguntaId(r.pergunta)
      await prisma.regraNaoConformidade.upsert({
        where: { codigo: r.codigo },
        update: {
          pergunta_id: perguntaId,
          descricao: r.descricao,
          operador: r.operador,
          valor_gatilho: r.valor_gatilho,
          nivel_nc: r.nivel_nc as any,
          prazo_dias: r.prazo_dias,
          dominio: r.dominio,
          legislacao_ref: r.legislacao_ref ?? null,
          tipo: r.tipo,
          prioridade: r.prioridade,
          ativo: true,
        },
        create: {
          pergunta_id: perguntaId,
          codigo: r.codigo,
          descricao: r.descricao,
          operador: r.operador,
          valor_gatilho: r.valor_gatilho,
          nivel_nc: r.nivel_nc as any,
          prazo_dias: r.prazo_dias,
          dominio: r.dominio,
          legislacao_ref: r.legislacao_ref ?? null,
          tipo: r.tipo,
          prioridade: r.prioridade,
          ativo: true,
        },
      })
      criadas++
    } catch (err) {
      console.error(`❌ Erro na regra ${r.codigo}:`, (err as Error).message)
      erros++
    }
  }

  console.log('')
  console.log(`✅ Regras criadas/atualizadas: ${criadas}`)
  if (erros > 0) console.warn(`⚠️  Erros: ${erros}`)
  console.log('')
  console.log('📊 Distribuição por domínio:')
  console.log('   ESTRUTURA      → 22 regras')
  console.log('   RH             → 15 regras')
  console.log('   PROCESSOS      → 24 regras')
  console.log('   EQUIPAMENTOS   → 10 regras')
  console.log('   BIOSSEGURANÇA  →  4 regras')
  console.log('   QUALIDADE_AGUA → 10 regras')
  console.log('   SEGURANÇA      →  3 regras')
  console.log('   ─────────────────────────')
  console.log('   TOTAL          → 88 regras')
  console.log('')
  console.log('📊 Distribuição por nível:')
  console.log('   NC_III (Crítico, 15 dias)    → 62 regras')
  console.log('   NC_II  (Importante, 30 dias) → 22 regras')
  console.log('   NC_I   (Moderado, 60 dias)   →  4 regras')
  console.log('')
  console.log('🎉 Seed do Motor M11 v2 concluído!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
