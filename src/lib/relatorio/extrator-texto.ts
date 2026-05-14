// src/lib/relatorio/extrator-texto.ts
// Extrai texto de documentos para análise pela IA
// Suporta PDF, Word (.docx), Excel (.xlsx), imagens

export async function extrairTexto(
  buffer: Buffer,
  mimeType: string,
  nomeArquivo: string
): Promise<string> {

  // PDF — extrai texto via pdf-parse
  if (mimeType === 'application/pdf') {
    return extrairPDF(buffer)
  }

  // Word (.docx)
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword') {
    return extrairDocx(buffer)
  }

  // Excel (.xlsx)
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel') {
    return extrairXlsx(buffer)
  }

  // Imagens — retorna descrição para a IA avaliar pelo nome e contexto
  if (mimeType.startsWith('image/')) {
    return extrairImagem(buffer, mimeType, nomeArquivo)
  }

  // Arquivo desconhecido — retorna apenas o nome
  return `[Arquivo: ${nomeArquivo} — tipo ${mimeType}]`
}

async function extrairPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse')
    const parseFn = (pdfParse as any).default ?? pdfParse
    const data = await parseFn(buffer)
    return data.text.slice(0, 15000) // limita a 15k chars para a IA
  } catch (e) {
    console.warn('Erro ao extrair PDF:', e)
    return '[PDF — não foi possível extrair o texto]'
  }
}

async function extrairDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value.slice(0, 15000)
  } catch (e) {
    console.warn('Erro ao extrair DOCX:', e)
    return '[DOCX — não foi possível extrair o texto]'
  }
}

async function extrairXlsx(buffer: Buffer): Promise<string> {
  try {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    let texto = ''
    for (const sheetName of workbook.SheetNames.slice(0, 5)) {
      const sheet = workbook.Sheets[sheetName]
      const csv = XLSX.utils.sheet_to_csv(sheet)
      texto += `[Planilha: ${sheetName}]\n${csv}\n\n`
      if (texto.length > 12000) break
    }
    return texto.slice(0, 15000)
  } catch (e) {
    console.warn('Erro ao extrair XLSX:', e)
    return '[XLSX — não foi possível extrair o texto]'
  }
}

async function extrairImagem(buffer: Buffer, mimeType: string, nomeArquivo: string): Promise<string> {
  try {
    // Envia a imagem para a API Anthropic com visão
    const base64 = buffer.toString('base64')
    const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Este é um documento de saúde chamado "${nomeArquivo}". Transcreva todo o texto visível nesta imagem, mantendo a estrutura original. Se for um documento escaneado, transcreva fielmente o conteúdo.`,
            },
          ],
        }],
      }),
    })

    if (!response.ok) return `[Imagem: ${nomeArquivo}]`
    const data = await response.json()
    return data.content[0]?.text ?? `[Imagem: ${nomeArquivo}]`
  } catch (e) {
    return `[Imagem: ${nomeArquivo} — OCR não disponível]`
  }
}
