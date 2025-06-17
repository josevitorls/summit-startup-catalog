
-- Primeiro, limpar duplicados manualmente mantendo apenas o mais recente
DELETE FROM public.migration_progress 
WHERE id NOT IN (
  SELECT DISTINCT ON (file_name) id
  FROM public.migration_progress
  ORDER BY file_name, started_at DESC NULLS LAST
);

-- Agora adicionar o constraint único
ALTER TABLE public.migration_progress 
ADD CONSTRAINT unique_file_name UNIQUE (file_name);

-- Resetar estado da migração
UPDATE public.migration_control 
SET is_paused = false, is_running = false, last_checkpoint = NULL, updated_at = now();

-- Verificar estado limpo
SELECT COUNT(*) as total_progress_records FROM public.migration_progress;
SELECT COUNT(*) as total_startups FROM public.startups;
SELECT file_name, status, processed_count, total_count 
FROM public.migration_progress 
ORDER BY file_name;
