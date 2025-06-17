
-- Criar tabela para controle de estado da migração
CREATE TABLE IF NOT EXISTS public.migration_control (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  is_running BOOLEAN NOT NULL DEFAULT false,
  last_checkpoint JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir registro inicial se não existir
INSERT INTO public.migration_control (is_paused, is_running) 
SELECT false, false
WHERE NOT EXISTS (SELECT 1 FROM public.migration_control);

-- Função para limpar estado corrupto da migração
CREATE OR REPLACE FUNCTION public.reset_migration_state()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpar registros duplicados mantendo apenas o mais recente por arquivo
  DELETE FROM public.migration_progress 
  WHERE id NOT IN (
    SELECT DISTINCT ON (file_name) id
    FROM public.migration_progress
    ORDER BY file_name, started_at DESC NULLS LAST
  );
  
  -- Resetar estados inconsistentes
  UPDATE public.migration_progress 
  SET status = 'pending', processed_count = 0, started_at = NULL, completed_at = NULL
  WHERE status = 'processing' AND completed_at IS NOT NULL;
  
  -- Resetar controle de migração
  UPDATE public.migration_control 
  SET is_paused = false, is_running = false, last_checkpoint = NULL, updated_at = now();
END;
$$;

-- Função para obter próximo arquivo a processar
CREATE OR REPLACE FUNCTION public.get_next_migration_file()
RETURNS TABLE (
  file_name TEXT,
  batch_number INTEGER,
  resume_from INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(mp.file_name, files.file_name) as file_name,
    files.batch_number,
    COALESCE(mp.processed_count, 0) as resume_from
  FROM (
    VALUES 
      ('processed_batch_0-99.json', 0),
      ('processed_batch_100-199.json', 1),
      ('processed_batch_200-299.json', 2),
      ('processed_batch_300-399.json', 3),
      ('processed_batch_400-499.json', 4),
      ('processed_batch_500-599.json', 5),
      ('processed_batch_600-699.json', 6),
      ('processed_batch_700-799.json', 7),
      ('processed_batch_800-899.json', 8),
      ('processed_batch_900-999.json', 9),
      ('processed_batch_1000-1099.json', 10),
      ('processed_batch_1100-1199.json', 11),
      ('processed_batch_1200-1277.json', 12)
  ) AS files(file_name, batch_number)
  LEFT JOIN public.migration_progress mp ON mp.file_name = files.file_name
  WHERE COALESCE(mp.status, 'pending') != 'completed'
  ORDER BY files.batch_number
  LIMIT 1;
END;
$$;

-- Trigger para atualizar updated_at na tabela migration_control
CREATE OR REPLACE FUNCTION public.update_migration_control_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS migration_control_update_trigger ON public.migration_control;
CREATE TRIGGER migration_control_update_trigger
  BEFORE UPDATE ON public.migration_control
  FOR EACH ROW
  EXECUTE FUNCTION public.update_migration_control_timestamp();
