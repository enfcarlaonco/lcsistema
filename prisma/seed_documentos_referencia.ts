// prisma/seed_documentos_referencia.ts
// Seed da lista mestre de documentos — Módulo 2.2 Avaliação Documental
// Baseado em: POP__ITT__CHECKLIS__ONA.xlsx + DETALHAMENTO_PARA_O_SISTEMA_ELABORADO_POR_LUCIANA.xlsx
// Execute: npx tsx prisma/seed_documentos_referencia.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// ─── Tipos internos ───────────────────────────────────────────────────────────

type GrauNecessidade = 'LEGISLACAO' | 'ACREDITACAO' | 'MELHORES_PRATICAS'
type PerfilRequerido = 'CONFORMIDADE' | 'ACREDITACAO' | 'AMBOS'

interface DocRef {
  codigo: string
  titulo: string
  tipo: string                    // POP | Protocolo | ITO | Checklist | Formulário
  area: string
  tema: string
  grau_necessidade: GrauNecessidade
  perfil_requerido: PerfilRequerido
  legislacao_ref?: string
  ona_requisito?: string          // ex: "2.13.1"
  obrigatorio: boolean
}

// ─── Lista mestre ─────────────────────────────────────────────────────────────

const documentos: DocRef[] = [

  // ══════════════════════════════════════════════════════════════════════
  // LEGISLAÇÃO — obrigatórios por RDC 11/2014 e PT 389/2014
  // Perfil: AMBOS (aparecem independente do perfil do cliente)
  // ══════════════════════════════════════════════════════════════════════

  // Gestão e organização
  {
    codigo: 'DOC_001',
    titulo: 'Manual de Procedimentos Operacionais Padrão (MPOP)',
    tipo: 'POP', area: 'Gestão', tema: 'Organização do serviço',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_002',
    titulo: 'Programa de Controle e Prevenção de Infecção e Eventos Adversos (PCPIEA)',
    tipo: 'Protocolo', area: 'Gestão', tema: 'Controle de infecção',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_003',
    titulo: 'Plano de Gerenciamento de Resíduos de Serviços de Saúde (PGRSS)',
    tipo: 'Protocolo', area: 'Gestão', tema: 'Resíduos de saúde',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_004',
    titulo: 'Programa de Controle Médico de Saúde Ocupacional (PCMSO)',
    tipo: 'Protocolo', area: 'RH', tema: 'Saúde ocupacional',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'NR_32', obrigatorio: true,
  },
  {
    codigo: 'DOC_005',
    titulo: 'Plano de Segurança do Paciente',
    tipo: 'Protocolo', area: 'Gestão', tema: 'Segurança do paciente',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },

  // Hemodiálise — procedimentos técnicos obrigatórios
  {
    codigo: 'DOC_006',
    titulo: 'POP — Preparo da máquina de hemodiálise',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Preparo, operação e segurança da sessão',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_007',
    titulo: 'POP — Admissão e assistência ao paciente durante sessão de hemodiálise',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Admissão e assistência ao paciente',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_008',
    titulo: 'POP — Punção de fístula artéria-venosa (FAV) para sessão de hemodiálise',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Acesso vascular',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_009',
    titulo: 'POP — Manipulação do cateter venoso central (CVC) para hemodiálise',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Acesso vascular',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_010',
    titulo: 'POP — Curativo de cateter de duplo lúmen (CDL) para hemodiálise',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Acesso vascular',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_011',
    titulo: 'POP — Preparo e administração de heparina durante a hemodiálise',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Soluções, anticoagulação e componentes',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_012',
    titulo: 'POP — Sessão de hemodiálise sem heparina',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Soluções, anticoagulação e componentes',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_013',
    titulo: 'POP — Reprocessamento de dialisadores e linhas de hemodiálise',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Limpeza, desinfecção e reprocessamento',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: false,
  },
  {
    codigo: 'DOC_014',
    titulo: 'POP — Limpeza e desinfecção de alto nível dos dialisadores, linhas e bancada de reuso',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Limpeza, desinfecção e reprocessamento',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_015',
    titulo: 'POP — Liberação da máquina após utilização em pacientes HBsAg+',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Preparo, operação e segurança da sessão',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },

  // Qualidade da água
  {
    codigo: 'DOC_016',
    titulo: 'ITO — Gerenciamento da qualidade da água para hemodiálise',
    tipo: 'ITO', area: 'Hemodiálise', tema: 'Qualidade da água e sistema de osmose',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_017',
    titulo: 'ITO — Manutenção preventiva na estação de tratamento de água',
    tipo: 'ITO', area: 'Hemodiálise', tema: 'Qualidade da água e sistema de osmose',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_018',
    titulo: 'POP — Coleta de água para análise microbiológica e físico-química',
    tipo: 'POP', area: 'Hemodiálise', tema: 'Qualidade da água e sistema de osmose',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_019',
    titulo: 'ITO — Controle diário do sistema de tratamento de água',
    tipo: 'ITO', area: 'Hemodiálise', tema: 'Qualidade da água e sistema de osmose',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_020',
    titulo: 'ITO — Desinfecção do sistema de distribuição de água tratada',
    tipo: 'ITO', area: 'Hemodiálise', tema: 'Qualidade da água e sistema de osmose',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },

  // Protocolos clínicos obrigatórios
  {
    codigo: 'DOC_021',
    titulo: 'Protocolo — Abordagem de complicações agudas durante a hemodiálise',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_022',
    titulo: 'Protocolo — Reação pirogênica na hemodiálise',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_023',
    titulo: 'Protocolo — Acesso vascular em hemodiálise',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Acesso vascular',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_024',
    titulo: 'Protocolo — Anticoagulação em diálise',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Soluções, anticoagulação e componentes',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_025',
    titulo: 'Protocolo — Infecção relacionada à diálise',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Controle de infecção',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_026',
    titulo: 'Protocolo — Prescrição de hemodiálise',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Prescrição e planejamento',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'PT_389_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_027',
    titulo: 'Protocolo — Admissão ambulatorial de pacientes em terapia de substituição renal',
    tipo: 'Protocolo', area: 'Ambulatório', tema: 'Admissão ambulatorial',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'PT_389_2014', obrigatorio: true,
  },

  // Formulários e checklists obrigatórios
  {
    codigo: 'DOC_028',
    titulo: 'Checklist pré-diálise',
    tipo: 'Checklist', area: 'Hemodiálise', tema: 'Segurança da sessão',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_029',
    titulo: 'Checklist intra-diálise',
    tipo: 'Checklist', area: 'Hemodiálise', tema: 'Segurança da sessão',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_030',
    titulo: 'Checklist pós-diálise',
    tipo: 'Checklist', area: 'Hemodiálise', tema: 'Segurança da sessão',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_031',
    titulo: 'Formulário de notificação de não conformidade',
    tipo: 'Formulário', area: 'Gestão', tema: 'Gestão da qualidade',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    obrigatorio: true,
  },
  {
    codigo: 'DOC_032',
    titulo: 'Controle de acesso vascular por paciente (histórico)',
    tipo: 'Formulário', area: 'Hemodiálise', tema: 'Acesso vascular',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },
  {
    codigo: 'DOC_033',
    titulo: 'Registro de uso do dialisador e linhas (1º uso — assinado pelo paciente)',
    tipo: 'Formulário', area: 'Hemodiálise', tema: 'Reprocessamento',
    grau_necessidade: 'LEGISLACAO', perfil_requerido: 'AMBOS',
    legislacao_ref: 'RDC_11_2014', obrigatorio: true,
  },

  // ══════════════════════════════════════════════════════════════════════
  // MELHORES PRÁTICAS — recomendados independente de perfil ONA
  // Perfil: AMBOS
  // ══════════════════════════════════════════════════════════════════════

  {
    codigo: 'DOC_034',
    titulo: 'Protocolo — Abordagem da anemia em pacientes em programa de diálise',
    tipo: 'Protocolo', area: 'Geral', tema: 'Anemia em pacientes dialíticos',
    grau_necessidade: 'MELHORES_PRATICAS', perfil_requerido: 'AMBOS',
    obrigatorio: false,
  },
  {
    codigo: 'DOC_035',
    titulo: 'Protocolo — Distúrbio do metabolismo mineral e ósseo na DRC',
    tipo: 'Protocolo', area: 'Geral', tema: 'Distúrbio mineral e ósseo na DRC',
    grau_necessidade: 'MELHORES_PRATICAS', perfil_requerido: 'AMBOS',
    obrigatorio: false,
  },
  {
    codigo: 'DOC_036',
    titulo: 'Protocolo — Lesão Renal Aguda',
    tipo: 'Protocolo', area: 'Geral', tema: 'Lesão renal aguda',
    grau_necessidade: 'MELHORES_PRATICAS', perfil_requerido: 'AMBOS',
    obrigatorio: false,
  },
  {
    codigo: 'DOC_037',
    titulo: 'Plano terapêutico interdisciplinar individualizado',
    tipo: 'Formulário', area: 'Gestão', tema: 'Assistência interdisciplinar',
    grau_necessidade: 'MELHORES_PRATICAS', perfil_requerido: 'AMBOS',
    obrigatorio: false,
  },
  {
    codigo: 'DOC_038',
    titulo: 'Protocolo — Monitoramento da adequação dialítica (Kt/V)',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Indicadores assistenciais',
    grau_necessidade: 'MELHORES_PRATICAS', perfil_requerido: 'AMBOS',
    obrigatorio: false,
  },
  {
    codigo: 'DOC_039',
    titulo: 'Painel de indicadores assistenciais e de qualidade',
    tipo: 'Formulário', area: 'Gestão', tema: 'Indicadores',
    grau_necessidade: 'MELHORES_PRATICAS', perfil_requerido: 'AMBOS',
    obrigatorio: false,
  },
  {
    codigo: 'DOC_040',
    titulo: 'Matriz de riscos assistenciais',
    tipo: 'Formulário', area: 'Gestão', tema: 'Gestão de riscos',
    grau_necessidade: 'MELHORES_PRATICAS', perfil_requerido: 'AMBOS',
    obrigatorio: false,
  },

  // ══════════════════════════════════════════════════════════════════════
  // ACREDITAÇÃO ONA — exclusivos do perfil ACREDITACAO
  // ══════════════════════════════════════════════════════════════════════

  // Requisito 2.13.1 — Protocolos e procedimentos
  {
    codigo: 'DOC_041',
    titulo: 'Protocolo — Início de terapia dialítica',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Prescrição e planejamento',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_042',
    titulo: 'Protocolo — Suspensão de diálise',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Prescrição e planejamento',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_043',
    titulo: 'Protocolo — Uso de ácido peracético',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Limpeza, desinfecção e reprocessamento',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_044',
    titulo: 'Protocolo — Hipotensão intradialítica',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_045',
    titulo: 'Protocolo — Hipervolemia em pacientes dialíticos',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_046',
    titulo: 'Protocolo — Hipercalemia em pacientes dialíticos',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_047',
    titulo: 'Protocolo — Urgência dialítica',
    tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_048',
    titulo: 'Fluxograma — Atendimento de urgência dialítica',
    tipo: 'Formulário', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_049',
    titulo: 'Fluxograma — Encaminhamento para UTI',
    tipo: 'Formulário', area: 'Hemodiálise', tema: 'Continuidade do cuidado',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_050',
    titulo: 'Fluxograma — Encaminhamento para transplante',
    tipo: 'Formulário', area: 'Ambulatório', tema: 'Continuidade do cuidado',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },

  // Requisito 2.13.2 — Monitoramento da demanda
  {
    codigo: 'DOC_051',
    titulo: 'Sistema de monitoramento de demanda (dashboard ou planilha estruturada)',
    tipo: 'Formulário', area: 'Gestão', tema: 'Monitoramento da demanda',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.2', obrigatorio: false,
  },
  {
    codigo: 'DOC_052',
    titulo: 'Fluxograma — Admissão em diálise',
    tipo: 'Formulário', area: 'Gestão', tema: 'Fluxo de admissão',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.2', obrigatorio: false,
  },
  {
    codigo: 'DOC_053',
    titulo: 'Fluxograma — Redistribuição de agenda e gestão de vagas',
    tipo: 'Formulário', area: 'Gestão', tema: 'Gestão da agenda',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.2', obrigatorio: false,
  },

  // Requisito 2.13.3 — Riscos assistenciais
  {
    codigo: 'DOC_054',
    titulo: 'Matriz de riscos assistenciais com probabilidade, impacto e classificação',
    tipo: 'Formulário', area: 'Gestão', tema: 'Identificação de riscos',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.3', obrigatorio: false,
  },
  {
    codigo: 'DOC_055',
    titulo: 'Plano de ações preventivas para redução de riscos assistenciais',
    tipo: 'Formulário', area: 'Gestão', tema: 'Identificação de riscos',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.3', obrigatorio: false,
  },

  // Diálise Peritoneal — ONA
  {
    codigo: 'DOC_056',
    titulo: 'Protocolo — Indicações e tipos de diálise peritoneal',
    tipo: 'Protocolo', area: 'Diálise Peritoneal', tema: 'Indicações, modalidades e avaliação',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_057',
    titulo: 'POP — Implante e cuidados com cateter de Tenckhoff',
    tipo: 'POP', area: 'Diálise Peritoneal', tema: 'Cateter de Tenckhoff e dispositivos',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_058',
    titulo: 'POP — Treinamento do paciente e familiares para DP domiciliar',
    tipo: 'POP', area: 'Diálise Peritoneal', tema: 'Treinamento e cuidado domiciliar',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_059',
    titulo: 'Protocolo — Complicações infecciosas relacionadas à diálise peritoneal',
    tipo: 'Protocolo', area: 'Diálise Peritoneal', tema: 'Complicações infecciosas',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },

  // Transplante Renal — ONA
  {
    codigo: 'DOC_060',
    titulo: 'Protocolo — Avaliação do candidato a receptor de transplante renal',
    tipo: 'Protocolo', area: 'Transplante Renal', tema: 'Avaliação do candidato a transplante',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_061',
    titulo: 'Protocolo — Imunossupressão de manutenção no pós-transplante renal',
    tipo: 'Protocolo', area: 'Transplante Renal', tema: 'Imunossupressão',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_062',
    titulo: 'Protocolo — Acompanhamento ambulatorial no pós-transplante renal',
    tipo: 'Protocolo', area: 'Transplante Renal', tema: 'Seguimento pós-transplante',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.1', obrigatorio: false,
  },

  // Comunicação e educação — ONA
  {
    codigo: 'DOC_063',
    titulo: 'Plano de ações de educação em saúde com cronograma',
    tipo: 'Formulário', area: 'Gestão', tema: 'Promoção da saúde',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.1.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_064',
    titulo: 'Materiais educativos para pacientes (cartilhas, orientações)',
    tipo: 'Formulário', area: 'Gestão', tema: 'Comunicação com o paciente',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.1.1', obrigatorio: false,
  },
  {
    codigo: 'DOC_065',
    titulo: 'Sistema de registro de notificação e monitoramento de incidentes e eventos adversos',
    tipo: 'Formulário', area: 'Gestão', tema: 'Segurança do paciente',
    grau_necessidade: 'ACREDITACAO', perfil_requerido: 'ACREDITACAO',
    ona_requisito: '2.13.3', obrigatorio: false,
  },
]

// ─── Seed principal ───────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seed da lista mestre de documentos de referência...')

  // Busca ou cria os tipos de documento necessários
  const tiposNecessarios = [...new Set(documentos.map(d => d.tipo))]
  const tiposMap: Record<string, string> = {}

  for (const nome of tiposNecessarios) {
    const tipo = await prisma.tipoDocumento.upsert({
      where: { nome },
      update: {},
      create: { nome },
    })
    tiposMap[nome] = tipo.id
  }
  console.log(`✅ Tipos de documento: ${tiposNecessarios.length}`)

  // Cria os documentos de referência
  let criados = 0
  let erros = 0

  for (const doc of documentos) {
    try {
      await prisma.documentoReferencia.upsert({
        where: { codigo: doc.codigo } as any,
        update: {},
        create: {
          codigo: doc.codigo,
          titulo: doc.titulo,
          tipo_documento_id: tiposMap[doc.tipo],
          area: doc.area,
          tema: doc.tema,
          grau_necessidade: doc.grau_necessidade,
          perfil_requerido: doc.perfil_requerido,
          legislacao_ref: doc.legislacao_ref ?? null,
          ona_requisito: doc.ona_requisito ?? null,
          obrigatorio: doc.obrigatorio,
          ativo: true,
        } as any,
      })
      criados++
    } catch (err) {
      console.error(`❌ Erro no documento ${doc.codigo}:`, (err as Error).message)
      erros++
    }
  }

  console.log(`✅ Documentos criados: ${criados}`)
  if (erros > 0) console.warn(`⚠️  Erros: ${erros}`)

  console.log('')
  console.log('📊 Distribuição:')
  console.log(`   Legislação (ambos os perfis)    → ${documentos.filter(d => d.grau_necessidade === 'LEGISLACAO').length} documentos`)
  console.log(`   Melhores práticas (ambos)       → ${documentos.filter(d => d.grau_necessidade === 'MELHORES_PRATICAS').length} documentos`)
  console.log(`   Acreditação ONA (perfil ONA)    → ${documentos.filter(d => d.grau_necessidade === 'ACREDITACAO').length} documentos`)
  console.log(`   Total                           → ${documentos.length} documentos`)
  console.log('')
  console.log('🎉 Seed da lista mestre concluído!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
