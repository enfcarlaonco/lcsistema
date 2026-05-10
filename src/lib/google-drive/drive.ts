// src/lib/google-drive/drive.ts
// Serviço de integração com Google Drive via conta de serviço

import { google } from 'googleapis'
import { Readable } from 'stream'

const SCOPES = ['https://www.googleapis.com/auth/drive']

function getAuth() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: SCOPES,
  })
}

export async function uploadArquivo({
  nomeArquivo,
  mimeType,
  buffer,
  pastaId,
}: {
  nomeArquivo: string
  mimeType: string
  buffer: Buffer
  pastaId?: string
}): Promise<{ fileId: string; webViewLink: string }> {
  const auth = getAuth()
  const drive = google.drive({ version: 'v3', auth })

  const stream = Readable.from(buffer)

  const res = await drive.files.create({
    requestBody: {
      name: nomeArquivo,
      parents: [pastaId ?? process.env.GOOGLE_DRIVE_FOLDER_ID ?? ''],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink',
  })

  // Torna o arquivo acessível para leitura por qualquer pessoa com o link
  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  })

  return {
    fileId: res.data.id!,
    webViewLink: res.data.webViewLink!,
  }
}

export async function criarPastaCliente(nomeCliente: string): Promise<string> {
  const auth = getAuth()
  const drive = google.drive({ version: 'v3', auth })

  // Verifica se a pasta do cliente já existe
  const busca = await drive.files.list({
    q: `name='${nomeCliente}' and mimeType='application/vnd.google-apps.folder' and '${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id, name)',
  })

  if (busca.data.files && busca.data.files.length > 0) {
    return busca.data.files[0].id!
  }

  // Cria nova pasta para o cliente
  const pasta = await drive.files.create({
    requestBody: {
      name: nomeCliente,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID ?? ''],
    },
    fields: 'id',
  })

  return pasta.data.id!
}

export async function excluirArquivo(fileId: string): Promise<void> {
  const auth = getAuth()
  const drive = google.drive({ version: 'v3', auth })
  await drive.files.delete({ fileId })
}

export function detectarMimeType(nomeArquivo: string): string {
  const ext = nomeArquivo.split('.').pop()?.toLowerCase()
  const mapa: Record<string, string> = {
    pdf:  'application/pdf',
    doc:  'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls:  'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png:  'image/png',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    gif:  'image/gif',
    webp: 'image/webp',
  }
  return mapa[ext ?? ''] ?? 'application/octet-stream'
}
