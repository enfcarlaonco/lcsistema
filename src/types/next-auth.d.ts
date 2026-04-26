import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      perfil: string
      clienteId: string | null
      clienteNome: string | null
    }
  }
}
