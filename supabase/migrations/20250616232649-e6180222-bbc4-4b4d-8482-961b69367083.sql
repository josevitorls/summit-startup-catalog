
-- ETAPA 1: Limpeza completa do banco de dados
-- Deletar todos os dados existentes em ordem correta (respeitando foreign keys)

-- Limpar tabelas relacionadas primeiro
DELETE FROM startup_tags;
DELETE FROM startup_topics;
DELETE FROM startup_team_members;
DELETE FROM startup_external_urls;
DELETE FROM startup_comments;

-- Limpar tabela principal de startups
DELETE FROM startups;

-- Limpar tabela de progresso de migração
DELETE FROM migration_progress;

-- Limpar tabelas de referência (manter estrutura, limpar dados)
DELETE FROM industries WHERE name NOT IN ('Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce');
DELETE FROM funding_tiers WHERE name NOT IN ('Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Not specified');

-- Reset das sequences se necessário
SELECT setval(pg_get_serial_sequence('startups', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('startup_tags', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('startup_topics', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('startup_team_members', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('startup_external_urls', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('startup_comments', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('migration_progress', 'id'), 1, false);
