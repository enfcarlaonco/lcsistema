'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, FileText, BarChart2,
  ClipboardList, AlertTriangle, LogOut, Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/questionarios', label: 'Questionários', icon: ClipboardList },
  { href: '/dashboard/documentos', label: 'Documentos', icon: FileText },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: BarChart2 },
  { href: '/dashboard/acoes', label: 'Ações corretivas', icon: AlertTriangle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isLC = session?.user.perfil === 'ADMIN_LC' || session?.user.perfil === 'CONSULTOR_LC'

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">LC</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">LC Sistema</p>
            <p className="text-xs text-gray-400">Nefrologia</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-brand-50 text-brand-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Usuário */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-gray-900 truncate">{session?.user.name}</p>
          <p className="text-xs text-gray-400 truncate">
            {isLC ? 'LC Saúde' : session?.user.clienteNome ?? ''}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-600
                     hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
