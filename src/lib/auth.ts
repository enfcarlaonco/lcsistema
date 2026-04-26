import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { cliente: { select: { id: true, nome: true } } },
        })

        if (!usuario || !usuario.ativo) return null

        const senhaValida = await bcrypt.compare(credentials.password, usuario.senha_hash)
        if (!senhaValida) return null

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          clienteId: usuario.cliente_id,
          clienteNome: usuario.cliente?.nome ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.perfil = (user as any).perfil
        token.clienteId = (user as any).clienteId
        token.clienteNome = (user as any).clienteNome
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.perfil = token.perfil as string
        session.user.clienteId = token.clienteId as string | null
        session.user.clienteNome = token.clienteNome as string | null
      }
      return session
    },
  },
}
