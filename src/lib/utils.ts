import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMMM/yyyy', { locale: ptBR })
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-success-600'
  if (score >= 60) return 'text-warning-600'
  return 'text-danger-600'
}

export function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-success-50 text-success-600'
  if (score >= 60) return 'bg-warning-50 text-warning-600'
  return 'bg-danger-50 text-danger-600'
}

export function getPrioridadeColor(prioridade: string): string {
  const map: Record<string, string> = {
    CRITICA: 'bg-danger-50 text-danger-600',
    ALTA: 'bg-warning-50 text-warning-600',
    MODERADA: 'bg-brand-50 text-brand-600',
    BAIXA: 'bg-gray-100 text-gray-600',
  }
  return map[prioridade] ?? 'bg-gray-100 text-gray-600'
}
