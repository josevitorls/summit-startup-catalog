
-- Reset imediato do estado de migração travada
UPDATE migration_control 
SET is_running = false, 
    is_paused = false, 
    updated_at = now()
WHERE id IN (SELECT id FROM migration_control LIMIT 1);

-- Verificar se há arquivos que precisam ser processados
UPDATE migration_progress 
SET status = 'pending'
WHERE status = 'processing' AND completed_at IS NULL;
