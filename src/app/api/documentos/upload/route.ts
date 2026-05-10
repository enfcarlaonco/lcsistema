// src/app/api/documentos/upload/route.ts
// POST — recebe arquivo, sobe para Google Drive, registra no banco
// Avaliação por IA desabilitada temporariamente — aguarda ANTHROPIC_API_KEY
export const dynamic = "force-dynamic"
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadArquivo, criarPastaCliente, detectarMimeType } from '@/lib/google-drive/drive'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const formData = await req.formData()
    const arquivo                = formData.get('arquivo') as File
    const clienteId              = formData.get('clienteId') as string
    const contratoId             = formData.get('contratoId') as string
    const documentoReferenciaId  = formData.get('documentoReferenciaId') as string
    const versao                 = formData.get('versao') as string | null

    if (!arquivo || !clienteId || !contratoId || !documentoReferenciaId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
    }

    // Verifica acesso
    const isLC = ['ADMIN_LC', 'CONSULTOR_LC'].includes(session.user.perfil)
    if (!isLC && session.user.clienteId !== clienteId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
    }

    // Limite de 50MB
    if (arquivo.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Limite: 50MB.' }, { status: 413 })
    }

    // Busca nome do cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, nome: true },
    })
    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })

    // Converte para Buffer
    const arrayBuffer = await arquivo.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = detectarMimeType(arquivo.name)

    // Cria pasta do cliente no Drive (se não existir) e faz upload
    const pastaId = await criarPastaCliente(cliente.nome)
    const nomeNoArquivo = `${Date.now()}_${arquivo.name}`
    const { fileId, webViewLink } = await uploadArquivo({
      nomeArquivo: nomeNoArquivo,
      mimeType,
      buffer,
      pastaId,
    })

    // Registra no banco como ENVIADO — aguarda avaliação
    const docEnviado = await prisma.documentoEnviado.create({
      data: {
        cliente_id:              clienteId,
        contrato_id:             contratoId,
        documento_referencia_id: documentoReferenciaId,
        nome_arquivo:            arquivo.name,
        arquivo_url:             webViewLink,
        versao_informada:        versao ?? null,
        status_documento:        'ENVIADO',
      },
    })

    return NextResponse.json({
      sucesso: true,
      documento_id:  docEnviado.id,
      arquivo_url:   webViewLink,
      drive_file_id: fileId,
      avaliacao: null,
      mensagem: 'Documento enviado com sucesso para o Google Drive. A avaliação será realizada pela consultora LC Saúde.',
    }, { status: 201 })

  } catch (error) {
    console.error('[POST /api/documentos/upload]', error)
    return NextResponse.json({ error: 'Erro ao processar documento.' }, { status: 500 })
  }
}

