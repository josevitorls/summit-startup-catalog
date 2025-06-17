import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Startup } from '../types/startup';

export interface SupabaseStartup {
  id: string;
  company_id: string;
  name: string;
  city?: string;
  province?: string;
  country?: string;
  industry?: string;
  funding_tier?: string;
  elevator_pitch?: string;
  exhibition_date?: string;
  fundraising: boolean;
  meet_investors: boolean;
  startup_women_founder: boolean;
  startup_black_founder: boolean;
  startup_indigenous_founder: boolean;
  endorsed_by?: string;
  logo_url?: string;
  show_in_kanban: boolean;
  kanban_column: string;
  created_at?: string;
  updated_at?: string;
  startup_external_urls?: {
    homepage?: string;
    angellist?: string;
    crunchbase?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    alternative_website?: string;
  };
  startup_team_members?: {
    member_id: string;
    name: string;
    job_title?: string;
    bio?: string;
    avatar_url?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    twitter_url?: string;
    github_url?: string;
    facebook_url?: string;
    city?: string;
    country_name?: string;
    industry_name?: string;
  }[];
  startup_topics?: {
    topic_id: string;
    topic_name: string;
    topic_type: 'offering' | 'seeking';
  }[];
  startup_tags?: {
    tag_name: string;
    created_by: string;
  }[];
}

export interface MigrationProgress {
  id: string;
  file_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_count: number;
  total_count: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  batch_number: number;
}

// Converter dados do Supabase para formato legado
function convertSupabaseToLegacyFormat(supabaseStartup: SupabaseStartup): Startup {
  const externalUrls = supabaseStartup.startup_external_urls || {};
  const teamMembers = supabaseStartup.startup_team_members || [];
  const topics = supabaseStartup.startup_topics || [];
  const tags = supabaseStartup.startup_tags?.map(t => t.tag_name) || [];

  // Criar estrutura legada de attendance_ids
  const attendanceIds = [{
    data: {
      attendance: {
        id: 'mock-id',
        role: 'exhibitor',
        name: supabaseStartup.name,
        avatarUrl: supabaseStartup.logo_url,
        firstName: '',
        lastName: '',
        twitterUrl: '',
        githubUrl: '',
        facebookUrl: '',
        jobTitle: '',
        companyName: supabaseStartup.name,
        city: supabaseStartup.city,
        country: supabaseStartup.country ? { id: 'mock', name: supabaseStartup.country, __typename: 'Country' } : undefined,
        industry: supabaseStartup.industry ? { id: 'mock', name: supabaseStartup.industry, __typename: 'Industry' } : undefined,
        email: '',
        bio: supabaseStartup.elevator_pitch || '',
        __typename: 'Attendance',
        talks: [],
        exhibitor: {
          id: supabaseStartup.company_id,
          company: {
            id: supabaseStartup.company_id,
            name: supabaseStartup.name,
            logoUrl: supabaseStartup.logo_url || '',
            countryName: supabaseStartup.country || '',
            __typename: 'Company'
          },
          team: {
            edges: teamMembers.map(member => ({
              node: {
                id: member.member_id,
                name: member.name,
                role: member.job_title || '',
                companyName: supabaseStartup.name,
                jobTitle: member.job_title || '',
                avatarUrl: member.avatar_url,
                firstName: member.first_name,
                lastName: member.last_name,
                city: member.city,
                country: member.country_name ? { id: 'mock', name: member.country_name, __typename: 'Country' } : undefined,
                industry: member.industry_name ? { id: 'mock', name: member.industry_name, __typename: 'Industry' } : undefined,
                email: member.email,
                bio: member.bio || '',
                twitterUrl: member.twitter_url,
                githubUrl: member.github_url,
                facebookUrl: member.facebook_url,
                __typename: 'Attendee'
              },
              __typename: 'AttendeeEdge'
            }))
          }
        },
        offeringTopics: {
          edges: topics
            .filter(t => t.topic_type === 'offering')
            .map(topic => ({
              node: {
                id: topic.topic_id,
                name: topic.topic_name,
                __typename: 'Topic'
              },
              __typename: 'TopicEdge'
            })),
          __typename: 'TopicConnection'
        },
        seekingTopics: {
          edges: topics
            .filter(t => t.topic_type === 'seeking')
            .map(topic => ({
              node: {
                id: topic.topic_id,
                name: topic.topic_name,
                __typename: 'Topic'
              },
              __typename: 'TopicEdge'
            })),
          __typename: 'TopicConnection'
        }
      }
    }
  }];

  return {
    company_id: supabaseStartup.company_id,
    name: supabaseStartup.name,
    city: supabaseStartup.city || '',
    province: supabaseStartup.province || '',
    country: supabaseStartup.country || '',
    industry: supabaseStartup.industry || '',
    funding_tier: supabaseStartup.funding_tier || 'Not specified',
    elevator_pitch: supabaseStartup.elevator_pitch || '',
    exhibition_date: supabaseStartup.exhibition_date || '',
    fundraising: supabaseStartup.fundraising,
    meet_investors: supabaseStartup.meet_investors,
    startup_women_founder: supabaseStartup.startup_women_founder,
    startup_black_founder: supabaseStartup.startup_black_founder,
    startup_indigenous_founder: supabaseStartup.startup_indigenous_founder,
    endorsed_by: supabaseStartup.endorsed_by,
    logo_urls: {
      tinythumb: '',
      tiny: '',
      thumb: supabaseStartup.logo_url || '',
      medium: supabaseStartup.logo_url || '',
      large: supabaseStartup.logo_url || '',
      original: supabaseStartup.logo_url || ''
    },
    external_urls: {
      homepage: externalUrls.homepage,
      angellist: externalUrls.angellist,
      crunchbase: externalUrls.crunchbase,
      instagram: externalUrls.instagram,
      twitter: externalUrls.twitter,
      facebook: externalUrls.facebook,
      linkedin: externalUrls.linkedin,
      youtube: externalUrls.youtube,
      alternative_website: externalUrls.alternative_website
    },
    attendance_ids: attendanceIds,
    tags,
    selected: false,
    // Adicionar propriedades do Kanban
    show_in_kanban: supabaseStartup.show_in_kanban,
    kanban_column: supabaseStartup.kanban_column
  };
}

