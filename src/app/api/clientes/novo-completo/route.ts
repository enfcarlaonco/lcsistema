// src/app/api/clientes/novo-completo/route.ts
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

function gerarSenha(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()

    const {
      // Serviço
      nome, cnpj, cnes, tipo_servico, tipos_servico, cidade, estado,
      telefone, email_contato, perfil_diagnostico,
      // Contrato
      data_inicio, data_fim, total_horas, horas_presenciais,
      horas_online, valor_total,
      // Gestor
      gestor_nome, gestor_email,
    } = body

    if (!nome || !cnpj || !gestor_nome || !gestor_email || !data_inicio || !data_fim || !valor_total) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
    }

    // Verifica se CNPJ já existe
    const existente = await prisma.cliente.findFirst({ where: { cnpj } })
    if (existente) {
      return NextResponse.json({ error: 'Já existe um cliente com esse CNPJ.' }, { status: 409 })
    }

    const senhaTemporaria = gerarSenha()
    const senhaHash = await bcrypt.hash(senhaTemporaria, 12)

    // Cria tudo em transação
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Cria o cliente
      const cliente = await tx.cliente.create({
        data: {
          nome,
          cnpj,
          cnes:               cnes || null,
          tipo_servico:       tipo_servico as any,
          tipos_servico:      (tipos_servico ?? [tipo_servico]) as any,
          cidade:             cidade || null,
          estado:             estado || null,
          telefone:           telefone || null,
          email_contato:      email_contato || null,
          perfil_diagnostico: (perfil_diagnostico ?? 'CONFORMIDADE') as any,
          status:             'ATIVO',
        },
      })

      // 2. Cria o contrato
      const contrato = await tx.contrato.create({
        data: {
          cliente_id:         cliente.id,
          data_inicio:        new Date(data_inicio),
          data_fim:           new Date(data_fim),
          total_horas:        Number(total_horas),
          horas_presenciais:  Number(horas_presenciais || 0),
          horas_online:       Number(horas_online || 0),
          horas_preparo:      Math.max(0, Number(total_horas) - Number(horas_presenciais || 0) - Number(horas_online || 0)),
          valor_total:        Number(valor_total),
          status:             'ATIVO',
          responsavel_lc_id:  session.user.id,
          responsavel_cliente: gestor_nome,
        },
      })

      // 3. Cria o usuário gestor
      const usuario = await tx.usuario.create({
        data: {
          nome:           gestor_nome,
          email:          gestor_email,
          senha_hash:     senhaHash,
          perfil:         'GESTOR_CLIENTE',
          cliente: { connect: { id: cliente.id } },
      },
      })

      return { cliente, contrato, usuario }
    })

    // 4. Envia e-mail com credenciais via Resend
    let emailEnviado = false
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const urlSistema = process.env.NEXTAUTH_URL?.replace('http://localhost:3000', 'https://lcsistema.vercel.app') ?? 'https://lcsistema.vercel.app'

      await resend.emails.send({
        from:    process.env.RESEND_FROM ?? 'onboarding@resend.dev',
        to:      gestor_email,
        subject: `Bem-vindo ao LC Sistema — Acesso ao sistema de gestão`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #111827; max-width: 560px; margin: 0 auto; padding: 24px;">

  <div style="background: #1B3A5C; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px;">
    <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0;">LC Saúde</p>
    <p style="color: #93c5fd; font-size: 13px; margin: 4px 0 0;">Consultoria em Nefrologia</p>
  </div>

  <p style="font-size: 15px; margin-bottom: 8px;">Olá, <strong>${gestor_nome}</strong>!</p>

  <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
    Seu acesso ao <strong>LC Sistema</strong> foi criado. Utilize as credenciais abaixo para entrar na plataforma de gestão do <strong>${nome}</strong>.
  </p>

  <div style="background: #f3f4f6; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
    <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">Suas credenciais de acesso:</p>
    <p style="margin: 4px 0; font-size: 14px;"><strong>Login:</strong> <span style="color: #1d4ed8;">${gestor_email}</span></p>
    <p style="margin: 4px 0; font-size: 14px;"><strong>Senha provisória:</strong> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 8px; border-radius: 4px;">${senhaTemporaria}</span></p>
  </div>

  <p style="font-size: 13px; color: #6b7280; margin-bottom: 24px;">
    ⚠️ Por segurança, você será solicitado a criar uma nova senha no primeiro acesso.
  </p>

  <a href="${urlSistema}/auth/login" style="display: inline-block; background: #1d4ed8; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
    Acessar o sistema →
  </a>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;">

  <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
    Este e-mail foi enviado automaticamente pela LC Saúde Consultoria em Nefrologia.<br>
    Em caso de dúvidas, entre em contato com sua consultora.
  </p>

</body>
</html>
        `.trim(),
      })
      emailEnviado = true
    } catch (emailError) {
      console.error('[Resend] Erro ao enviar e-mail:', emailError)
      // Não falha a requisição por erro de e-mail
    }

    return NextResponse.json({
      sucesso:       true,
      cliente_id:    resultado.cliente.id,
      contrato_id:   resultado.contrato.id,
      email_enviado: emailEnviado,
      mensagem:      emailEnviado
        ? `Cliente cadastrado e e-mail enviado para ${gestor_email}.`
        : `Cliente cadastrado. E-mail não foi enviado — verifique a configuração do Resend.`,
    }, { status: 201 })

  } catch (error) {
    console.error('[POST /api/clientes/novo-completo]', error)
    return NextResponse.json({ error: 'Erro interno ao cadastrar cliente.' }, { status: 500 })
  }
}
