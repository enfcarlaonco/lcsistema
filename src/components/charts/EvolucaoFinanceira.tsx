'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Ponto {
  mes: string
  margem: number
  score: number
  taxa_glosa: number
  custo_sessao: number
}

interface Props { dados: Ponto[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-sm">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.dataKey.includes('score') ? p.value : p.dataKey.includes('margem') || p.dataKey.includes('glosa') ? formatPercent(p.value) : formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export function EvolucaoFinanceira({ dados }: Props) {
  if (!dados.length) return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400">
      Nenhum dado financeiro registrado ainda.
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={dados} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine y={15} stroke="#97C459" strokeDasharray="4 4" label={{ value: 'Meta margem', fontSize: 10, fill: '#97C459' }} />
        <Line type="monotone" dataKey="margem" name="Margem %" stroke="#185FA5" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="score" name="Score financeiro" stroke="#3B6D11" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="taxa_glosa" name="Taxa glosa %" stroke="#E24B4A" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