export function useStartups() {
  return useQuery({
    queryKey: ['startups'],
    queryFn: async () => {
      console.log('🔍 Buscando startups do Supabase...');
      
      const { data, error } = await supabase
        .from('startups')
        .select(`
          *,
          startup_external_urls(*),
          startup_team_members(*),
          startup_topics(*),
          startup_tags(*)
        `)
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar startups:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} startups encontradas no Supabase`);
      
      return (data as any[]).map(convertSupabaseToLegacyFormat);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

export function useKanbanStartups() {
  return useQuery({
    queryKey: ['kanban-startups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('startups')
        .select(`
          *,
          startup_external_urls(*),
          startup_team_members(*),
          startup_topics(*),
          startup_tags(*)
        `)
        .eq('show_in_kanban', true)
        .order('name');

      if (error) throw error;

      return (data as any[]).map(convertSupabaseToLegacyFormat);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMigrationProgress() {
  return useQuery({
    queryKey: ['migration-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('migration_progress')
        .select('*')
        .order('file_name');

      if (error) throw error;

      return data as MigrationProgress[];
    },
    staleTime: 1000, // 1 segundo para monitoramento em tempo real
    refetchInterval: 2000, // Refetch a cada 2 segundos durante migração
  });
}

export function useIndustries() {
  return useQuery({
    queryKey: ['industries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industries')
        .select('name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data.map(item => item.name);
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useFundingTiers() {
  return useQuery({
    queryKey: ['funding-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funding_tiers')
        .select('name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data.map(item => item.name);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function usePredefinedTags() {
  return useQuery({
    queryKey: ['predefined-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predefined_tags')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useMigrateData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('🚀 Iniciando migração via Edge Function otimizada...');
      
      const { data, error } = await supabase.functions.invoke('migrate-data');
      
      if (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
      }
      
      console.log('✅ Migração concluída:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Migração bem-sucedida, invalidando cache...');
      // Invalidar cache para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['startups'] });
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      queryClient.invalidateQueries({ queryKey: ['funding-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['migration-progress'] });
    },
    onError: (error) => {
      console.error('💥 Erro na mutação de migração:', error);
    }
  });
}

export function useToggleKanban() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ companyId, showInKanban }: { companyId: string; showInKanban: boolean }) => {
      const { error } = await supabase
        .from('startups')
        .update({ show_in_kanban: showInKanban })
        .eq('company_id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-startups'] });
    },
  });
}

export function useUpdateKanbanColumn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ companyId, column }: { companyId: string; column: string }) => {
      const { error } = await supabase
        .from('startups')
        .update({ kanban_column: column })
        .eq('company_id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-startups'] });
    },
  });
}
