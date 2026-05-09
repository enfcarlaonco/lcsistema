// ══════════════════════════════════════════════════════════════════════
// INSTRUÇÕES — o que mudar no prisma/schema.prisma
// ══════════════════════════════════════════════════════════════════════
//
// 1. Adicione os 3 novos enums junto com os outros enums do arquivo
// 2. Substitua o model DocumentoReferencia pelo novo abaixo
// 3. Adicione o campo perfil_diagnostico no model Cliente
// 4. Adicione os 2 novos models no final do arquivo
//
// ══════════════════════════════════════════════════════════════════════

// ── NOVOS ENUMS (adicionar junto com os outros enums) ─────────────────

/*
enum PerfilDiagnostico {
  CONFORMIDADE
  ACREDITACAO
}

enum GrauNecessidade {
  LEGISLACAO
  ACREDITACAO
  MELHORES_PRATICAS
}

enum PerfilRequerido {
  CONFORMIDADE
  ACREDITACAO
  AMBOS
}
*/

// ── MODEL Cliente — adicionar campo perfil_diagnostico ────────────────
// Encontre o model Cliente e adicione esta linha:
//
//   perfil_diagnostico   PerfilDiagnostico  @default(CONFORMIDADE)

// ── MODEL DocumentoReferencia — substituir pelo novo ─────────────────

/*
model DocumentoReferencia {
  id                    String            @id @default(uuid())
  codigo                String?           @unique
  titulo                String?
  nome_documento        String
  tipo_documento_id     String
  categoria             String
  area                  String?
  tema                  String?
  grau_necessidade      GrauNecessidade   @default(LEGISLACAO)
  perfil_requerido      PerfilRequerido   @default(AMBOS)
  legislacao_ref        String?
  ona_requisito         String?
  processo_relacionado  String?
  setor                 String?
  obrigatorio           Boolean           @default(true)
  ativo                 Boolean           @default(true)
  observacoes           String?

  tipo_documento        TipoDocumento         @relation(fields: [tipo_documento_id], references: [id])
  criterios             CriterioValidacao[]
  modelos_lc            ModeloLC[]
  documentos_enviados   DocumentoEnviado[]

  @@map("documentos_referencia")
}
*/

// ── NOVOS MODELS (adicionar no final do arquivo) ──────────────────────

/*
model MatrizGut {
  id               String    @id @default(uuid())
  cliente_id       String
  contrato_id      String?
  questionario_id  String?
  problema         String
  area             String?
  gravidade        Int
  urgencia         Int
  tendencia        Int
  gut_score        Int       // calculado: G x U x T
  responsavel      String?
  prazo_acao       DateTime?
  status           String    @default("PENDENTE")
  observacoes      String?
  origem           String    @default("MANUAL")
  nc_id            String?
  documento_ref_id String?
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt

  cliente          Cliente   @relation(fields: [cliente_id], references: [id], onDelete: Cascade)

  @@index([cliente_id])
  @@index([gut_score])
  @@map("matriz_gut")
}

model ChecklistOna {
  id               String    @id @default(uuid())
  cliente_id       String
  contrato_id      String?
  ona_id           Int
  documento_base   String
  secao            String?
  requisito        String?
  descricao        String
  categoria        String?
  item_verificacao String?
  criterios        String?
  status           String    @default("NAO_AVALIADO")
  responsavel      String?
  local_evidencia  String?
  data_verificacao DateTime?
  proxima_acao     String?
  observacoes      String?
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt

  cliente          Cliente   @relation(fields: [cliente_id], references: [id], onDelete: Cascade)

  @@unique([cliente_id, ona_id])
  @@index([cliente_id])
  @@index([status])
  @@map("checklist_ona")
}
*/
