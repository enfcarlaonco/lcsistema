'use client'

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

interface Props {
  score: number
  label: string
  size?: number
}

export function ScoreGauge({ score, label, size = 140 }: Props) {
  const color = score >= 85 ? '#3B6D11' : score >= 60 ? '#BA7517' : '#A32D2D'
  const bg = score >= 85 ? '#EAF3DE' : score >= 60 ? '#FAEEDA' : '#FCEBEB'
  const classificacao = score >= 85 ? 'Conforme' : score >= 60 ? 'Parcial' : 'Não conforme'

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="65%"
            outerRadius="100%"
            data={[{ value: score, fill: color }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background={{ fill: bg }} cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', textAlign: 'center'
        }}>
          <p style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1 }}>{score}</p>
          <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>/ 100</p>
        </div>
      </div>
      <p className="text-xs font-medium text-gray-700 mt-1">{label}</p>
      <span className="text-xs mt-0.5" style={{ color }}>{classificacao}</span>
    </div>
  )
}
