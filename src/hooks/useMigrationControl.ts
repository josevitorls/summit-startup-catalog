
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MigrationControlState {
  id: string;
  is_paused: boolean;
  is_running: boolean;
  last_checkpoint?: any;
  created_at: string;
  updated_at: string;
}

export function useMigrationControl() {
  return useQuery({
    queryKey: ['migration-control'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('migration_control')
        .select('*')
        .single();

      if (error) throw error;
      return data as MigrationControlState;
    },
    staleTime: 500,
    refetchInterval: 1000, // Polling mais agressivo
  });
}

export function usePauseMigration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('🛑 Pausando migração...');
      
      const { error } = await supabase
        .from('migration_control')
        .update({ is_paused: true })
        .eq('id', (await supabase.from('migration_control').select('id').single()).data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      console.log('✅ Migração pausada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['migration-control'] });
    },
  });
}

export function useResumeMigration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('▶️ Retomando migração...');
      
      // Primeiro, despausar
      const { error: unpauseError } = await supabase
        .from('migration_control')
        .update({ is_paused: false })
        .eq('id', (await supabase.from('migration_control').select('id').single()).data.id);

      if (unpauseError) throw unpauseError;

      // Depois, chamar edge function
      const { data, error } = await supabase.functions.invoke('migrate-data');
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log('✅ Migração retomada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['migration-control'] });
      queryClient.invalidateQueries({ queryKey: ['migration-progress'] });
    },
  });
}

export function useResetMigration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('🔄 Resetando migração...');
      
      const { error } = await supabase.rpc('reset_migration_state');
      
      if (error) throw error;
    },
    onSuccess: () => {
      console.log('✅ Migração resetada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['migration-control'] });
      queryClient.invalidateQueries({ queryKey: ['migration-progress'] });
      queryClient.invalidateQueries({ queryKey: ['startups'] });
    },
  });
}
