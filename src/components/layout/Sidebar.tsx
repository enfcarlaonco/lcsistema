'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, Plus, LogOut, TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

        {/* LC Saúde — Dashboard */}
        {isLC && (
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname === '/dashboard'
                ? 'bg-brand-50 text-brand-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <LayoutDashboard size={16} className="flex-shrink-0" />
            LC Saúde
          </Link>
        )}

        {/* Financeiro — em breve */}
        {isLC && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 cursor-not-allowed select-none">
            <TrendingUp size={16} className="flex-shrink-0" />
            <span>Financeiro</span>
            <span className="ml-auto text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">em breve</span>
          </div>
        )}

        {/* Divisor */}
        <div className="pt-3 pb-1">
          <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Clientes
          </p>
        </div>

        {/* Novo cliente — só LC */}
        {isLC && (
          <Link
            href="/dashboard/clientes/novo"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname === '/dashboard/clientes/novo'
                ? 'bg-brand-50 text-brand-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Plus size={16} className="flex-shrink-0" />
            Novo cliente
          </Link>
        )}

        {/* Lista de clientes */}
        <Link
          href="/dashboard/clientes"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
            pathname.startsWith('/dashboard/clientes') && pathname !== '/dashboard/clientes/novo'
              ? 'bg-brand-50 text-brand-600 font-medium'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Users size={16} className="flex-shrink-0" />
          Clientes
        </Link>

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

