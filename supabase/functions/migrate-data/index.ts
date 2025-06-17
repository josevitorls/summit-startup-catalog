
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações ultra-conservadoras para micro-batches
const CONFIG = {
  BATCH_SIZE: 5, // Apenas 5 startups por execução
  STARTUP_DELAY_MS: 1000, // 1 segundo entre startups
  BATCH_DELAY_MS: 2000, // 2 segundos entre batches
  MAX_RETRIES: 3,
  EXECUTION_TIMEOUT_MS: 45000, // 45 segundos por execução
  AUTO_RETRY_DELAY_MS: 5000, // 5 segundos antes de auto-retry
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

interface MigrationState {
  currentFileIndex: number;
  currentStartupIndex: number;
  totalProcessed: number;
  totalFailed: number;
  isComplete: boolean;
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

async function getMigrationState(supabase: any): Promise<MigrationState> {
  try {
    const { data: progressData } = await supabase
      .from('migration_progress')
      .select('*')
      .order('file_name');

    if (!progressData || progressData.length === 0) {
      return {
        currentFileIndex: 0,
        currentStartupIndex: 0,
        totalProcessed: 0,
        totalFailed: 0,
        isComplete: false
      };
    }

    const completedFiles = progressData.filter(p => p.status === 'completed').length;
    const lastProcessing = progressData.find(p => p.status === 'processing');
    const totalProcessed = progressData.reduce((sum, p) => sum + (p.processed_count || 0), 0);
    const totalFailed = progressData.filter(p => p.status === 'failed').length;

    if (completedFiles === JSON_FILES.length) {
      return {
        currentFileIndex: JSON_FILES.length,
        currentStartupIndex: 0,
        totalProcessed,
        totalFailed,
        isComplete: true
      };
    }

    if (lastProcessing) {
      const fileIndex = JSON_FILES.indexOf(lastProcessing.file_name);
      return {
        currentFileIndex: fileIndex,
        currentStartupIndex: lastProcessing.processed_count || 0,
        totalProcessed,
        totalFailed,
        isComplete: false
      };
    }

    return {
      currentFileIndex: completedFiles,
      currentStartupIndex: 0,
      totalProcessed,
      totalFailed,
      isComplete: false
    };
  } catch (error) {
    console.error('❌ Erro ao obter estado da migração:', error);
    return {
      currentFileIndex: 0,
      currentStartupIndex: 0,
      totalProcessed: 0,
      totalFailed: 0,
      isComplete: false
    };
  }
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

async function checkDuplicateStartup(supabase: any, companyId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('startups')
      .select('id')
      .eq('company_id', companyId)
      .limit(1);

    if (error) {
      console.warn(`⚠️ Erro ao verificar duplicata para ${companyId}:`, error.message);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.warn(`⚠️ Erro ao verificar duplicata para ${companyId}:`, error);
    return false;
  }
}

async function processStartupWithDeduplication(
  supabase: any,
  startup: Startup,
  fileName: string,
  startupIndex: number,
  totalStartups: number
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  try {
    console.log(`📦 Processando startup ${startupIndex + 1}/${totalStartups} de ${fileName}: ${startup.name}`);

    // Verificar se já existe
    const isDuplicate = await checkDuplicateStartup(supabase, startup.company_id);
    if (isDuplicate) {
      console.log(`⏭️ Startup ${startup.name} já existe, pulando...`);
      return { success: true, skipped: true };
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na startup individual')), 30000);
    });

    const startupPromise = async () => {
      // Inserir startup principal
      const { data: insertedStartup, error: startupError } = await supabase
        .from('startups')
        .insert({
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
        })
        .select('id')
        .single();

      if (startupError) {
        throw new Error(`Erro ao inserir startup: ${startupError.message}`);
      }

      const startupId = insertedStartup.id;

      // Processar URLs externas se existirem
      if (startup.external_urls && Object.keys(startup.external_urls).length > 0) {
        await supabase
          .from('startup_external_urls')
          .insert({
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
          });
      }

      // Processar membros da equipe e tópicos
      if (startup.attendance_ids?.length > 0) {
        for (const attendanceId of startup.attendance_ids.slice(0, 1)) { // Limitar para evitar sobrecarga
          const attendance = attendanceId.data?.attendance;
          if (!attendance) continue;

          // Processar membros da equipe
          if (attendance.exhibitor?.team?.edges) {
            for (const teamMember of attendance.exhibitor.team.edges.slice(0, 5)) { // Máximo 5 membros
              const member = teamMember.node;
              if (!member?.id || !member?.name) continue;

              await supabase
                .from('startup_team_members')
                .insert({
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
                });
            }
          }

          // Processar tópicos (limitado)
          const allTopics = [
            ...(attendance.offeringTopics?.edges || []).slice(0, 5).map((edge: any) => ({
              ...edge.node,
              type: 'offering'
            })),
            ...(attendance.seekingTopics?.edges || []).slice(0, 5).map((edge: any) => ({
              ...edge.node,
              type: 'seeking'
            })),
          ];

          for (const topic of allTopics) {
            if (!topic?.id || !topic?.name) continue;

            await supabase
              .from('startup_topics')
              .insert({
                startup_id: startupId,
                topic_id: topic.id,
                topic_name: topic.name,
                topic_type: topic.type,
              });
          }
        }
      }

      return { success: true };
    };

    await Promise.race([startupPromise(), timeoutPromise]);
    return { success: true };
    
  } catch (error) {
    const errorMsg = `Erro ao processar ${startup.name}: ${error.message}`;
    console.error(`❌ ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

async function processMicroBatch(
  supabase: any,
  fileName: string,
  startups: Startup[],
  startIndex: number,
  batchSize: number
): Promise<{ success: number; failed: number; skipped: number; errors: string[] }> {
  
  const batch = startups.slice(startIndex, startIndex + batchSize);
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  console.log(`🔄 Processando micro-batch: startups ${startIndex + 1}-${startIndex + batch.length} de ${fileName}`);

  for (let i = 0; i < batch.length; i++) {
    const startup = batch[i];
    const globalIndex = startIndex + i;
    
    const result = await processStartupWithDeduplication(supabase, startup, fileName, globalIndex, startups.length);
    
    if (result.success) {
      if (result.skipped) {
        skippedCount++;
      } else {
        successCount++;
      }
    } else {
      failedCount++;
      if (result.error) errors.push(result.error);
    }

    // Atualizar progresso
    await updateMigrationProgress(
      supabase,
      fileName,
      'processing',
      startIndex + i + 1,
      startups.length
    );

    // Sleep entre startups (exceto na última)
    if (i < batch.length - 1) {
      await sleep(CONFIG.STARTUP_DELAY_MS);
    }
  }

  return { success: successCount, failed: failedCount, skipped: skippedCount, errors };
}

async function scheduleNextExecution(supabase: any) {
  try {
    console.log(`⏰ Agendando próxima execução em ${CONFIG.AUTO_RETRY_DELAY_MS}ms...`);
    
    // Usar setTimeout para agendar próxima execução
    setTimeout(async () => {
      try {
        console.log('🔄 Executando próximo batch automaticamente...');
        
        const response = await fetch(
          `https://ondcyheslxgqwigoxwrg.supabase.co/functions/v1/migrate-data`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          console.error('❌ Erro ao executar próximo batch:', response.statusText);
        } else {
          console.log('✅ Próximo batch iniciado com sucesso');
        }
      } catch (error) {
        console.error('❌ Erro ao agendar próxima execução:', error);
      }
    }, CONFIG.AUTO_RETRY_DELAY_MS);
    
  } catch (error) {
    console.error('❌ Erro ao agendar próxima execução:', error);
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

    console.log('🚀 Iniciando execução de micro-batch...');

    // Obter estado atual da migração
    const migrationState = await getMigrationState(supabaseClient);
    console.log('📊 Estado da migração:', migrationState);

    if (migrationState.isComplete) {
      console.log('🎉 Migração já concluída!');
      return new Response(JSON.stringify({
        success: true,
        message: 'Migração já foi concluída',
        details: {
          totalProcessed: migrationState.totalProcessed,
          totalFailed: migrationState.totalFailed,
          isComplete: true
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é a primeira execução
    if (migrationState.currentFileIndex === 0 && migrationState.currentStartupIndex === 0) {
      console.log('🧹 Primeira execução - limpando dados anteriores...');
      await supabaseClient.from('startup_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseClient.from('startup_topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseClient.from('startup_team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseClient.from('startup_external_urls').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseClient.from('startup_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseClient.from('startups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseClient.from('migration_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const currentFileName = JSON_FILES[migrationState.currentFileIndex];
    
    console.log(`📁 Processando arquivo: ${currentFileName} a partir do índice ${migrationState.currentStartupIndex}`);

    // Carregar arquivo atual
    const response = await fetch(`https://raw.githubusercontent.com/josevitorls/summit-startup-catalog/main/${currentFileName}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const startups = Array.isArray(data) ? data : Object.values(data);
    const validStartups = startups.filter((startup: any) => !isDemoData(startup));

    console.log(`📊 ${currentFileName}: ${validStartups.length} startups válidas de ${startups.length} total`);

    if (migrationState.currentStartupIndex === 0) {
      await updateMigrationProgress(supabaseClient, currentFileName, 'processing', 0, validStartups.length);
    }

    // Processar micro-batch
    const result = await processMicroBatch(
      supabaseClient, 
      currentFileName, 
      validStartups, 
      migrationState.currentStartupIndex, 
      CONFIG.BATCH_SIZE
    );

    const newStartupIndex = migrationState.currentStartupIndex + CONFIG.BATCH_SIZE;
    const isFileComplete = newStartupIndex >= validStartups.length;

    console.log(`✅ Micro-batch processado: ${result.success} sucessos, ${result.failed} falhas, ${result.skipped} puladas`);

    if (isFileComplete) {
      // Arquivo concluído
      await updateMigrationProgress(supabaseClient, currentFileName, 'completed', validStartups.length, validStartups.length);
      console.log(`🎯 Arquivo ${currentFileName} concluído!`);
      
      // Verificar se há mais arquivos
      if (migrationState.currentFileIndex + 1 < JSON_FILES.length) {
        console.log('📂 Há mais arquivos para processar, agendando próxima execução...');
        scheduleNextExecution(supabaseClient);
      } else {
        console.log('🎉 Todos os arquivos processados! Migração concluída!');
      }
    } else {
      // Ainda há startups neste arquivo
      console.log(`📋 Ainda há startups em ${currentFileName}, agendando próxima execução...`);
      scheduleNextExecution(supabaseClient);
    }

    const response_data = {
      success: true,
      message: `Micro-batch processado: ${result.success} sucessos, ${result.skipped} puladas, ${result.failed} falhas`,
      details: {
        currentFile: currentFileName,
        currentFileIndex: migrationState.currentFileIndex + 1,
        totalFiles: JSON_FILES.length,
        startupsBatchProcessed: result.success + result.failed + result.skipped,
        startupsRemaining: Math.max(0, validStartups.length - newStartupIndex),
        totalProcessed: migrationState.totalProcessed + result.success,
        totalFailed: migrationState.totalFailed + result.failed,
        totalSkipped: result.skipped,
        isFileComplete,
        isComplete: isFileComplete && (migrationState.currentFileIndex + 1 >= JSON_FILES.length),
        errors: result.errors.slice(0, 3),
        processingStrategy: `Micro-batches: ${CONFIG.BATCH_SIZE} startups por execução`,
        nextExecutionScheduled: !isFileComplete || (migrationState.currentFileIndex + 1 < JSON_FILES.length)
      }
    };

    console.log('📋 Resposta da execução:', response_data);

    return new Response(JSON.stringify(response_data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Erro crítico na execução:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Erro crítico durante a execução do micro-batch. Verifique os logs.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
