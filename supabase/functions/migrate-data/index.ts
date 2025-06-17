
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting ultra-resilient migration process with auto-continuation...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar se migration está pausada
    const { data: controlData, error: controlError } = await supabaseClient
      .from('migration_control')
      .select('*')
      .single();

    if (controlError) {
      console.error('❌ Erro ao verificar controle de migração:', controlError);
      throw controlError;
    }

    if (controlData.is_paused) {
      console.log('⏸️ Migração pausada, retornando...');
      return new Response(
        JSON.stringify({ success: false, message: 'Migration is paused' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar controle para indicar que está executando
    await supabaseClient
      .from('migration_control')
      .update({ is_running: true, updated_at: new Date().toISOString() })
      .eq('id', controlData.id);

    // Obter próximo arquivo para processar usando a função do banco
    const { data: nextFileData, error: nextFileError } = await supabaseClient
      .rpc('get_next_migration_file');

    if (nextFileError) {
      console.error('❌ Erro ao obter próximo arquivo:', nextFileError);
      throw nextFileError;
    }

    if (!nextFileData || nextFileData.length === 0) {
      console.log('✅ Todos os arquivos foram processados!');
      
      // Atualizar controle para indicar que terminou
      await supabaseClient
        .from('migration_control')
        .update({ is_running: false, updated_at: new Date().toISOString() })
        .eq('id', controlData.id);

      return new Response(
        JSON.stringify({ success: true, message: 'All files processed', completed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileInfo = nextFileData[0];
    const fileName = fileInfo.file_name;
    const resumeFrom = fileInfo.resume_from || 0;

    console.log(`📍 Processing file: ${fileName} (index: ${fileInfo.batch_number}, resume from: ${resumeFrom})`);

    // UPSERT do progresso com controle de unicidade
    const { error: upsertError } = await supabaseClient
      .from('migration_progress')
      .upsert({
        file_name: fileName,
        status: 'processing',
        batch_number: fileInfo.batch_number,
        processed_count: resumeFrom,
        started_at: new Date().toISOString()
      }, {
        onConflict: 'file_name'
      });

    if (upsertError) {
      console.error('❌ Erro ao fazer upsert do progresso:', upsertError);
      throw upsertError;
    }

    try {
      // Buscar arquivo JSON
      console.log(`🚀 Processing file: ${fileName} (resuming from ${resumeFrom})`);
      
      const response = await fetch(`https://ondcyheslxgqwigoxwrg.supabase.co/storage/v1/object/public/startup-data/${fileName}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
      }

      const startupData = await response.json();
      const startups = Array.isArray(startupData) ? startupData : Object.values(startupData);
      
      console.log(`📊 Found ${startups.length} startups in ${fileName}, starting from ${resumeFrom}`);

      // Atualizar total_count no progresso
      await supabaseClient
        .from('migration_progress')
        .update({ total_count: startups.length })
        .eq('file_name', fileName);

      let processedCount = resumeFrom;
      let successfulInserts = 0;

      // Processar startups a partir do ponto de retomada
      for (let i = resumeFrom; i < startups.length; i++) {
        const startup = startups[i];

        // Verificar se migration está pausada a cada iteração
        const { data: pauseCheck } = await supabaseClient
          .from('migration_control')
          .select('is_paused')
          .single();

        if (pauseCheck?.is_paused) {
          console.log('⏸️ Migration pausada durante processamento');
          break;
        }

        try {
          // Verificar se startup já existe
          const { data: existingStartup } = await supabaseClient
            .from('startups')
            .select('id')
            .eq('company_id', startup.company_id)
            .maybeSingle();

          if (existingStartup) {
            console.log(`⏭️ Startup ${startup.company_id} already exists, skipping...`);
            processedCount++;
            continue;
          }

          // Inserir startup principal
          const { data: insertedStartup, error: startupError } = await supabaseClient
            .from('startups')
            .insert({
              company_id: startup.company_id,
              name: startup.name,
              city: startup.city,
              province: startup.province,
              country: startup.country,
              industry: startup.industry,
              funding_tier: startup.funding_tier,
              elevator_pitch: startup.elevator_pitch,
              exhibition_date: startup.exhibition_date,
              fundraising: startup.fundraising || false,
              meet_investors: startup.meet_investors || false,
              startup_women_founder: startup.startup_women_founder || false,
              startup_black_founder: startup.startup_black_founder || false,
              startup_indigenous_founder: startup.startup_indigenous_founder || false,
              endorsed_by: startup.endorsed_by,
              logo_url: startup.logo_urls?.original || startup.logo_urls?.large,
              show_in_kanban: false,
              kanban_column: 'backlog'
            })
            .select('id')
            .single();

          if (startupError) {
            console.error(`❌ Error inserting startup ${startup.company_id}:`, startupError);
            processedCount++;
            continue;
          }

          const startupId = insertedStartup.id;

          // Inserir URLs externas
          if (startup.external_urls && Object.keys(startup.external_urls).length > 0) {
            await supabaseClient
              .from('startup_external_urls')
              .insert({
                startup_id: startupId,
                ...startup.external_urls
              });
          }

          // Inserir membros da equipe
          if (startup.attendance_ids && startup.attendance_ids.length > 0) {
            const teamMembers = startup.attendance_ids[0]?.data?.attendance?.exhibitor?.team?.edges || [];
            
            for (const memberEdge of teamMembers) {
              const member = memberEdge.node;
              if (member && member.id) {
                await supabaseClient
                  .from('startup_team_members')
                  .insert({
                    startup_id: startupId,
                    member_id: member.id,
                    name: member.name || '',
                    job_title: member.jobTitle,
                    bio: member.bio,
                    avatar_url: member.avatarUrl,
                    first_name: member.firstName,
                    last_name: member.lastName,
                    email: member.email,
                    twitter_url: member.twitterUrl,
                    github_url: member.githubUrl,
                    facebook_url: member.facebookUrl,
                    city: member.city,
                    country_name: member.country?.name,
                    industry_name: member.industry?.name
                  });
              }
            }
          }

          // Inserir tópicos
          if (startup.attendance_ids && startup.attendance_ids.length > 0) {
            const attendance = startup.attendance_ids[0]?.data?.attendance;
            
            const offeringTopics = attendance?.offeringTopics?.edges || [];
            const seekingTopics = attendance?.seekingTopics?.edges || [];
            
            for (const topicEdge of offeringTopics) {
              const topic = topicEdge.node;
              if (topic && topic.id) {
                await supabaseClient
                  .from('startup_topics')
                  .insert({
                    startup_id: startupId,
                    topic_id: topic.id,
                    topic_name: topic.name,
                    topic_type: 'offering'
                  });
              }
            }
            
            for (const topicEdge of seekingTopics) {
              const topic = topicEdge.node;
              if (topic && topic.id) {
                await supabaseClient
                  .from('startup_topics')
                  .insert({
                    startup_id: startupId,
                    topic_id: topic.id,
                    topic_name: topic.name,
                    topic_type: 'seeking'
                  });
              }
            }
          }

          // Inserir tags
          if (startup.tags && startup.tags.length > 0) {
            for (const tag of startup.tags) {
              await supabaseClient
                .from('startup_tags')
                .insert({
                  startup_id: startupId,
                  tag_name: tag,
                  created_by: 'migration'
                });
            }
          }

          successfulInserts++;
          processedCount++;

          // Atualizar progresso a cada 5 inserções
          if (processedCount % 5 === 0) {
            await supabaseClient
              .from('migration_progress')
              .update({ processed_count: processedCount })
              .eq('file_name', fileName);
          }

        } catch (error) {
          console.error(`❌ Error processing startup ${startup.company_id}:`, error);
          processedCount++;
          continue;
        }
      }

      // Atualizar progresso final
      const isCompleted = processedCount >= startups.length;
      await supabaseClient
        .from('migration_progress')
        .update({
          processed_count: processedCount,
          status: isCompleted ? 'completed' : 'processing',
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('file_name', fileName);

      console.log(`✅ File ${fileName} processed: ${successfulInserts}/${processedCount} successful`);

      // **NOVA FUNCIONALIDADE: AUTO-CONTINUAÇÃO**
      if (isCompleted) {
        console.log('🔄 Arquivo concluído! Verificando se há próximo arquivo...');
        
        // Marcar como não executando temporariamente
        await supabaseClient
          .from('migration_control')
          .update({ is_running: false })
          .eq('id', controlData.id);

        // Verificar se há próximo arquivo
        const { data: nextCheck } = await supabaseClient.rpc('get_next_migration_file');
        
        if (nextCheck && nextCheck.length > 0) {
          console.log(`🚀 Próximo arquivo encontrado: ${nextCheck[0].file_name}. Auto-continuando...`);
          
          // Auto-chamar próximo arquivo após 2 segundos
          setTimeout(async () => {
            try {
              const { data: nextResult, error: nextError } = await supabaseClient.functions.invoke('migrate-data');
              console.log('🔄 Auto-continuação resultado:', nextResult);
              if (nextError) console.error('❌ Erro na auto-continuação:', nextError);
            } catch (error) {
              console.error('❌ Erro crítico na auto-continuação:', error);
            }
          }, 2000);
        } else {
          console.log('🎉 Todos os arquivos processados! Migração completa.');
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          file_name: fileName,
          processed_count: processedCount,
          successful_inserts: successfulInserts,
          total_count: startups.length,
          completed: isCompleted,
          auto_continue: isCompleted && await supabaseClient.rpc('get_next_migration_file').then(r => r.data?.length > 0)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error(`❌ Error processing file ${fileName}:`, error);
      
      // Marcar arquivo como falhado
      await supabaseClient
        .from('migration_progress')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('file_name', fileName);

      // Resetar is_running para permitir retry
      await supabaseClient
        .from('migration_control')
        .update({ is_running: false })
        .eq('id', controlData.id);

      throw error;
    }

  } catch (error) {
    console.error('💥 Migration error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})
