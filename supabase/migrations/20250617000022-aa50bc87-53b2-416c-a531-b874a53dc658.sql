
-- ETAPA 1: Correção do Schema do Banco de Dados

-- 1.1 Adicionar foreign keys e constraints únicas para startup_external_urls
ALTER TABLE startup_external_urls 
ADD CONSTRAINT fk_startup_external_urls_startup_id 
FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE;

-- Adicionar constraint única para startup_id (resolve o erro 42P10)
ALTER TABLE startup_external_urls 
ADD CONSTRAINT unique_startup_external_urls_startup_id 
UNIQUE (startup_id);

-- 1.2 Adicionar foreign keys para startup_team_members
ALTER TABLE startup_team_members 
ADD CONSTRAINT fk_startup_team_members_startup_id 
FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE;

-- Adicionar constraint única para member_id por startup
ALTER TABLE startup_team_members 
ADD CONSTRAINT unique_startup_team_members_startup_member 
UNIQUE (startup_id, member_id);

-- 1.3 Adicionar foreign keys para startup_topics
ALTER TABLE startup_topics 
ADD CONSTRAINT fk_startup_topics_startup_id 
FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE;

-- Adicionar constraint única para topic_id, topic_type por startup
ALTER TABLE startup_topics 
ADD CONSTRAINT unique_startup_topics_startup_topic_type 
UNIQUE (startup_id, topic_id, topic_type);

-- 1.4 Adicionar foreign keys para startup_tags
ALTER TABLE startup_tags 
ADD CONSTRAINT fk_startup_tags_startup_id 
FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE;

-- Adicionar constraint única para tag_name por startup
ALTER TABLE startup_tags 
ADD CONSTRAINT unique_startup_tags_startup_tag 
UNIQUE (startup_id, tag_name);

-- 1.5 Adicionar foreign keys para startup_comments
ALTER TABLE startup_comments 
ADD CONSTRAINT fk_startup_comments_startup_id 
FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE;

-- 1.6 Adicionar índices para otimizar performance
CREATE INDEX IF NOT EXISTS idx_startups_company_id ON startups(company_id);
CREATE INDEX IF NOT EXISTS idx_startups_industry ON startups(industry);
CREATE INDEX IF NOT EXISTS idx_startups_funding_tier ON startups(funding_tier);
CREATE INDEX IF NOT EXISTS idx_startups_kanban ON startups(show_in_kanban, kanban_column);

CREATE INDEX IF NOT EXISTS idx_startup_external_urls_startup_id ON startup_external_urls(startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_team_members_startup_id ON startup_team_members(startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_topics_startup_id ON startup_topics(startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_topics_type ON startup_topics(topic_type);
CREATE INDEX IF NOT EXISTS idx_startup_tags_startup_id ON startup_tags(startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_comments_startup_id ON startup_comments(startup_id);

-- 1.7 Criar tabela para controle de estado da migração
CREATE TABLE IF NOT EXISTS migration_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  processed_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  batch_number INTEGER DEFAULT 1
);

-- Adicionar índice para controle de progresso
CREATE INDEX IF NOT EXISTS idx_migration_progress_status ON migration_progress(status);
CREATE INDEX IF NOT EXISTS idx_migration_progress_file ON migration_progress(file_name);
