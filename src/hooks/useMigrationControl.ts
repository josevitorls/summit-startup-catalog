
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
    refetchInterval: 2000, // Polling mais frequente para detectar mudanças
  });
}

export function usePauseMigration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('🛑 Pausando migração...');
      
      const { data: controlData, error: fetchError } = await supabase
        .from('migration_control')
        .select('id')
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('migration_control')
        .update({ is_paused: true })
        .eq('id', controlData.id);

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
      
      // Primeiro, despausar e resetar is_running se necessário
      const { data: controlData, error: fetchError } = await supabase
        .from('migration_control')
        .select('*')
        .single();

      if (fetchError) throw fetchError;

      const { error: unpauseError } = await supabase
        .from('migration_control')
        .update({ 
          is_paused: false,
          is_running: false // Resetar para evitar travamento
        })
        .eq('id', controlData.id);

      if (unpauseError) throw unpauseError;

      // Aguardar um momento para o reset
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Depois, chamar edge function
      console.log('🚀 Chamando edge function para continuar migração...');
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

// Nova função para forçar reset do estado travado
export function useForceUnstuck() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('🚨 Forçando desbloqueio da migração travada...');
      
      // Resetar diretamente o estado de controle
      const { data: controlData, error: fetchError } = await supabase
        .from('migration_control')
        .select('id')
        .single();

      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('migration_control')
        .update({ 
          is_running: false,
          is_paused: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', controlData.id);

      if (error) throw error;
      
      // Aguardar um momento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Chamar migração imediatamente
      const { data: migrationResult, error: migrationError } = await supabase.functions.invoke('migrate-data');
      
      if (migrationError) throw migrationError;
      return migrationResult;
    },
    onSuccess: () => {
      console.log('✅ Migração desbloqueada e retomada');
      queryClient.invalidateQueries({ queryKey: ['migration-control'] });
      queryClient.invalidateQueries({ queryKey: ['migration-progress'] });
    },
  });
}
