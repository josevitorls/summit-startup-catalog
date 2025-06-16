
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting data migration from GitHub JSON files...')

    // Lista dos arquivos JSON reais para processar - URLs completas do GitHub
    const jsonFiles = [
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_0-99.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_100-199.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_200-299.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_300-399.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_400-499.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_500-599.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_600-699.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_700-799.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_800-899.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_900-999.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_1000-1099.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_1100-1199.json',
      'https://raw.githubusercontent.com/Collince-Okeyo/startup-directory/main/processed_batch_1200-1277.json',
    ];

    let totalProcessed = 0;
    let totalErrors = 0;
    let migrationDetails = [];

    // ETAPA 1: Limpar TODOS os dados existentes do banco
    console.log('Clearing all existing data from database...');
    
    try {
      // Deletar dados de startups e tabelas relacionadas na ordem correta
      await supabase.from('startup_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('startup_topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('startup_team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('startup_external_urls').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('startups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      console.log('All existing data cleared successfully');
    } catch (error) {
      console.error('Error clearing existing data:', error);
    }

    // ETAPA 2: Processar arquivos JSON reais do GitHub
    for (const fileUrl of jsonFiles) {
      try {
        const fileName = fileUrl.split('/').pop();
        console.log(`Processing ${fileName} from GitHub...`);
        
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          console.error(`Failed to fetch ${fileName}: ${response.status} ${response.statusText}`);
          migrationDetails.push({
            file: fileName,
            processed: 0,
            errors: 1,
            error: `HTTP ${response.status}: ${response.statusText}`
          });
          totalErrors++;
          continue;
        }

        const data = await response.json();
        
        if (!data || (!Array.isArray(data) && typeof data !== 'object')) {
          console.error(`Invalid data format in ${fileName}`);
          migrationDetails.push({
            file: fileName,
            processed: 0,
            errors: 1,
            error: 'Invalid JSON format'
          });
          totalErrors++;
          continue;
        }

        // Converter objeto para array se necessário
        const startups = Array.isArray(data) ? data : Object.values(data);
        
        if (startups.length === 0) {
          console.warn(`No startups found in ${fileName}`);
          migrationDetails.push({
            file: fileName,
            processed: 0,
            errors: 0,
            totalStartups: 0
          });
          continue;
        }

        let batchProcessed = 0;
        let batchErrors = 0;
        
        // ETAPA 3: Validar e processar cada startup
        for (const startup of startups) {
          try {
            // Validação rigorosa: apenas startups com dados reais
            if (!startup.company_id || 
                !startup.name || 
                startup.company_id.startsWith('demo_') ||
                startup.name.includes('Demo Startup')) {
              console.warn(`Skipping invalid/demo startup: ${startup.company_id || 'unknown'}`);
              continue;
            }

            // Inserir startup principal
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
                logo_url: startup.logo_urls?.large || startup.logo_urls?.medium || startup.logo_urls?.thumb || null,
                show_in_kanban: false,
                kanban_column: 'backlog'
              }, { 
                onConflict: 'company_id',
                ignoreDuplicates: false 
              })
              .select()
              .single()

            if (startupError) {
              console.error(`Error inserting startup ${startup.company_id}:`, startupError);
              batchErrors++;
              continue;
            }

            const startupId = insertedStartup.id;

            // Inserir URLs externas (apenas se válidas)
            if (startup.external_urls && Object.keys(startup.external_urls).length > 0) {
              const validUrls = {};
              Object.entries(startup.external_urls).forEach(([key, value]) => {
                if (value && typeof value === 'string' && value.trim() !== '') {
                  validUrls[key] = value.trim();
                }
              });

              if (Object.keys(validUrls).length > 0) {
                const { error: urlError } = await supabase
                  .from('startup_external_urls')
                  .upsert({
                    startup_id: startupId,
                    ...validUrls
                  }, {
                    onConflict: 'startup_id',
                    ignoreDuplicates: false
                  });

                if (urlError) {
                  console.error(`Error inserting URLs for ${startup.company_id}:`, urlError);
                }
              }
            }

            // Processar membros da equipe
            if (startup.attendance_ids && startup.attendance_ids.length > 0) {
              for (const attendance of startup.attendance_ids) {
                const team = attendance?.data?.attendance?.exhibitor?.team?.edges || [];
                
                for (const memberEdge of team) {
                  const member = memberEdge.node;
                  
                  if (member && member.id && member.name) {
                    const { error: memberError } = await supabase
                      .from('startup_team_members')
                      .upsert({
                        startup_id: startupId,
                        member_id: member.id,
                        name: member.name,
                        job_title: member.jobTitle || null,
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
                        industry_name: member.industry?.name || null
                      }, { 
                        onConflict: 'startup_id,member_id',
                        ignoreDuplicates: true 
                      });

                    if (memberError) {
                      console.error(`Error inserting member ${member.id}:`, memberError);
                    }
                  }
                }

                // Processar tópicos offering
                const offeringTopics = attendance?.data?.attendance?.offeringTopics?.edges || [];
                for (const topicEdge of offeringTopics) {
                  const topic = topicEdge.node;
                  
                  if (topic && topic.id && topic.name) {
                    const { error: topicError } = await supabase
                      .from('startup_topics')
                      .upsert({
                        startup_id: startupId,
                        topic_id: topic.id,
                        topic_name: topic.name,
                        topic_type: 'offering'
                      }, { 
                        onConflict: 'startup_id,topic_id,topic_type',
                        ignoreDuplicates: true 
                      });

                    if (topicError) {
                      console.error(`Error inserting offering topic ${topic.id}:`, topicError);
                    }
                  }
                }

                // Processar tópicos seeking
                const seekingTopics = attendance?.data?.attendance?.seekingTopics?.edges || [];
                for (const topicEdge of seekingTopics) {
                  const topic = topicEdge.node;
                  
                  if (topic && topic.id && topic.name) {
                    const { error: topicError } = await supabase
                      .from('startup_topics')
                      .upsert({
                        startup_id: startupId,
                        topic_id: topic.id,
                        topic_name: topic.name,
                        topic_type: 'seeking'
                      }, { 
                        onConflict: 'startup_id,topic_id,topic_type',
                        ignoreDuplicates: true 
                      });

                    if (topicError) {
                      console.error(`Error inserting seeking topic ${topic.id}:`, topicError);
                    }
                  }
                }
              }
            }

            // Adicionar tags válidas
            if (startup.tags && Array.isArray(startup.tags) && startup.tags.length > 0) {
              for (const tag of startup.tags) {
                if (tag && typeof tag === 'string' && tag.trim() !== '' && tag !== 'demo') {
                  const { error: tagError } = await supabase
                    .from('startup_tags')
                    .upsert({
                      startup_id: startupId,
                      tag_name: tag.trim(),
                      created_by: 'migration'
                    }, { 
                      onConflict: 'startup_id,tag_name',
                      ignoreDuplicates: true 
                    });

                  if (tagError) {
                    console.error(`Error inserting tag ${tag}:`, tagError);
                  }
                }
              }
            }

            batchProcessed++;
            
          } catch (error) {
            console.error(`Error processing startup ${startup.company_id}:`, error);
            batchErrors++;
          }
        }

        totalProcessed += batchProcessed;
        totalErrors += batchErrors;
        
        migrationDetails.push({
          file: fileName,
          processed: batchProcessed,
          errors: batchErrors,
          totalStartups: startups.length
        });

        console.log(`Completed ${fileName} - processed ${batchProcessed}/${startups.length} valid startups (${batchErrors} errors)`);
        
      } catch (error) {
        console.error(`Error processing file ${fileUrl}:`, error);
        totalErrors++;
        migrationDetails.push({
          file: fileUrl.split('/').pop(),
          processed: 0,
          errors: 1,
          error: error.message
        });
      }
    }

    // ETAPA 4: Atualizar tabelas de referência com dados reais
    console.log('Updating reference tables with real data...');

    // Extrair indústrias únicas dos dados reais
    const { data: industries } = await supabase
      .from('startups')
      .select('industry')
      .not('industry', 'is', null)
      .neq('industry', '');

    if (industries && industries.length > 0) {
      const uniqueIndustries = [...new Set(industries.map(i => i.industry))];
      for (const industry of uniqueIndustries) {
        await supabase
          .from('industries')
          .upsert({ name: industry }, { onConflict: 'name', ignoreDuplicates: true });
      }
      console.log(`Updated ${uniqueIndustries.length} industries`);
    }

    // Extrair funding tiers únicos dos dados reais
    const { data: fundingTiers } = await supabase
      .from('startups')
      .select('funding_tier')
      .not('funding_tier', 'is', null)
      .neq('funding_tier', '');

    if (fundingTiers && fundingTiers.length > 0) {
      const uniqueFundingTiers = [...new Set(fundingTiers.map(f => f.funding_tier))];
      for (const tier of uniqueFundingTiers) {
        await supabase
          .from('funding_tiers')
          .upsert({ name: tier }, { onConflict: 'name', ignoreDuplicates: true });
      }
      console.log(`Updated ${uniqueFundingTiers.length} funding tiers`);
    }

    // Obter estatísticas finais
    const { data: finalStats } = await supabase
      .from('startups')
      .select('id');

    const finalCount = finalStats?.length || 0;

    console.log(`Migration completed! Real startups in database: ${finalCount}, Total processed: ${totalProcessed}, Errors: ${totalErrors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalProcessed,
        totalErrors,
        finalCount,
        migrationDetails,
        message: `Migration completed successfully. ${finalCount} real startups imported from GitHub JSON files. All demo data eliminated.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})
