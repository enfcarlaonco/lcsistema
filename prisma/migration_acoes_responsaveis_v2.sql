CREATE TABLE IF NOT EXISTS "acoes_responsaveis" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "acao_id"   TEXT NOT NULL,
  "agente"    "AgenteResponsavel" NOT NULL,
  "criado_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "acoes_responsaveis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "acoes_responsaveis_acao_id_fkey"
    FOREIGN KEY ("acao_id") REFERENCES "acoes_corretivas"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "acoes_responsaveis_acao_agente_key"
  ON "acoes_responsaveis"("acao_id", "agente");

CREATE INDEX IF NOT EXISTS "acoes_responsaveis_acao_id_idx"
  ON "acoes_responsaveis"("acao_id");

ALTER TABLE "acoes_corretivas"
  ADD COLUMN IF NOT EXISTS "historico"       JSONB,
  ADD COLUMN IF NOT EXISTS "evidencia_texto" TEXT,
  ADD COLUMN IF NOT EXISTS "atualizado_por"  TEXT;
