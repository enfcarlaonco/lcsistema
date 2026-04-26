import { PrismaClient, PerfilUsuario, TipoServico, NivelNC } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do LC Sistema...')

  // ── Usuário admin LC Saúde ──
  const senhaHash = await bcrypt.hash('lcsaude@2026', 10)
  const admin = await prisma.usuario.upsert({
    where: { email: 'luciana@lcsaude.com.br' },
    update: {},
    create: {
      nome: 'Luciana Milagres',
      email: 'luciana@lcsaude.com.br',
      senha_hash: senhaHash,
      perfil: PerfilUsuario.ADMIN_LC,
    },
  })
  console.log('✅ Usuário admin criado:', admin.email)

  // ── Blocos do questionário (M2) ──
  const blocos = [
    { tipo: 'IDENTIFICACAO', codigo: 'B0', titulo: 'Identificação e perfil do serviço', ordem: 0, obrigatorio: true },
    { tipo: 'ESTRUTURA_FISICA', codigo: 'B1', titulo: 'Estrutura física e tecnológica', ordem: 1, obrigatorio: true },
    { tipo: 'RECURSOS_HUMANOS', codigo: 'B2', titulo: 'Recursos humanos e dimensionamento', ordem: 2, obrigatorio: true },
    { tipo: 'PROCESSOS_DOCUMENTOS', codigo: 'B3', titulo: 'Processos, documentos e protocolos', ordem: 3, obrigatorio: true },
    { tipo: 'FATURAMENTO_CUSTOS', codigo: 'B4', titulo: 'Faturamento e gestão de custos', ordem: 4, obrigatorio: false,
      condicao_ativacao: { modalidades: ['HD_CRONICO_AMBULATORIAL', 'HD_AGUDO_AMBULATORIAL', 'HD_INTERNADO', 'DP_CAPD', 'DP_DPA'] } },
    { tipo: 'INDICADORES', codigo: 'B5', titulo: 'Indicadores e terceirizados', ordem: 5, obrigatorio: true },
  ]

  for (const bloco of blocos) {
    await prisma.blocoQuestionario.upsert({
      where: { codigo: bloco.codigo },
      update: {},
      create: bloco as any,
    })
  }
  console.log('✅ Blocos do questionário criados:', blocos.length)

  // ── Perguntas do Bloco 0 (identificação — essenciais para o MVP) ──
  const blocoB0 = await prisma.blocoQuestionario.findUnique({ where: { codigo: 'B0' } })
  if (blocoB0) {
    const perguntasB0 = [
      { codigo: 'B0_P01', enunciado: 'Qual é o nome oficial do serviço de nefrologia?', tipo: 'TEXTO', ordem: 1 },
      { codigo: 'B0_P02', enunciado: 'CNPJ do serviço', tipo: 'TEXTO', ordem: 2 },
      { codigo: 'B0_P03', enunciado: 'CNES do serviço', tipo: 'TEXTO', ordem: 3 },
      { codigo: 'B0_P04', enunciado: 'Quais modalidades de terapia renal substitutiva são realizadas?', tipo: 'SELECAO_MULTIPLA', ordem: 4,
        opcoes: ['HD_CRONICO_AMBULATORIAL','HD_AGUDO_AMBULATORIAL','HD_INTERNADO','HD_UTI','DP_CAPD','DP_DPA','DP_TREINAMENTO','PRE_TRANSPLANTE','POS_TRANSPLANTE','CONSERVADOR'] },
      { codigo: 'B0_P05', enunciado: 'O serviço atende pacientes adultos?', tipo: 'BOOLEAN', ordem: 5 },
      { codigo: 'B0_P06', enunciado: 'O serviço atende pacientes pediátricos?', tipo: 'BOOLEAN', ordem: 6 },
      { codigo: 'B0_P07', enunciado: 'Qual é a principal fonte pagadora?', tipo: 'SELECAO_UNICA', ordem: 7,
        opcoes: ['SUS', 'CONVENIO', 'MISTO'] },
      { codigo: 'B0_P08', enunciado: 'O serviço possui licença da Vigilância Sanitária vigente?', tipo: 'BOOLEAN', ordem: 8,
        legislacao_referencia: 'RDC_11_2014' },
      { codigo: 'B0_P09', enunciado: 'Há médico nefrologista como responsável técnico (RT) devidamente registrado?', tipo: 'BOOLEAN', ordem: 9,
        legislacao_referencia: 'RDC_11_2014' },
      { codigo: 'B0_P10', enunciado: 'Há enfermeiro com habilitação em nefrologia como RT de enfermagem?', tipo: 'BOOLEAN', ordem: 10,
        legislacao_referencia: 'RDC_11_2014' },
    ]

    for (const p of perguntasB0) {
      await prisma.pergunta.upsert({
        where: { codigo: p.codigo },
        update: {},
        create: { ...p, bloco_id: blocoB0.id } as any,
      })
    }
    console.log('✅ Perguntas Bloco 0 criadas:', perguntasB0.length)
  }

  // ── Dimensões de validação documental ──
  const dimensoes = [
    { nome_dimensao: 'Existência', peso_percentual: 10, ordem: 1 },
    { nome_dimensao: 'Estrutura', peso_percentual: 30, ordem: 2 },
    { nome_dimensao: 'Aplicabilidade', peso_percentual: 40, ordem: 3 },
    { nome_dimensao: 'Impacto', peso_percentual: 20, ordem: 4 },
  ]

  for (const d of dimensoes) {
    await prisma.dimensaoValidacao.upsert({
      where: { nome_dimensao: d.nome_dimensao },
      update: {},
      create: d,
    })
  }
  console.log('✅ Dimensões de validação criadas:', dimensoes.length)

  // ── Tipos de documento ──
  const tiposDoc = ['POP', 'Protocolo', 'Checklist', 'Formulário', 'Instrução Técnica']
  for (const nome of tiposDoc) {
    await prisma.tipoDocumento.upsert({
      where: { nome },
      update: {},
      create: { nome },
    })
  }
  console.log('✅ Tipos de documento criados:', tiposDoc.length)

  // ── Legislações base ──
  const legislacoes = [
    { codigo: 'RDC_11_2014', titulo: 'RDC 11/2014 — Regulamento Técnico para funcionamento de serviços de diálise', orgao: 'ANVISA', tipo_norma: 'RDC' },
    { codigo: 'PT_389_2014', titulo: 'Portaria 389/2014 — Linha de Cuidado da Pessoa com DRC', orgao: 'MS', tipo_norma: 'PORTARIA' },
    { codigo: 'NR_32', titulo: 'NR-32 — Segurança e Saúde no Trabalho em Serviços de Saúde', orgao: 'MTE', tipo_norma: 'NR' },
    { codigo: 'NT_ANVISA_04_2023', titulo: 'Nota Técnica GVIMS/GGTES 04/2023 — IRAS e RM em serviços de diálise', orgao: 'ANVISA', tipo_norma: 'NOTA_TECNICA' },
  ]

  for (const l of legislacoes) {
    await prisma.legislacao.upsert({
      where: { codigo: l.codigo },
      update: {},
      create: l,
    })
  }
  console.log('✅ Legislações criadas:', legislacoes.length)

  // ── Benchmarks de mercado ──
  const benchmarks = [
    { modalidade: 'HD', indicador_codigo: 'custo_por_sessao', valor_p25: 280, valor_p50: 340, valor_p75: 420, fonte: 'LC Saúde Consultoria', ano_referencia: 2025 },
    { modalidade: 'HD', indicador_codigo: 'taxa_glosa', valor_p25: 2, valor_p50: 5, valor_p75: 8, fonte: 'LC Saúde Consultoria', ano_referencia: 2025 },
    { modalidade: 'HD', indicador_codigo: 'taxa_ocupacao', valor_p25: 72, valor_p50: 84, valor_p75: 92, fonte: 'LC Saúde Consultoria', ano_referencia: 2025 },
    { modalidade: 'HD', indicador_codigo: 'margem_percentual', valor_p25: 8, valor_p50: 18, valor_p75: 28, fonte: 'LC Saúde Consultoria', ano_referencia: 2025 },
    { modalidade: 'HD', indicador_codigo: 'custo_insumos_por_sessao', valor_p25: 120, valor_p50: 145, valor_p75: 175, fonte: 'LC Saúde Consultoria', ano_referencia: 2025 },
    { modalidade: 'HD', indicador_codigo: 'folha_sobre_receita', valor_p25: 24, valor_p50: 30, valor_p75: 38, fonte: 'LC Saúde Consultoria', ano_referencia: 2025 },
  ]

  for (const b of benchmarks) {
    await prisma.benchmarkMercado.upsert({
      where: { modalidade_indicador_codigo_ano_referencia: { modalidade: b.modalidade, indicador_codigo: b.indicador_codigo, ano_referencia: b.ano_referencia } },
      update: {},
      create: b,
    })
  }
  console.log('✅ Benchmarks criados:', benchmarks.length)

  // ── Cliente demo: Hospital Dilson Godinho ──
  const clienteDemo = await prisma.cliente.upsert({
    where: { cnpj: '00.991.591/0001-06' },
    update: {},
    create: {
      nome: 'Hospital Dilson Godinho',
      cnpj: '00.991.591/0001-06',
      cnes: '2126915',
      tipo_servico: TipoServico.HEMODIALISE,
      cidade: 'Montes Claros',
      estado: 'MG',
      telefone: '(38) 3229-4000',
      email_contato: 'contato@hospdilsongodinho.com.br',
    },
  })

  // Modalidades do cliente demo
  await prisma.clienteModalidade.upsert({
    where: { cliente_id_modalidade: { cliente_id: clienteDemo.id, modalidade: 'HD_CRONICO_AMBULATORIAL' } },
    update: {},
    create: { cliente_id: clienteDemo.id, modalidade: 'HD_CRONICO_AMBULATORIAL' },
  })

  console.log('✅ Cliente demo criado:', clienteDemo.nome)

  // Contrato demo
  await prisma.contrato.upsert({
    where: { id: 'contrato-dilson-2026' },
    update: {},
    create: {
      id: 'contrato-dilson-2026',
      cliente_id: clienteDemo.id,
      data_inicio: new Date('2026-03-03'),
      data_fim: new Date('2026-08-30'),
      total_horas: 346,
      horas_presenciais: 90,
      horas_online: 92,
      horas_preparo: 164,
      valor_total: 138400,
      responsavel_lc_id: admin.id,
      responsavel_cliente: 'Dr. Helder Leone Alves de Carvalho',
    },
  })

  // Usuário do cliente demo
  const senhaCliente = await bcrypt.hash('dilson@2026', 10)
  await prisma.usuario.upsert({
    where: { email: 'gestao@hospdilsongodinho.com.br' },
    update: {},
    create: {
      nome: 'Gestão Dilson Godinho',
      email: 'gestao@hospdilsongodinho.com.br',
      senha_hash: senhaCliente,
      perfil: PerfilUsuario.GESTOR_CLIENTE,
      cliente_id: clienteDemo.id,
    },
  })

  console.log('✅ Contrato e usuário demo criados')
  console.log('')
  console.log('🎉 Seed concluído com sucesso!')
  console.log('')
  console.log('Credenciais de acesso:')
  console.log('  Admin LC Saúde → luciana@lcsaude.com.br / lcsaude@2026')
  console.log('  Cliente Demo   → gestao@hospdilsongodinho.com.br / dilson@2026')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
