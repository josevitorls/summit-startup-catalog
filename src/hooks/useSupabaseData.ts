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
    topic_type: string;
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

// Converter dados do Supabase para formato legado com fallbacks seguros
function convertSupabaseToLegacyFormat(supabaseStartup: SupabaseStartup): Startup {
  const externalUrls = supabaseStartup.startup_external_urls || {};
  const teamMembers = supabaseStartup.startup_team_members || [];
  const topics = supabaseStartup.startup_topics || [];
  const tags = supabaseStartup.startup_tags?.map(t => t.tag_name) || [];

  // Criar estrutura legada de attendance_ids com dados seguros
  const attendanceIds = [{
    data: {
      attendance: {
        id: `mock-${supabaseStartup.company_id}`,
        role: 'exhibitor',
        name: supabaseStartup.name,
        avatarUrl: supabaseStartup.logo_url || '',
        firstName: '',
        lastName: '',
        twitterUrl: externalUrls.twitter || '',
        githubUrl: '',
        facebookUrl: externalUrls.facebook || '',
        jobTitle: '',
        companyName: supabaseStartup.name,
        city: supabaseStartup.city || '',
        country: supabaseStartup.country ? { 
          id: 'mock', 
          name: supabaseStartup.country, 
          __typename: 'Country' 
        } : null,
        industry: supabaseStartup.industry ? { 
          id: 'mock', 
          name: supabaseStartup.industry, 
          __typename: 'Industry' 
        } : null,
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
                avatarUrl: member.avatar_url || '',
                firstName: member.first_name || '',
                lastName: member.last_name || '',
                city: member.city || '',
                country: member.country_name ? { 
                  id: 'mock', 
                  name: member.country_name, 
                  __typename: 'Country' 
                } : null,
                industry: member.industry_name ? { 
                  id: 'mock', 
                  name: member.industry_name, 
                  __typename: 'Industry' 
                } : null,
                email: member.email || '',
                bio: member.bio || '',
                twitterUrl: member.twitter_url || '',
                githubUrl: member.github_url || '',
                facebookUrl: member.facebook_url || '',
                __typename: 'Attendee'
              },
              __typename: 'AttendeeEdge'
            })),
            __typename: 'AttendeeConnection'
          },
          __typename: 'Exhibitor'
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
      tinythumb: supabaseStartup.logo_url || '',
      tiny: supabaseStartup.logo_url || '',
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
    show_in_kanban: supabaseStartup.show_in_kanban,
    kanban_column: supabaseStartup.kanban_column
  };
}

