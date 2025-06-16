
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
  }[];
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

// Converter dados do Supabase para formato legado
function convertSupabaseToLegacyFormat(supabaseStartup: SupabaseStartup): Startup {
  const externalUrls = supabaseStartup.startup_external_urls?.[0] || {};
  const teamMembers = supabaseStartup.startup_team_members || [];
  const topics = supabaseStartup.startup_topics || [];
  const tags = supabaseStartup.startup_tags?.map(t => t.tag_name) || [];

  // Criar estrutura legada de attendance_ids
  const attendanceIds = [{
    data: {
      attendance: {
        exhibitor: {
          team: {
            edges: teamMembers.map(member => ({
              node: {
                id: member.member_id,
                name: member.name,
                jobTitle: member.job_title || '',
                bio: member.bio || '',
                avatarUrl: member.avatar_url,
                firstName: member.first_name,
                lastName: member.last_name,
                email: member.email,
                twitterUrl: member.twitter_url,
                githubUrl: member.github_url,
                facebookUrl: member.facebook_url,
                city: member.city,
                country: member.country_name ? { name: member.country_name } : undefined,
                industry: member.industry_name ? { name: member.industry_name } : undefined,
                __typename: 'Attendee'
              }
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
              }
            }))
        },
        seekingTopics: {
          edges: topics
            .filter(t => t.topic_type === 'seeking')
            .map(topic => ({
              node: {
                id: topic.topic_id,
                name: topic.topic_name,
                __typename: 'Topic'
              }
            }))
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
    selected: false
  };
}

export function useStartups() {
  return useQuery({
    queryKey: ['startups'],
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
        .order('name');

      if (error) throw error;

      return (data as SupabaseStartup[]).map(convertSupabaseToLegacyFormat);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
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

      return (data as SupabaseStartup[]).map(convertSupabaseToLegacyFormat);
    },
    staleTime: 5 * 60 * 1000,
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
      const { data, error } = await supabase.functions.invoke('migrate-data');
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      // Invalidar cache para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['startups'] });
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      queryClient.invalidateQueries({ queryKey: ['funding-tiers'] });
    },
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
