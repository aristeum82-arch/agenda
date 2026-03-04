-- Migration: 0001_add_numero_oficio_sei_to_agendamentos.sql
-- Objetivo:
-- 1) Adicionar a coluna `numero_oficio_sei` na tabela `agendamentos`.
-- 2) Criar índice único parcial para garantir unicidade quando o campo estiver preenchido.
-- NOTA: Esta migration NÃO remove o campo antigo do perfil nem tenta migrar valores automaticamente.
-- Se houver valores antigos em `usuarios_info.numero_oficio_sei`, avalie a migração manual antes de remover a coluna do perfil.

BEGIN;

-- 1) Adiciona coluna (NULLABLE para não quebrar filas existentes)
ALTER TABLE agendamentos ADD COLUMN numero_oficio_sei TEXT;

-- 2) Índice único parcial para evitar duplicatas quando preenchido
CREATE UNIQUE INDEX IF NOT EXISTS idx_agendamentos_numero_oficio_sei_unique
ON agendamentos(numero_oficio_sei)
WHERE numero_oficio_sei IS NOT NULL;

COMMIT;

