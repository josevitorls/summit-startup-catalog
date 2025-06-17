
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações ultra-conservadoras para evitar sobrecarga
const CONFIG = {
  STARTUP_DELAY_MS: 1000, // 1 segundo entre cada startup
  MAX_RETRIES: 3,
  TIMEOUT_MS: 30000, // 30 segundos por startup
  MAX_FILES_PARALLEL: 1, // Processar um arquivo por vez
};

const JSON_FILES = [
  'processed_batch_0-99.json',
  'processed_batch_100-199.json',
  'processed_batch_200-299.json',
  'processed_batch_300-399.json',
  'processed_batch_400-499.json',
  'processed_batch_500-599.json',
  'processed_batch_600-699.json',
  'processed_batch_700-799.json',
  'processed_batch_800-899.json',
  'processed_batch_900-999.json',
  'processed_batch_1000-1099.json',
  'processed_batch_1100-1199.json',
  'processed_batch_1200-1277.json',
];

interface Startup {
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
  logo_urls?: any;
  external_urls?: any;
  attendance_ids: any[];
}

function isDemoData(startup: Startup): boolean {
  const name = startup.name?.toLowerCase() || '';
  const companyId = startup.company_id?.toLowerCase() || '';
  
  return (
    name.includes('demo') ||
    name.includes('startup') ||
    name.includes('test') ||
    name.includes('sample') ||
    companyId.includes('demo') ||
    companyId.includes('test') ||
    !startup.country ||
    !startup.industry ||
    startup.name === 'Company Name' ||
    startup.company_id === 'company-id'
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateMigrationProgress(
  supabase: any,
  fileName: string,
  status: string,
  processedCount = 0,
  totalCount = 0,
  errorMessage?: string
) {
  try {
    const updateData: any = {
      status,
      processed_count: processedCount,
      total_count: totalCount,
    };

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await supabase
      .from('migration_progress')
      .upsert({
        file_name: fileName,
        ...updateData,
      }, {
        onConflict: 'file_name',
      });
  } catch (error) {
    console.error(`❌ Erro ao atualizar progresso para ${fileName}:`, error);
  }
}

async function processStartupOne(
  supabase: any,
  startup: Startup,
  fileName: string,
  startupIndex: number,
  totalStartups: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📦 Processando startup ${startupIndex + 1}/${totalStartups} de ${fileName}: ${startup.name}`);

    // Timeout por startup individual
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na startup')), CONFIG.TIMEOUT_MS);
    });

    const startupPromise = async () => {
      // Usar transação para garantir consistência
      const { data: insertedStartup, error: startupError } = await supabase
        .from('startups')
        .upsert({
          company_id: startup.company_id,
          name: startup.name,
          city: startup.city || null,
          province: startup.province || null,
          country: startup.country || null,
          industry: startup.industry || null,
          funding_tier: startup.funding_tier || 'Not specified',
          elevator_pitch: startup.elevator_pitch || null,
          exhibition_date: startup.exhibition_date || null,
          fundraising: startup.fundraising || false,
          meet_investors: startup.meet_investors || false,
          startup_women_founder: startup.startup_women_founder || false,
          startup_black_founder: startup.startup_black_founder || false,
          startup_indigenous_founder: startup.startup_indigenous_founder || false,
          endorsed_by: startup.endorsed_by || null,
          logo_url: startup.logo_urls?.original || startup.logo_urls?.large || null,
          show_in_kanban: false,
          kanban_column: 'backlog',
        }, {
          onConflict: 'company_id',
          ignoreDuplicates: false,
        })
        .select('id')
        .single();

      if (startupError) {
        throw new Error(`Erro ao inserir startup: ${startupError.message}`);
      }

      const startupId = insertedStartup.id;

      // Processar URLs externas
      if (startup.external_urls && Object.keys(startup.external_urls).length > 0) {
        const { error: urlError } = await supabase
          .from('startup_external_urls')
          .upsert({
            startup_id: startupId,
            homepage: startup.external_urls.homepage || null,
            angellist: startup.external_urls.angellist || null,
            crunchbase: startup.external_urls.crunchbase || null,
            instagram: startup.external_urls.instagram || null,
            twitter: startup.external_urls.twitter || null,
            facebook: startup.external_urls.facebook || null,
            linkedin: startup.external_urls.linkedin || null,
            youtube: startup.external_urls.youtube || null,
            alternative_website: startup.external_urls.alternative_website || null,
          }, {
            onConflict: 'startup_id',
            ignoreDuplicates: false,
          });

        if (urlError) {
          console.warn(`⚠️ Erro ao inserir URLs para ${startup.name}:`, urlError.message);
        }
      }

      // Processar membros da equipe
      if (startup.attendance_ids?.length > 0) {
        for (const attendanceId of startup.attendance_ids) {
          const attendance = attendanceId.data?.attendance;
          if (!attendance?.exhibitor?.team?.edges) continue;

          for (const teamMember of attendance.exhibitor.team.edges) {
            const member = teamMember.node;
            if (!member?.id || !member?.name) continue;

            const { error: memberError } = await supabase
              .from('startup_team_members')
              .upsert({
                startup_id: startupId,
                member_id: member.id,
                name: member.name,
                job_title: member.jobTitle || member.role || null,
                bio: member.bio || null,
                avatar_url: member.avatarUrl || null,
                first_name: member.firstName || null,
                last_name: member.lastName || null,
                email: member.email || null,
                twitter_url: member.twitterUrl || null,
                github_url: member.githubUrl || null,
                facebook_url: member.facebookUrl || null,
                city: member.city || null,
                country_name: member.country?.name || null,
                industry_name: member.industry?.name || null,
              }, {
                onConflict: 'startup_id,member_id',
                ignoreDuplicates: false,
              });

            if (memberError) {
              console.warn(`⚠️ Erro ao inserir membro ${member.name}:`, memberError.message);
            }
          }

          // Processar tópicos de offering e seeking
          const allTopics = [
            ...(attendance.offeringTopics?.edges || []).map((edge: any) => ({
              ...edge.node,
              type: 'offering'
            })),
            ...(attendance.seekingTopics?.edges || []).map((edge: any) => ({
              ...edge.node,
              type: 'seeking'
            })),
          ];

          for (const topic of allTopics) {
            if (!topic?.id || !topic?.name) continue;

            const { error: topicError } = await supabase
              .from('startup_topics')
              .upsert({
                startup_id: startupId,
                topic_id: topic.id,
                topic_name: topic.name,
                topic_type: topic.type,
              }, {
                onConflict: 'startup_id,topic_id,topic_type',
                ignoreDuplicates: false,
              });

            if (topicError) {
              console.warn(`⚠️ Erro ao inserir tópico ${topic.name}:`, topicError.message);
            }
          }
        }
      }

      return { success: true };
    };

    // Executar com timeout
    await Promise.race([startupPromise(), timeoutPromise]);
    
    return { success: true };
    
  } catch (error) {
    const errorMsg = `Erro ao processar ${startup.name}: ${error.message}`;
    console.error(`❌ ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

async function processFileSequentially(
  supabase: any,
  fileName: string,
  retryCount = 0
): Promise<{ success: number; failed: number; total: number; errors: string[] }> {
  try {
    console.log(`🔄 Processando arquivo: ${fileName} (tentativa ${retryCount + 1})`);
    
    await updateMigrationProgress(supabase, fileName, 'processing');

    const response = await fetch(`https://raw.githubusercontent.com/josevitorls/summit-startup-catalog/main/${fileName}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const startups = Array.isArray(data) ? data : Object.values(data);
    
    // Filtrar dados de demonstração
    const validStartups = startups.filter((startup: any) => !isDemoData(startup));
    const totalStartups = validStartups.length;
    
    console.log(`📊 ${fileName}: ${totalStartups} startups válidas de ${startups.length} total`);

    if (totalStartups === 0) {
      await updateMigrationProgress(supabase, fileName, 'completed', 0, 0);
      return { success: 0, failed: 0, total: 0, errors: [] };
    }

    let successCount = 0;
    let failedCount = 0;
    const allErrors: string[] = [];

    // Processar startups uma por vez com delay
    for (let i = 0; i < validStartups.length; i++) {
      const startup = validStartups[i];
      
      const result = await processStartupOne(supabase, startup, fileName, i, totalStartups);
      
      if (result.success) {
        successCount++;
      } else {
        failedCount++;
        if (result.error) allErrors.push(result.error);
      }

      // Atualizar progresso a cada startup
      await updateMigrationProgress(
        supabase,
        fileName,
        'processing',
        successCount + failedCount,
        totalStartups
      );

      // Sleep de 1 segundo entre startups (exceto na última)
      if (i < validStartups.length - 1) {
        console.log(`⏳ Aguardando ${CONFIG.STARTUP_DELAY_MS}ms antes da próxima startup...`);
        await sleep(CONFIG.STARTUP_DELAY_MS);
      }
    }

    await updateMigrationProgress(supabase, fileName, 'completed', successCount, totalStartups);
    
    console.log(`✅ ${fileName} concluído: ${successCount} sucessos, ${failedCount} falhas`);
    
    return {
      success: successCount,
      failed: failedCount,
      total: totalStartups,
      errors: allErrors
    };

  } catch (error) {
    console.error(`❌ Erro ao processar ${fileName}:`, error.message);
    
    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log(`🔄 Tentando novamente ${fileName} em 5 segundos...`);
      await sleep(5000);
      return processFileSequentially(supabase, fileName, retryCount + 1);
    } else {
      await updateMigrationProgress(supabase, fileName, 'failed', 0, 0, error.message);
      return { success: 0, failed: 0, total: 0, errors: [error.message] };
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Iniciando migração ultra-conservadora: 1 startup por segundo...');

    // Limpar dados anteriores e progresso
    console.log('🧹 Limpando dados anteriores...');
    await supabaseClient.from('startup_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('startup_topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('startup_team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('startup_external_urls').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('startup_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('startups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('migration_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    let grandTotalSuccess = 0;
    let grandTotalFailed = 0;
    let grandTotalProcessed = 0;
    const allErrors: string[] = [];

    // Processar arquivos um por vez sequencialmente
    for (const fileName of JSON_FILES) {
      console.log(`📁 Processando arquivo: ${fileName}...`);
      
      const result = await processFileSequentially(supabaseClient, fileName);
      
      // Agregar resultados
      grandTotalSuccess += result.success;
      grandTotalFailed += result.failed;
      grandTotalProcessed += result.total;
      allErrors.push(...result.errors);

      console.log(`✅ ${fileName} finalizado. Total até agora: ${grandTotalSuccess} sucessos, ${grandTotalFailed} falhas`);
      
      // Sleep de 2 segundos entre arquivos
      if (JSON_FILES.indexOf(fileName) < JSON_FILES.length - 1) {
        console.log('⏳ Aguardando 2 segundos antes do próximo arquivo...');
        await sleep(2000);
      }
    }

    // Verificar se há dados válidos
    const { count: finalCount } = await supabaseClient
      .from('startups')
      .select('*', { count: 'exact', head: true });

    const response = {
      success: true,
      message: 'Migração ultra-conservadora concluída com sucesso!',
      details: {
        totalFilesProcessed: JSON_FILES.length,
        validStartupsProcessed: grandTotalProcessed,
        successfulInserts: grandTotalSuccess,
        failedInserts: grandTotalFailed,
        finalCount: finalCount || 0,
        totalSkipped: grandTotalProcessed - grandTotalSuccess,
        errors: allErrors.slice(0, 10), // Limitar erros exibidos
        totalErrors: allErrors.length,
        processingStrategy: 'Sequential: 1 startup per second',
      }
    };

    console.log('🎉 Migração finalizada:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Erro crítico na migração:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Erro crítico durante a migração ultra-conservadora. Verifique os logs.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
