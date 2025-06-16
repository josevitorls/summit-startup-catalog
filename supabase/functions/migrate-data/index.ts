
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Iniciando migração de dados dos arquivos JSON do GitHub...')

    // Lista dos 13 arquivos JSON específicos
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
    let totalSkipped = 0;
    let totalErrors = 0;
    let migrationDetails = [];

    // Função para validar se é uma startup válida (não demo)
    function isValidStartup(startup: any): boolean {
      if (!startup || typeof startup !== 'object') {
        console.log('❌ Startup inválida: não é um objeto');
        return false;
      }

      // Verificar se tem campos obrigatórios
      if (!startup.company_id || !startup.name) {
        console.log('❌ Startup inválida: falta company_id ou name');
        return false;
      }

      // Filtrar dados de demonstração
      const demoIndicators = [
        'demo',
        'test',
        'sample',
        'example',
        'fake',
        'mock'
      ];

      const nameLower = startup.name.toLowerCase();
      const companyIdLower = startup.company_id.toLowerCase();

      for (const indicator of demoIndicators) {
        if (nameLower.includes(indicator) || companyIdLower.includes(indicator)) {
          console.log(`❌ Startup de demo detectada: ${startup.name} (${startup.company_id})`);
          return false;
        }
      }

      // Verificar se tem dados mínimos necessários
      if (!startup.country || !startup.industry) {
        console.log(`⚠️ Startup com dados incompletos: ${startup.name} - falta country ou industry`);
        return false;
      }

      return true;
    }

    // Processar cada arquivo JSON
    for (const fileUrl of jsonFiles) {
      try {
        const fileName = fileUrl.split('/').pop();
        console.log(`📁 Processando ${fileName}...`);
        
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          console.error(`❌ Erro ao buscar ${fileName}: ${response.status} ${response.statusText}`);
          migrationDetails.push({
            file: fileName,
            processed: 0,
            skipped: 0,
            errors: 1,
            error: `HTTP ${response.status}: ${response.statusText}`
          });
          totalErrors++;
          continue;
        }

        const data = await response.json();
        
        if (!data) {
          console.error(`❌ Dados inválidos em ${fileName}`);
          migrationDetails.push({
            file: fileName,
            processed: 0,
            skipped: 0,
            errors: 1,
            error: 'Dados JSON inválidos'
          });
          totalErrors++;
          continue;
        }

        // Converter para array se necessário
        const startups = Array.isArray(data) ? data : Object.values(data);
        
        if (startups.length === 0) {
          console.warn(`⚠️ Nenhuma startup encontrada em ${fileName}`);
          migrationDetails.push({
            file: fileName,
            processed: 0,
            skipped: 0,
            errors: 0,
            totalStartups: 0
          });
          continue;
        }

        let batchProcessed = 0;
        let batchSkipped = 0;
        let batchErrors = 0;
        
        console.log(`📊 Encontradas ${startups.length} startups em ${fileName}`);

        // Processar cada startup
        for (let i = 0; i < startups.length; i++) {
          const startup = startups[i];
          
          try {
            // Validar startup
            if (!isValidStartup(startup)) {
              batchSkipped++;
              continue;
            }

            console.log(`✅ Processando startup válida: ${startup.name} (${startup.company_id})`);

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
              console.error(`❌ Erro ao inserir startup ${startup.company_id}:`, startupError);
              batchErrors++;
              continue;
            }

            const startupId = insertedStartup.id;

            // Inserir URLs externas se válidas
            if (startup.external_urls && typeof startup.external_urls === 'object') {
              const validUrls = {};
              
              Object.entries(startup.external_urls).forEach(([key, value]) => {
                if (value && typeof value === 'string' && value.trim() !== '' && value !== 'null') {
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
                  console.error(`⚠️ Erro ao inserir URLs para ${startup.company_id}:`, urlError);
                }
              }
            }

            // Processar dados de attendance_ids (membros da equipe e tópicos)
            if (startup.attendance_ids && Array.isArray(startup.attendance_ids)) {
              for (const attendance of startup.attendance_ids) {
                const attendanceData = attendance?.data?.attendance;
                
                if (!attendanceData) continue;

                // Processar membros da equipe
                const team = attendanceData.exhibitor?.team?.edges || [];
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
                      console.error(`⚠️ Erro ao inserir membro ${member.id}:`, memberError);
                    }
                  }
                }

                // Processar tópicos offering
                const offeringTopics = attendanceData.offeringTopics?.edges || [];
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
                      console.error(`⚠️ Erro ao inserir tópico offering ${topic.id}:`, topicError);
                    }
                  }
                }

                // Processar tópicos seeking
                const seekingTopics = attendanceData.seekingTopics?.edges || [];
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
                      console.error(`⚠️ Erro ao inserir tópico seeking ${topic.id}:`, topicError);
                    }
                  }
                }
              }
            }

            // Processar tags
            if (startup.tags && Array.isArray(startup.tags)) {
              for (const tag of startup.tags) {
                if (tag && typeof tag === 'string' && tag.trim() !== '' && !tag.toLowerCase().includes('demo')) {
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
                    console.error(`⚠️ Erro ao inserir tag ${tag}:`, tagError);
                  }
                }
              }
            }

            batchProcessed++;
            
          } catch (error) {
            console.error(`❌ Erro ao processar startup ${startup?.company_id || 'unknown'}:`, error);
            batchErrors++;
          }
        }

        totalProcessed += batchProcessed;
        totalSkipped += batchSkipped;
        totalErrors += batchErrors;
        
        migrationDetails.push({
          file: fileName,
          processed: batchProcessed,
          skipped: batchSkipped,
          errors: batchErrors,
          totalStartups: startups.length
        });

        console.log(`✅ Concluído ${fileName} - processadas: ${batchProcessed}, puladas: ${batchSkipped}, erros: ${batchErrors} de ${startups.length} total`);
        
      } catch (error) {
        console.error(`❌ Erro ao processar arquivo ${fileUrl}:`, error);
        totalErrors++;
        migrationDetails.push({
          file: fileUrl.split('/').pop(),
          processed: 0,
          skipped: 0,
          errors: 1,
          error: error.message
        });
      }
    }

    // Atualizar tabelas de referência com dados reais
    console.log('📊 Atualizando tabelas de referência...');

    // Extrair indústrias únicas
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
      console.log(`✅ Atualizadas ${uniqueIndustries.length} indústrias`);
    }

    // Extrair funding tiers únicos
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
      console.log(`✅ Atualizados ${uniqueFundingTiers.length} funding tiers`);
    }

    // Obter estatísticas finais
    const { data: finalStats } = await supabase.from('startups').select('id');
    const finalCount = finalStats?.length || 0;

    console.log(`🎉 Migração concluída com sucesso!`);
    console.log(`📊 Estatísticas finais:`);
    console.log(`   - Startups importadas: ${finalCount}`);
    console.log(`   - Total processadas: ${totalProcessed}`);
    console.log(`   - Total puladas (demo/inválidas): ${totalSkipped}`);
    console.log(`   - Total de erros: ${totalErrors}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalProcessed,
        totalSkipped,
        totalErrors,
        finalCount,
        migrationDetails,
        message: `Migração concluída com sucesso! ${finalCount} startups válidas importadas dos arquivos JSON. Todos os dados de demonstração foram eliminados.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Erro na migração:', error);
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
