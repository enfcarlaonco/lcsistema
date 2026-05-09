UPDATE "regras_nao_conformidade" SET prazo_dias = 90 WHERE codigo = 'M11_B0_01';
UPDATE "regras_nao_conformidade" SET nivel_nc = 'NC_III', prazo_dias = 15 WHERE codigo = 'M11_B1_04';
UPDATE "regras_nao_conformidade" SET prazo_dias = 10 WHERE codigo = 'M11_B1_09';
UPDATE "dimensoes_validacao" SET peso_percentual = 10 WHERE nome_dimensao = 'Existência';
UPDATE "dimensoes_validacao" SET peso_percentual = 40 WHERE nome_dimensao = 'Estrutura';
UPDATE "dimensoes_validacao" SET peso_percentual = 50 WHERE nome_dimensao = 'Aplicabilidade';
UPDATE "dimensoes_validacao" SET peso_percentual = 0, ativo = false WHERE nome_dimensao = 'Impacto';
