import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Corrigindo seed de documentos...')

  const tiposMap: Record<string, string> = {}
  const tipos = ['POP', 'Protocolo', 'ITO', 'Checklist', 'Formulário']
  for (const nome of tipos) {
    const t = await prisma.tipoDocumento.upsert({ where: { nome }, update: {}, create: { nome } })
    tiposMap[nome] = t.id
  }

  const docs = [
    { codigo: 'DOC_001', titulo: 'Manual de Procedimentos Operacionais Padrão (MPOP)', tipo: 'POP', area: 'Gestão', tema: 'Organização do serviço', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_002', titulo: 'Programa de Controle e Prevenção de Infecção e Eventos Adversos (PCPIEA)', tipo: 'Protocolo', area: 'Gestão', tema: 'Controle de infecção', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_003', titulo: 'Plano de Gerenciamento de Resíduos de Serviços de Saúde (PGRSS)', tipo: 'Protocolo', area: 'Gestão', tema: 'Resíduos de saúde', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_004', titulo: 'Programa de Controle Médico de Saúde Ocupacional (PCMSO)', tipo: 'Protocolo', area: 'RH', tema: 'Saúde ocupacional', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'NR_32', obrig: true },
    { codigo: 'DOC_005', titulo: 'Plano de Segurança do Paciente', tipo: 'Protocolo', area: 'Gestão', tema: 'Segurança do paciente', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_006', titulo: 'POP — Preparo da máquina de hemodiálise', tipo: 'POP', area: 'Hemodiálise', tema: 'Preparo, operação e segurança da sessão', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_007', titulo: 'POP — Admissão e assistência ao paciente durante sessão de hemodiálise', tipo: 'POP', area: 'Hemodiálise', tema: 'Admissão e assistência ao paciente', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_008', titulo: 'POP — Punção de fístula artéria-venosa (FAV) para sessão de hemodiálise', tipo: 'POP', area: 'Hemodiálise', tema: 'Acesso vascular', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_009', titulo: 'POP — Manipulação do cateter venoso central (CVC) para hemodiálise', tipo: 'POP', area: 'Hemodiálise', tema: 'Acesso vascular', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_010', titulo: 'POP — Curativo de cateter de duplo lúmen (CDL) para hemodiálise', tipo: 'POP', area: 'Hemodiálise', tema: 'Acesso vascular', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_011', titulo: 'POP — Preparo e administração de heparina durante a hemodiálise', tipo: 'POP', area: 'Hemodiálise', tema: 'Soluções, anticoagulação e componentes', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_012', titulo: 'POP — Sessão de hemodiálise sem heparina', tipo: 'POP', area: 'Hemodiálise', tema: 'Soluções, anticoagulação e componentes', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_013', titulo: 'POP — Reprocessamento de dialisadores e linhas de hemodiálise', tipo: 'POP', area: 'Hemodiálise', tema: 'Limpeza, desinfecção e reprocessamento', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: false },
    { codigo: 'DOC_014', titulo: 'POP — Limpeza e desinfecção de alto nível dos dialisadores, linhas e bancada de reuso', tipo: 'POP', area: 'Hemodiálise', tema: 'Limpeza, desinfecção e reprocessamento', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_015', titulo: 'POP — Liberação da máquina após utilização em pacientes HBsAg+', tipo: 'POP', area: 'Hemodiálise', tema: 'Preparo, operação e segurança da sessão', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_016', titulo: 'ITO — Gerenciamento da qualidade da água para hemodiálise', tipo: 'ITO', area: 'Hemodiálise', tema: 'Qualidade da água e sistema de osmose', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_017', titulo: 'ITO — Manutenção preventiva na estação de tratamento de água', tipo: 'ITO', area: 'Hemodiálise', tema: 'Qualidade da água e sistema de osmose', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_018', titulo: 'POP — Coleta de água para análise microbiológica e físico-química', tipo: 'POP', area: 'Hemodiálise', tema: 'Qualidade da água e sistema de osmose', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_019', titulo: 'ITO — Controle diário do sistema de tratamento de água', tipo: 'ITO', area: 'Hemodiálise', tema: 'Qualidade da água e sistema de osmose', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_020', titulo: 'ITO — Desinfecção do sistema de distribuição de água tratada', tipo: 'ITO', area: 'Hemodiálise', tema: 'Qualidade da água e sistema de osmose', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_021', titulo: 'Protocolo — Abordagem de complicações agudas durante a hemodiálise', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_022', titulo: 'Protocolo — Reação pirogênica na hemodiálise', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_023', titulo: 'Protocolo — Acesso vascular em hemodiálise', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Acesso vascular', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_024', titulo: 'Protocolo — Anticoagulação em diálise', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Soluções, anticoagulação e componentes', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_025', titulo: 'Protocolo — Infecção relacionada à diálise', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Controle de infecção', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_026', titulo: 'Protocolo — Prescrição de hemodiálise', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Prescrição e planejamento', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'PT_389_2014', obrig: true },
    { codigo: 'DOC_027', titulo: 'Protocolo — Admissão ambulatorial de pacientes em terapia de substituição renal', tipo: 'Protocolo', area: 'Ambulatório', tema: 'Admissão ambulatorial', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'PT_389_2014', obrig: true },
    { codigo: 'DOC_028', titulo: 'Checklist pré-diálise', tipo: 'Checklist', area: 'Hemodiálise', tema: 'Segurança da sessão', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_029', titulo: 'Checklist intra-diálise', tipo: 'Checklist', area: 'Hemodiálise', tema: 'Segurança da sessão', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_030', titulo: 'Checklist pós-diálise', tipo: 'Checklist', area: 'Hemodiálise', tema: 'Segurança da sessão', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_031', titulo: 'Formulário de notificação de não conformidade', tipo: 'Formulário', area: 'Gestão', tema: 'Gestão da qualidade', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: null, obrig: true },
    { codigo: 'DOC_032', titulo: 'Controle de acesso vascular por paciente (histórico)', tipo: 'Formulário', area: 'Hemodiálise', tema: 'Acesso vascular', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_033', titulo: 'Registro de uso do dialisador e linhas (1º uso — assinado pelo paciente)', tipo: 'Formulário', area: 'Hemodiálise', tema: 'Reprocessamento', grau: 'LEGISLACAO', perfil: 'AMBOS', leg: 'RDC_11_2014', obrig: true },
    { codigo: 'DOC_034', titulo: 'Protocolo — Abordagem da anemia em pacientes em programa de diálise', tipo: 'Protocolo', area: 'Geral', tema: 'Anemia em pacientes dialíticos', grau: 'MELHORES_PRATICAS', perfil: 'AMBOS', leg: null, obrig: false },
    { codigo: 'DOC_035', titulo: 'Protocolo — Distúrbio do metabolismo mineral e ósseo na DRC', tipo: 'Protocolo', area: 'Geral', tema: 'Distúrbio mineral e ósseo na DRC', grau: 'MELHORES_PRATICAS', perfil: 'AMBOS', leg: null, obrig: false },
    { codigo: 'DOC_036', titulo: 'Protocolo — Lesão Renal Aguda', tipo: 'Protocolo', area: 'Geral', tema: 'Lesão renal aguda', grau: 'MELHORES_PRATICAS', perfil: 'AMBOS', leg: null, obrig: false },
    { codigo: 'DOC_037', titulo: 'Plano terapêutico interdisciplinar individualizado', tipo: 'Formulário', area: 'Gestão', tema: 'Assistência interdisciplinar', grau: 'MELHORES_PRATICAS', perfil: 'AMBOS', leg: null, obrig: false },
    { codigo: 'DOC_038', titulo: 'Protocolo — Monitoramento da adequação dialítica (Kt/V)', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Indicadores assistenciais', grau: 'MELHORES_PRATICAS', perfil: 'AMBOS', leg: null, obrig: false },
    { codigo: 'DOC_039', titulo: 'Painel de indicadores assistenciais e de qualidade', tipo: 'Formulário', area: 'Gestão', tema: 'Indicadores', grau: 'MELHORES_PRATICAS', perfil: 'AMBOS', leg: null, obrig: false },
    { codigo: 'DOC_040', titulo: 'Matriz de riscos assistenciais', tipo: 'Formulário', area: 'Gestão', tema: 'Gestão de riscos', grau: 'MELHORES_PRATICAS', perfil: 'AMBOS', leg: null, obrig: false },
    { codigo: 'DOC_041', titulo: 'Protocolo — Início de terapia dialítica', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Prescrição e planejamento', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_042', titulo: 'Protocolo — Suspensão de diálise', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Prescrição e planejamento', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_043', titulo: 'Protocolo — Uso de ácido peracético', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Limpeza, desinfecção e reprocessamento', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_044', titulo: 'Protocolo — Hipotensão intradialítica', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_045', titulo: 'Protocolo — Hipervolemia em pacientes dialíticos', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_046', titulo: 'Protocolo — Hipercalemia em pacientes dialíticos', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_047', titulo: 'Protocolo — Urgência dialítica', tipo: 'Protocolo', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_048', titulo: 'Fluxograma — Atendimento de urgência dialítica', tipo: 'Formulário', area: 'Hemodiálise', tema: 'Intercorrências e complicações agudas', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_049', titulo: 'Fluxograma — Encaminhamento para UTI', tipo: 'Formulário', area: 'Hemodiálise', tema: 'Continuidade do cuidado', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_050', titulo: 'Fluxograma — Encaminhamento para transplante', tipo: 'Formulário', area: 'Ambulatório', tema: 'Continuidade do cuidado', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_051', titulo: 'Sistema de monitoramento de demanda', tipo: 'Formulário', area: 'Gestão', tema: 'Monitoramento da demanda', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.2', obrig: false },
    { codigo: 'DOC_052', titulo: 'Fluxograma — Admissão em diálise', tipo: 'Formulário', area: 'Gestão', tema: 'Fluxo de admissão', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.2', obrig: false },
    { codigo: 'DOC_053', titulo: 'Fluxograma — Redistribuição de agenda e gestão de vagas', tipo: 'Formulário', area: 'Gestão', tema: 'Gestão da agenda', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.2', obrig: false },
    { codigo: 'DOC_054', titulo: 'Matriz de riscos assistenciais com probabilidade, impacto e classificação', tipo: 'Formulário', area: 'Gestão', tema: 'Identificação de riscos', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.3', obrig: false },
    { codigo: 'DOC_055', titulo: 'Plano de ações preventivas para redução de riscos assistenciais', tipo: 'Formulário', area: 'Gestão', tema: 'Identificação de riscos', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.3', obrig: false },
    { codigo: 'DOC_056', titulo: 'Protocolo — Indicações e tipos de diálise peritoneal', tipo: 'Protocolo', area: 'Diálise Peritoneal', tema: 'Indicações, modalidades e avaliação', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_057', titulo: 'POP — Implante e cuidados com cateter de Tenckhoff', tipo: 'POP', area: 'Diálise Peritoneal', tema: 'Cateter de Tenckhoff e dispositivos', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_058', titulo: 'POP — Treinamento do paciente e familiares para DP domiciliar', tipo: 'POP', area: 'Diálise Peritoneal', tema: 'Treinamento e cuidado domiciliar', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_059', titulo: 'Protocolo — Complicações infecciosas relacionadas à diálise peritoneal', tipo: 'Protocolo', area: 'Diálise Peritoneal', tema: 'Complicações infecciosas', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_060', titulo: 'Protocolo — Avaliação do candidato a receptor de transplante renal', tipo: 'Protocolo', area: 'Transplante Renal', tema: 'Avaliação do candidato a transplante', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_061', titulo: 'Protocolo — Imunossupressão de manutenção no pós-transplante renal', tipo: 'Protocolo', area: 'Transplante Renal', tema: 'Imunossupressão', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_062', titulo: 'Protocolo — Acompanhamento ambulatorial no pós-transplante renal', tipo: 'Protocolo', area: 'Transplante Renal', tema: 'Seguimento pós-transplante', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.1', obrig: false },
    { codigo: 'DOC_063', titulo: 'Plano de ações de educação em saúde com cronograma', tipo: 'Formulário', area: 'Gestão', tema: 'Promoção da saúde', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.1.1', obrig: false },
    { codigo: 'DOC_064', titulo: 'Materiais educativos para pacientes (cartilhas, orientações)', tipo: 'Formulário', area: 'Gestão', tema: 'Comunicação com o paciente', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.1.1', obrig: false },
    { codigo: 'DOC_065', titulo: 'Sistema de registro e monitoramento de incidentes e eventos adversos', tipo: 'Formulário', area: 'Gestão', tema: 'Segurança do paciente', grau: 'ACREDITACAO', perfil: 'ACREDITACAO', leg: null, ona: '2.13.3', obrig: false },
  ] as any[]

  let criados = 0
  for (const d of docs) {
    try {
      await prisma.documentoReferencia.upsert({
        where: { codigo: d.codigo },
        update: {},
        create: {
          codigo: d.codigo,
          titulo: d.titulo,
          nome_documento: d.titulo,
          tipo_documento_id: tiposMap[d.tipo],
          categoria: d.grau === 'LEGISLACAO' ? 'ASSISTENCIAL' : 'GERENCIAL',
          area: d.area,
          tema: d.tema,
          grau_necessidade: d.grau,
          perfil_requerido: d.perfil,
          legislacao_ref: d.leg ?? null,
          ona_requisito: d.ona ?? null,
          obrigatorio: d.obrig,
          ativo: true,
        },
      })
      criados++
    } catch (e) {
      console.error(`❌ ${d.codigo}:`, (e as Error).message)
    }
  }

  console.log(`✅ Documentos criados: ${criados} de ${docs.length}`)
  console.log('🎉 Concluído!')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
