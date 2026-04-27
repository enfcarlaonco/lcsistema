'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props { params: { id: string } }

const tiposServico = [
  { value: 'HEMODIALISE', label: 'Hemodiálise' },
  { value: 'DIALISE_PERITONEAL', label: 'Diálise Peritoneal' },
  { value: 'TRANSPLANTE_RENAL', label: 'Transplante Renal' },
  { value: 'AMBULATORIO_NEFRO', label: 'Ambulatório de Nefrologia' },
  { value: 'MISTO', label: 'Misto' },
]

const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function EditarClientePage({ params }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '', cnpj: '', cnes: '', tipo_servico: 'HEMODIALISE',
    cidade: '', estado: 'MG', telefone: '', email_contato: '',
  })

  useEffect(() => {
    fetch(`/api/clientes/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          nome: data.nome ?? '',
          cnpj: data.cnpj ?? '',
          cnes: data.cnes ?? '',
          tipo_servico: data.tipo_servico ?? 'HEMODIALISE',
          cidade: data.cidade ?? '',
          estado: data.estado ?? 'MG',
          telefone: data.telefone ?? '',
          email_contato: data.email_contato ?? '',
        })
        setCarregando(false)
      })
  }, [params.id])

  function handleChange(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      const res = await fetch(`/api/clientes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao atualizar'); return }
      router.push(`/dashboard/clientes/${params.id}`)
    } catch {
      setErro('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Tem certeza que deseja excluir "${form.nome}"?\n\nEsta ação não pode ser desfeita.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/${params.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao excluir'); setLoading(false); return }
      router.push('/dashboard/clientes')
    } catch {
      setErro('Erro de conexão.')
      setLoading(false)
    }
  }

  if (carregando) return <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Editar cliente</h1>
        <p className="text-sm text-gray-500 mt-0.5">{form.nome}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-4">
          <h3 className="text-sm font-medium text-gray-700 pb-3 border-b border-gray-100">Identificação</h3>
          <div>
            <label className="label">Nome do serviço *</label>
            <input type="text" value={form.nome} onChange={e => handleChange('nome', e.target.value)} className="input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">CNPJ *</label>
              <input type="text" value={form.cnpj} onChange={e => handleChange('cnpj', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">CNES</label>
              <input type="text" value={form.cnes} onChange={e => handleChange('cnes', e.target.value)} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Tipo de serviço *</label>
            <select value={form.tipo_servico} onChange={e => handleChange('tipo_servico', e.target.value)} className="input">
              {tiposServico.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="text-sm font-medium text-gray-700 pb-3 border-b border-gray-100">Localização e contato</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">Cidade</label>
              <input type="text" value={form.cidade} onChange={e => handleChange('cidade', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Estado</label>
              <select value={form.estado} onChange={e => handleChange('estado', e.target.value)} className="input">
                {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Telefone</label>
              <input type="text" value={form.telefone} onChange={e => handleChange('telefone', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Email de contato</label>
              <input type="email" value={form.email_contato} onChange={e => handleChange('email_contato', e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {erro && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">{erro}</div>}

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
          </div>
          <button type="button" onClick={handleDelete} disabled={loading}
            className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
            Excluir cliente
          </button>
        </div>
      </form>
    </div>
  )
}
