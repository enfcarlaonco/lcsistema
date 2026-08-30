import { z } from 'zod'

export const clienteSchema = z.object({
  nome: z.string().min(3, 'Nome obrigatório'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  cnes: z.string().optional(),
  tipo_servico: z.enum(['HEMODIALISE','DIALISE_PERITONEAL','TRANSPLANTE_RENAL','AMBULATORIO_NEFRO','MISTO']),
  cidade: z.string().optional(),
  estado: z.string().length(2).optional(),
  telefone: z.string().optional(),
  email_contato: z.string().email().optional().or(z.literal('')),
  perfil_diagnostico: z.enum(['CONFORMIDADE', 'ACREDITACAO']).optional(),
})

export const contratoSchema = z.object({
  cliente_id: z.string().uuid(),
  data_inicio: z.string(),
  data_fim: z.string(),
  total_horas: z.number().positive(),
  horas_presenciais: z.number().min(0),
  horas_online: z.number().min(0),
  horas_preparo: z.number().min(0),
  valor_total: z.number().positive(),
  responsavel_cliente: z.string().optional(),
  observacoes: z.string().optional(),
})

export const dadosFinanceirosSchema = z.object({
  cliente_id: z.string().uuid(),
  contrato_id: z.string(),
  mes_referencia: z.string(),
  pacientes: z.number().int().positive(),
  sessoes_realizadas: z.number().int().positive(),
  sessoes_faturadas: z.number().int().min(0),
  sessoes_perdidas: z.number().int().min(0).default(0),
  faturamento_bruto: z.number().positive(),
  total_glosas: z.number().min(0).default(0),
  custo_insumos: z.number().min(0),
  custo_mao_obra: z.number().min(0),
  custo_manutencao: z.number().min(0).default(0),
  custo_agua: z.number().min(0).default(0),
  outros_custos: z.number().min(0).default(0),
  maquinas: z.number().int().positive(),
  turnos_dia: z.number().int().min(1).max(4),
  dias_funcionamento: z.number().int().min(1).max(31),
  fonte_pagadora: z.enum(['SUS','CONVENIO','MISTO']).default('SUS'),
})

export const avaliacaoDocumentoSchema = z.object({
  cliente_id: z.string().uuid(),
  contrato_id: z.string().uuid(),
  documento_enviado_id: z.string().uuid(),
  observacao_geral: z.string().optional(),
  criterios: z.array(z.object({
    criterio_validacao_id: z.string().uuid(),
    dimensao: z.enum(['Existência','Estrutura','Aplicabilidade','Impacto']),
    peso: z.number().min(0).max(100),
    resposta: z.enum(['SIM','PARCIAL','NAO','NAO_SE_APLICA']),
    obrigatorio: z.boolean(),
    comentario: z.string().optional(),
  }))
})

export type ClienteInput = z.infer<typeof clienteSchema>
export type ContratoInput = z.infer<typeof contratoSchema>
export type DadosFinanceirosInput = z.infer<typeof dadosFinanceirosSchema>
export type AvaliacaoDocumentoInput = z.infer<typeof avaliacaoDocumentoSchema>
