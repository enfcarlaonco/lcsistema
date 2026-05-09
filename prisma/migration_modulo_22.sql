-- prisma/migration_modulo_22.sql
-- Migration completa para o Módulo 2.2 — Avaliação Documental
-- Execute: npx prisma db execute --file prisma/migration_modulo_22.sql

-- ══════════════════════════════════════════════════════════════════════
-- 1. Enum PerfilDiagnostico
-- ══════════════════════════════════════════════════════════════════════
CREATE TYPE "PerfilDiagnostico" AS ENUM ('CONFORMIDADE', 'ACREDITACAO');

-- ══════════════════════════════════════════════════════════════════════
-- 2. Enum GrauNecessidade
-- ══════════════════════════════════════════════════════════════════════
CREATE TYPE "GrauNecessidade" AS ENUM ('LEGISLACAO', 'ACREDITACAO', 'MELHORES_PRATICAS');

-- ══════════════════════════════════════════════════════════════════════
-- 3. Enum PerfilRequerido
-- ══════════════════════════════════════════════════════════════════════
CREATE TYPE "PerfilRequerido" AS ENUM ('CONFORMIDADE', 'ACREDITACAO', 'AMBOS');

-- ══════════════════════════════════════════════════════════════════════
-- 4. Campo perfil_diagnostico na tabela clientes
-- ══════════════════════════════════════════════════════════════════════
ALTER TABLE "clientes"
  ADD COLUMN IF NOT EXISTS "perfil_diagnostico" "PerfilDiagnostico"
  NOT NULL DEFAULT 'CONFORMIDADE';

-- ══════════════════════════════════════════════════════════════════════
-- 5. Novos campos na tabela documentos_referencia
-- ══════════════════════════════════════════════════════════════════════
ALTER TABLE "documentos_referencia"
  ADD COLUMN IF NOT EXISTS "codigo"           TEXT,
  ADD COLUMN IF NOT EXISTS "titulo"           TEXT,
  ADD COLUMN IF NOT EXISTS "area"             TEXT,
  ADD COLUMN IF NOT EXISTS "tema"             TEXT,
  ADD COLUMN IF NOT EXISTS "grau_necessidade" "GrauNecessidade" NOT NULL DEFAULT 'LEGISLACAO',
  ADD COLUMN IF NOT EXISTS "perfil_requerido" "PerfilRequerido" NOT NULL DEFAULT 'AMBOS',
  ADD COLUMN IF NOT EXISTS "legislacao_ref"   TEXT,
  ADD COLUMN IF NOT EXISTS "ona_requisito"    TEXT;

-- Índice único no código do documento
CREATE UNIQUE INDEX IF NOT EXISTS "documentos_referencia_codigo_key"
  ON "documentos_referencia"("codigo")
  WHERE "codigo" IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════
-- 6. Tabela matriz_gut
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "matriz_gut" (
  "id"               TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "cliente_id"       TEXT         NOT NULL,
  "contrato_id"      TEXT,
  "questionario_id"  TEXT,
  "problema"         TEXT         NOT NULL,
  "area"             TEXT,
  "gravidade"        INTEGER      NOT NULL CHECK ("gravidade" BETWEEN 1 AND 5),
  "urgencia"         INTEGER      NOT NULL CHECK ("urgencia" BETWEEN 1 AND 5),
  "tendencia"        INTEGER      NOT NULL CHECK ("tendencia" BETWEEN 1 AND 5),
  "gut_score"        INTEGER      GENERATED ALWAYS AS ("gravidade" * "urgencia" * "tendencia") STORED,
  "responsavel"      TEXT,
  "prazo_acao"       DATE,
  "status"           TEXT         NOT NULL DEFAULT 'PENDENTE',
  "observacoes"      TEXT,
  "origem"           TEXT         NOT NULL DEFAULT 'MANUAL',
  "nc_id"            TEXT,
  "documento_ref_id" TEXT,
  "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "matriz_gut_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "matriz_gut_cliente_id_fkey"
    FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "matriz_gut_cliente_id_idx" ON "matriz_gut"("cliente_id");
CREATE INDEX IF NOT EXISTS "matriz_gut_gut_score_idx"  ON "matriz_gut"("gut_score" DESC);

-- ══════════════════════════════════════════════════════════════════════
-- 7. Tabela checklist_ona (trilha de acreditação)
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "checklist_ona" (
  "id"               TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "cliente_id"       TEXT         NOT NULL,
  "contrato_id"      TEXT,
  "ona_id"           INTEGER      NOT NULL,
  "documento_base"   TEXT         NOT NULL,
  "secao"            TEXT,
  "requisito"        TEXT,
  "descricao"        TEXT         NOT NULL,
  "categoria"        TEXT,
  "item_verificacao" TEXT,
  "criterios"        TEXT,
  "status"           TEXT         NOT NULL DEFAULT 'NAO_AVALIADO',
  "responsavel"      TEXT,
  "local_evidencia"  TEXT,
  "data_verificacao" DATE,
  "proxima_acao"     TEXT,
  "observacoes"      TEXT,
  "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "checklist_ona_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "checklist_ona_cliente_id_fkey"
    FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "checklist_ona_cliente_ona_item_key"
  ON "checklist_ona"("cliente_id", "ona_id");
CREATE INDEX IF NOT EXISTS "checklist_ona_cliente_id_idx" ON "checklist_ona"("cliente_id");
CREATE INDEX IF NOT EXISTS "checklist_ona_status_idx"     ON "checklist_ona"("status");
