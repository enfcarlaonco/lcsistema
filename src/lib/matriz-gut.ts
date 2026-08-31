// src/lib/matriz-gut.ts
// Regras da Matriz GUT — faixas de prioridade e status, extraídas do template
// oficial "Modelo Matriz GUT LC Saude.xlsx" (aba Instruções / Matriz GUT).

export interface FaixaPrioridade {
  min: number
  max: number
  label: string
  cor: string
  bg: string
  leitura: string
}

// 4. INTERPRETAÇÃO DA PONTUAÇÃO (score = Gravidade × Urgência × Tendência, 1–125)
export const FAIXAS_PRIORIDADE_GUT: FaixaPrioridade[] = [
  { min: 1,  max: 15,  label: 'Muito baixa', cor: '#4b5563', bg: '#f3f4f6', leitura: 'Pode ser acompanhada e programada.' },
  { min: 16, max: 35,  label: 'Baixa',       cor: '#1d4ed8', bg: '#eff6ff', leitura: 'Exige atenção, mas não é a primeira prioridade.' },
  { min: 36, max: 60,  label: 'Média',       cor: '#92400e', bg: '#fef3c7', leitura: 'Importante; deve entrar no plano de ação.' },
  { min: 61, max: 89,  label: 'Alta',        cor: '#c2410c', bg: '#ffedd5', leitura: 'Precisa de intervenção prioritária.' },
  { min: 90, max: 125, label: 'Muito alta',  cor: '#b91c1c', bg: '#fef2f2', leitura: 'Crítica; tratar primeiro.' },
]

export function prioridadeGut(score: number): FaixaPrioridade {
  return FAIXAS_PRIORIDADE_GUT.find(f => score >= f.min && score <= f.max)
    ?? FAIXAS_PRIORIDADE_GUT[FAIXAS_PRIORIDADE_GUT.length - 1]
}

export function corGUT(score: number) { return prioridadeGut(score).cor }
export function bgGUT(score: number)  { return prioridadeGut(score).bg }

// Coluna "Status" (validação de lista da planilha oficial)
export const STATUS_GUT_CONFIG: Record<string, { label: string; cor: string; bg: string }> = {
  NAO_INICIADO:          { label: 'Não iniciado',         cor: '#4b5563', bg: '#f3f4f6' },
  EM_ANALISE:            { label: 'Em análise',           cor: '#7e22ce', bg: '#f3e8ff' },
  EM_ANDAMENTO:          { label: 'Em andamento',         cor: '#1d4ed8', bg: '#eff6ff' },
  AGUARDANDO_EVIDENCIA:  { label: 'Aguardando evidência', cor: '#92400e', bg: '#fef3c7' },
  FINALIZADO:            { label: 'Finalizado',           cor: '#15803d', bg: '#f0fdf4' },
  CANCELADO:             { label: 'Cancelado',            cor: '#6b7280', bg: '#f9fafb' },
}

export const STATUS_GUT_DEFAULT = 'NAO_INICIADO'

export function statusGutInfo(status: string) {
  return STATUS_GUT_CONFIG[status] ?? { label: status, cor: '#6b7280', bg: '#f3f4f6' }
}
