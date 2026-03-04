-- Migration: 0002_drop_numero_oficio_sei_from_usuarios_info.sql
-- Objetivo: Após revisão e migração de dados, remover a coluna numero_oficio_sei de usuarios_info.
-- IMPORTANTE: Execute somente após validar que todos os SEIs necessários foram migrados para agendamentos.

BEGIN;

-- Remover coluna (algumas engines SQLite exigem recriar tabela; aqui mostramos comando padrão para engines que suportam)
ALTER TABLE usuarios_info DROP COLUMN numero_oficio_sei;

COMMIT;

