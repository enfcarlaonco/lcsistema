'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, User, Building2, MapPin, Phone, CheckCircle } from 'lucide-react'

const tiposServico = [
  { value: 'HEMODIALISE',        label: 'Hemodiálise' },
  { value: 'DIALISE_PERITONEAL', label: 'Diálise Peritoneal' },
  { value: 'TRANSPLANTE_RENAL',  label: 'Transplante Renal' },
  { value: 'AMBULATORIO_NEFRO',  label: 'Ambulatório de Nefrologia' },
  { value: 'MISTO',              label: 'Misto' },
]

const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const perfisDiagnostico = [
  { value: 'CONFORMIDADE', label: 'Conformidade regulatória (RDC 11, PT 389, NR-32)' },
  { value: 'ACREDITACAO',  label: 'Conformidade + Trilha ONA (acreditação)' },
]

export default function NovoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState<{ clienteId: string; emailEnviado: boolean; nomeGestor: string } | null>(null)

  const [form, setForm] = useState({
    // Dados do serviço
    nome:               '',
    cnpj:               '',
    cnes:               '',
    tipo_servico:       'HEMODIALISE',
    cidade:             '',
    estado:             'MG',
    telefone:           '',
    email_contato:      '',
    perfil_diagnostico: 'CONFORMIDADE',

    // Dados do contrato
    data_inicio:        '',
    data_fim:           '',
    total_horas:        '',
    horas_presenciais:  '',
    horas_online:       '',
    valor_total:        '',

    // Dados do gestor (usuário que receberá o acesso)
    gestor_nome:        '',
    gestor_email:       '',
    gestor_cargo:       '',
  })

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const res = await fetch('/api/clientes/novo-completo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao cadastrar cliente.'); return }
      setSucesso({
        clienteId:    data.cliente_id,
        emailEnviado: data.email_enviado,
        nomeGestor:   form.gestor_nome,
      })
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Tela de sucesso ────────────────────────────────────────────────────────
  if (sucesso) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Cliente cadastrado com sucesso!</h1>
        {sucesso.emailEnviado ? (
          <p className="text-sm text-gray-500 mb-6">
            Um e-mail foi enviado para <strong>{form.gestor_email}</strong> com as credenciais de acesso de <strong>{sucesso.nomeGestor}</strong>.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-6">
            Cliente cadastrado. O envio de e-mail não foi possível — configure o acesso manualmente.
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/dashboard/clientes/${sucesso.clienteId}`)}
            className="btn-primary"
          >
            Abrir ficha do cliente
          </button>
          <button onClick={() => router.push('/dashboard/clientes')} className="btn-secondary">
            Ver todos os clientes
          </button>
        </div>
      </div>
    )
  }

  // ── Formulário ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Novo cliente</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Após o cadastro, o sistema enviará automaticamente o acesso ao gestor do contrato.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Identificação do serviço ── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Building2 size={15} className="text-brand-500" />
            <h3 className="text-sm font-medium text-gray-700">Identificação do serviço</h3>
          </div>

          <div>
            <label className="label">Nome do serviço *</label>
            <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)}
              className="input" placeholder="Hospital / Clínica de Diálise..." required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">CNPJ *</label>
              <input type="text" value={form.cnpj} onChange={e => set('cnpj', e.target.value)}
                className="input" placeholder="00.000.000/0001-00" required />
            </div>
            <div>
              <label className="label">CNES</label>
              <input type="text" value={form.cnes} onChange={e => set('cnes', e.target.value)}
                className="input" placeholder="0000000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de serviço *</label>
              <select value={form.tipo_servico} onChange={e => set('tipo_servico', e.target.value)} className="input">
                {tiposServico.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Perfil de diagnóstico *</label>
              <select value={form.perfil_diagnostico} onChange={e => set('perfil_diagnostico', e.target.value)} className="input">
                {perfisDiagnostico.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Localização e contato ── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <MapPin size={15} className="text-brand-500" />
            <h3 className="text-sm font-medium text-gray-700">Localização e contato</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">Cidade</label>
              <input type="text" value={form.cidade} onChange={e => set('cidade', e.target.value)}
                className="input" placeholder="Cidade" />
            </div>
            <div>
              <label className="label">Estado</label>
              <select value={form.estado} onChange={e => set('estado', e.target.value)} className="input">
                {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Telefone</label>
              <input type="text" value={form.telefone} onChange={e => set('telefone', e.target.value)}
                className="input" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="label">E-mail de contato do serviço</label>
              <input type="email" value={form.email_contato} onChange={e => set('email_contato', e.target.value)}
                className="input" placeholder="contato@hospital.com.br" />
            </div>
          </div>
        </div>

        {/* ── Contrato ── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Phone size={15} className="text-brand-500" />
            <h3 className="text-sm font-medium text-gray-700">Contrato de consultoria</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data de início *</label>
              <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)}
                className="input" required />
            </div>
            <div>
              <label className="label">Data de término *</label>
              <input type="date" value={form.data_fim} onChange={e => set('data_fim', e.target.value)}
                className="input" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor total (R$) *</label>
              <input type="number" value={form.valor_total} onChange={e => set('valor_total', e.target.value)}
                className="input" placeholder="138400" required min="0" step="0.01" />
            </div>
            <div>
              <label className="label">Total de horas *</label>
              <input type="number" value={form.total_horas} onChange={e => set('total_horas', e.target.value)}
                className="input" placeholder="346" required min="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Horas presenciais</label>
              <input type="number" value={form.horas_presenciais} onChange={e => set('horas_presenciais', e.target.value)}
                className="input" placeholder="90" min="0" />
            </div>
            <div>
              <label className="label">Horas online</label>
              <input type="number" value={form.horas_online} onChange={e => set('horas_online', e.target.value)}
                className="input" placeholder="92" min="0" />
            </div>
          </div>
        </div>

        {/* ── Gestor do contrato ── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <User size={15} className="text-brand-500" />
            <h3 className="text-sm font-medium text-gray-700">Gestor do contrato</h3>
            <span className="text-xs text-gray-400">— receberá o acesso por e-mail</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome completo *</label>
              <input type="text" value={form.gestor_nome} onChange={e => set('gestor_nome', e.target.value)}
                className="input" placeholder="Dr. João da Silva" required />
            </div>
            <div>
              <label className="label">Cargo</label>
              <input type="text" value={form.gestor_cargo} onChange={e => set('gestor_cargo', e.target.value)}
                className="input" placeholder="Diretor técnico, Gerente..." />
            </div>
          </div>

          <div>
            <label className="label">E-mail do gestor *</label>
            <input type="email" value={form.gestor_email} onChange={e => set('gestor_email', e.target.value)}
              className="input" placeholder="gestor@hospital.com.br" required />
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Mail size={11} />
              Login e senha provisória serão enviados para este e-mail automaticamente.
            </p>
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">{erro}</div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? (
              <>
                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                Cadastrando...
              </>
            ) : (
              <>
                <Mail size={14} />
                Cadastrar e enviar acesso
              </>
            )}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

