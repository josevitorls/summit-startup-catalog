
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

    console.log('Starting data migration...')

    // Lista dos arquivos JSON para processar
    const jsonFiles = [
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

    let totalProcessed = 0;
    let totalErrors = 0;

    for (const fileName of jsonFiles) {
      try {
        console.log(`Processing ${fileName}...`)
        
        // Fazer fetch do arquivo JSON
        const response = await fetch(`https://ondcyheslxgqwigoxwrg.supabase.co/storage/v1/object/public/startup-assets/${fileName}`)
        
        if (!response.ok) {
          // Se não existir no storage, tentar URL original
          const fallbackResponse = await fetch(`/${fileName}`)
          if (!fallbackResponse.ok) {
            console.warn(`Failed to load ${fileName}`)
            continue
          }
          var data = await fallbackResponse.json()
        } else {
          var data = await response.json()
        }

        // Processar dados
        const startups = Array.isArray(data) ? data : Object.values(data)
        
        for (const startup of startups) {
          try {
            // Inserir startup principal
            const { data: insertedStartup, error: startupError } = await supabase
              .from('startups')
              .upsert({
                company_id: startup.company_id,
                name: startup.name,
                city: startup.city,
                province: startup.province,
                country: startup.country,
                industry: startup.industry,
                funding_tier: startup.funding_tier || 'Not specified',
                elevator_pitch: startup.elevator_pitch || '',
                exhibition_date: startup.exhibition_date,
                fundraising: startup.fundraising || false,
                meet_investors: startup.meet_investors || false,
                startup_women_founder: startup.startup_women_founder || false,
                startup_black_founder: startup.startup_black_founder || false,
                startup_indigenous_founder: startup.startup_indigenous_founder || false,
                endorsed_by: startup.endorsed_by,
                logo_url: startup.logo_urls?.large || startup.logo_urls?.medium || startup.logo_urls?.thumb,
                show_in_kanban: false,
                kanban_column: 'backlog'
              }, { 
                onConflict: 'company_id',
                ignoreDuplicates: false 
              })
              .select()
              .single()

            if (startupError) {
              console.error(`Error inserting startup ${startup.company_id}:`, startupError)
              totalErrors++
              continue
            }

            const startupId = insertedStartup.id

            // Inserir URLs externas
            if (startup.external_urls && Object.keys(startup.external_urls).length > 0) {
              const { error: urlError } = await supabase
                .from('startup_external_urls')
                .upsert({
                  startup_id: startupId,
                  homepage: startup.external_urls.homepage,
                  angellist: startup.external_urls.angellist,
                  crunchbase: startup.external_urls.crunchbase,
                  instagram: startup.external_urls.instagram,
                  twitter: startup.external_urls.twitter,
                  facebook: startup.external_urls.facebook,
                  linkedin: startup.external_urls.linkedin,
                  youtube: startup.external_urls.youtube,
                  alternative_website: startup.external_urls.alternative_website
                })

              if (urlError) {
                console.error(`Error inserting URLs for ${startup.company_id}:`, urlError)
              }
            }

            // Processar membros da equipe
            if (startup.attendance_ids && startup.attendance_ids.length > 0) {
              for (const attendance of startup.attendance_ids) {
                const team = attendance?.data?.attendance?.exhibitor?.team?.edges || []
                
                for (const memberEdge of team) {
                  const member = memberEdge.node
                  
                  const { error: memberError } = await supabase
                    .from('startup_team_members')
                    .upsert({
                      startup_id: startupId,
                      member_id: member.id,
                      name: member.name,
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
                    }, { 
                      onConflict: 'startup_id,member_id',
                      ignoreDuplicates: true 
                    })

                  if (memberError) {
                    console.error(`Error inserting member ${member.id}:`, memberError)
                  }
                }

                // Processar tópicos offering
                const offeringTopics = attendance?.data?.attendance?.offeringTopics?.edges || []
                for (const topicEdge of offeringTopics) {
                  const topic = topicEdge.node
                  
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
                    })

                  if (topicError) {
                    console.error(`Error inserting offering topic ${topic.id}:`, topicError)
                  }
                }

                // Processar tópicos seeking
                const seekingTopics = attendance?.data?.attendance?.seekingTopics?.edges || []
                for (const topicEdge of seekingTopics) {
                  const topic = topicEdge.node
                  
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
                    })

                  if (topicError) {
                    console.error(`Error inserting seeking topic ${topic.id}:`, topicError)
                  }
                }
              }
            }

            // Adicionar tags padrão se existirem
            if (startup.tags && startup.tags.length > 0) {
              for (const tag of startup.tags) {
                const { error: tagError } = await supabase
                  .from('startup_tags')
                  .upsert({
                    startup_id: startupId,
                    tag_name: tag,
                    created_by: 'migration'
                  }, { 
                    onConflict: 'startup_id,tag_name',
                    ignoreDuplicates: true 
                  })

                if (tagError) {
                  console.error(`Error inserting tag ${tag}:`, tagError)
                }
              }
            }

            totalProcessed++
            
          } catch (error) {
            console.error(`Error processing startup ${startup.company_id}:`, error)
            totalErrors++
          }
        }

        console.log(`Completed ${fileName} - processed ${startups.length} startups`)
        
      } catch (error) {
        console.error(`Error processing file ${fileName}:`, error)
        totalErrors++
      }
    }

    // Atualizar tabelas de referência
    console.log('Updating reference tables...')

    // Extrair indústrias únicas
    const { data: industries } = await supabase
      .from('startups')
      .select('industry')
      .not('industry', 'is', null)

    if (industries) {
      const uniqueIndustries = [...new Set(industries.map(i => i.industry))]
      for (const industry of uniqueIndustries) {
        await supabase
          .from('industries')
          .upsert({ name: industry }, { onConflict: 'name', ignoreDuplicates: true })
      }
    }

    // Extrair funding tiers únicos
    const { data: fundingTiers } = await supabase
      .from('startups')
      .select('funding_tier')
      .not('funding_tier', 'is', null)

    if (fundingTiers) {
      const uniqueFundingTiers = [...new Set(fundingTiers.map(f => f.funding_tier))]
      for (const tier of uniqueFundingTiers) {
        await supabase
          .from('funding_tiers')
          .upsert({ name: tier }, { onConflict: 'name', ignoreDuplicates: true })
      }
    }

    console.log(`Migration completed! Processed: ${totalProcessed}, Errors: ${totalErrors}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: totalProcessed, 
        errors: totalErrors,
        message: 'Data migration completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Migration error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
