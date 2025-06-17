
-- 1. Limpeza de registros duplicados em startup_external_urls
-- Manter apenas um registro por startup_id (o mais recente)
DELETE FROM startup_external_urls 
WHERE id NOT IN (
  SELECT DISTINCT ON (startup_id) id
  FROM startup_external_urls
  ORDER BY startup_id, created_at DESC
);

-- 2. Limpeza de registros duplicados em startup_team_members
-- Manter apenas um registro por startup_id + member_id (o mais recente)
DELETE FROM startup_team_members 
WHERE id NOT IN (
  SELECT DISTINCT ON (startup_id, member_id) id
  FROM startup_team_members
  ORDER BY startup_id, member_id, created_at DESC
);

-- 3. Limpeza de registros duplicados em startup_topics
-- Manter apenas um registro por startup_id + topic_id + topic_type (o mais recente)
DELETE FROM startup_topics 
WHERE id NOT IN (
  SELECT DISTINCT ON (startup_id, topic_id, topic_type) id
  FROM startup_topics
  ORDER BY startup_id, topic_id, topic_type, created_at DESC
);

-- 4. Limpeza de registros duplicados em startup_tags
-- Manter apenas um registro por startup_id + tag_name (o mais recente)
DELETE FROM startup_tags 
WHERE id NOT IN (
  SELECT DISTINCT ON (startup_id, tag_name) id
  FROM startup_tags
  ORDER BY startup_id, tag_name, created_at DESC
);

-- 5. Verificar integridade dos dados após limpeza
SELECT 
  'startups' as tabela,
  COUNT(*) as total_registros
FROM startups
UNION ALL
SELECT 
  'startup_external_urls' as tabela,
  COUNT(*) as total_registros
FROM startup_external_urls
UNION ALL
SELECT 
  'startup_team_members' as tabela,
  COUNT(*) as total_registros
FROM startup_team_members
UNION ALL
SELECT 
  'startup_topics' as tabela,
  COUNT(*) as total_registros
FROM startup_topics
UNION ALL
SELECT 
  'startup_tags' as tabela,
  COUNT(*) as total_registros
FROM startup_tags;