export function useStartups() {
  return useQuery({
    queryKey: ['startups'],
    queryFn: async () => {
      console.log('🔍 Buscando startups do Supabase otimizado...');
      
      try {
        // Query principal para startups com limite para performance
        const { data: startupsData, error: startupsError } = await supabase
          .from('startups')
          .select('*')
          .order('name')
          .limit(2000); // Limite de segurança

        if (startupsError) {
          console.error('❌ Erro ao buscar startups:', startupsError);
          throw startupsError;
        }

        if (!startupsData || startupsData.length === 0) {
          console.log('📭 Nenhuma startup encontrada');
          return [];
        }

        console.log(`✅ ${startupsData.length} startups principais encontradas`);

        // Buscar dados relacionados em lotes para melhor performance
        const startupIds = startupsData.map(s => s.id);

        const [externalUrlsData, teamMembersData, topicsData, tagsData] = await Promise.all([
          supabase
            .from('startup_external_urls')
            .select('startup_id, homepage, angellist, crunchbase, instagram, twitter, facebook, linkedin, youtube, alternative_website')
            .in('startup_id', startupIds),
          
          supabase
            .from('startup_team_members')
            .select('startup_id, member_id, name, job_title, bio, avatar_url, first_name, last_name, email, twitter_url, github_url, facebook_url, city, country_name, industry_name')
            .in('startup_id', startupIds)
            .limit(1000), // Limite para evitar sobrecarga
          
          supabase
            .from('startup_topics')
            .select('startup_id, topic_id, topic_name, topic_type')
            .in('startup_id', startupIds)
            .limit(2000), // Limite para evitar sobrecarga
          
          supabase
            .from('startup_tags')
            .select('startup_id, tag_name, created_by')
            .in('startup_id', startupIds)
            .limit(1000) // Limite para evitar sobrecarga
        ]);

        // Criar mapas para lookup eficiente
        const externalUrlsMap = new Map();
        externalUrlsData.data?.forEach(url => {
          externalUrlsMap.set(url.startup_id, url);
        });

        const teamMembersMap = new Map();
        teamMembersData.data?.forEach(member => {
          if (!teamMembersMap.has(member.startup_id)) {
            teamMembersMap.set(member.startup_id, []);
          }
          teamMembersMap.get(member.startup_id).push(member);
        });

        const topicsMap = new Map();
        topicsData.data?.forEach(topic => {
          if (!topicsMap.has(topic.startup_id)) {
            topicsMap.set(topic.startup_id, []);
          }
          topicsMap.get(topic.startup_id).push(topic);
        });

        const tagsMap = new Map();
        tagsData.data?.forEach(tag => {
          if (!tagsMap.has(tag.startup_id)) {
            tagsMap.set(tag.startup_id, []);
          }
          tagsMap.get(tag.startup_id).push(tag);
        });

        // Enriquecer dados usando os mapas
        const enrichedStartups = startupsData.map(startup => ({
          ...startup,
          startup_external_urls: externalUrlsMap.get(startup.id) || {},
          startup_team_members: teamMembersMap.get(startup.id) || [],
          startup_topics: topicsMap.get(startup.id) || [],
          startup_tags: tagsMap.get(startup.id) || []
        }) as SupabaseStartup);

        console.log(`✅ ${enrichedStartups.length} startups enriquecidas com dados relacionados`);
        
        return enrichedStartups.map(convertSupabaseToLegacyFormat);
      } catch (error) {
        console.error('💥 Erro ao buscar startups:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useKanbanStartups() {
  return useQuery({
    queryKey: ['kanban-startups'],
    queryFn: async () => {
      console.log('🔍 Buscando startups do Kanban...');
      
      const { data: startupsData, error: startupsError } = await supabase
        .from('startups')
        .select('*')
        .eq('show_in_kanban', true)
        .order('name');

      if (startupsError) throw startupsError;

      const enrichedStartups = await Promise.all(
        startupsData.map(async (startup) => {
          try {
            const { data: externalUrls } = await supabase
              .from('startup_external_urls')
              .select('homepage, angellist, crunchbase, instagram, twitter, facebook, linkedin, youtube, alternative_website')
              .eq('startup_id', startup.id)
              .maybeSingle();

            const { data: teamMembers } = await supabase
              .from('startup_team_members')
              .select('member_id, name, job_title, bio, avatar_url, first_name, last_name, email, twitter_url, github_url, facebook_url, city, country_name, industry_name')
              .eq('startup_id', startup.id);

            const { data: topics } = await supabase
              .from('startup_topics')
              .select('topic_id, topic_name, topic_type')
              .eq('startup_id', startup.id);

            const { data: tags } = await supabase
              .from('startup_tags')
              .select('tag_name, created_by')
              .eq('startup_id', startup.id);

            return {
              ...startup,
              startup_external_urls: externalUrls,
              startup_team_members: teamMembers || [],
              startup_topics: topics || [],
              startup_tags: tags || []
            } as SupabaseStartup;
          } catch (error) {
            console.warn(`⚠️ Erro ao enriquecer dados da startup do kanban ${startup.name}:`, error);
            return {
              ...startup,
              startup_external_urls: {},
              startup_team_members: [],
              startup_topics: [],
              startup_tags: []
            } as SupabaseStartup;
          }
        })
      );

      return enrichedStartups.map(convertSupabaseToLegacyFormat);
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
    staleTime: 1000,
    refetchInterval: 3000, // Refetch a cada 3 segundos para micro-batches
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
    staleTime: 10 * 60 * 1000,
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
      console.log('🚀 Iniciando micro-batch via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('migrate-data');
      
      if (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
      }
      
      console.log('✅ Micro-batch processado:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Micro-batch bem-sucedido, invalidando cache...');
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
