
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting optimized migration process...')

    // Get migration progress to resume from where we left off
    const { data: progressData } = await supabaseClient
      .from('migration_progress')
      .select('*')
      .order('batch_number', { ascending: false })
      .limit(1)
      .single()

    let startBatch = 0
    let processedCount = 0

    if (progressData && progressData.status !== 'completed') {
      startBatch = progressData.batch_number || 0
      processedCount = progressData.processed_count || 0
      console.log(`Resuming from batch ${startBatch}, processed: ${processedCount}`)
    }

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
    ]

    // Process only one file in this execution to stay within limits
    const currentFileIndex = Math.min(startBatch, JSON_FILES.length - 1)
    const fileName = JSON_FILES[currentFileIndex]

    console.log(`Processing file: ${fileName}`)

    // Update progress status to processing
    await supabaseClient
      .from('migration_progress')
      .upsert({
        batch_number: currentFileIndex,
        file_name: fileName,
        status: 'processing',
        started_at: new Date().toISOString(),
        processed_count: processedCount
      })

    try {
      const response = await fetch(`https://ondcyheslxgqwigoxwrg.supabase.co/storage/v1/object/public/startup-data/${fileName}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`)
      }

      const data = await response.json()
      const startups = Array.isArray(data) ? data : Object.values(data)

      console.log(`Found ${startups.length} startups in ${fileName}`)

      // Process startups in micro-batches of 5 to avoid timeouts
      const MICRO_BATCH_SIZE = 5
      let batchProcessed = 0

      for (let i = 0; i < startups.length; i += MICRO_BATCH_SIZE) {
        const microBatch = startups.slice(i, i + MICRO_BATCH_SIZE)
        
        for (const startup of microBatch) {
          try {
            const startTime = Date.now()
            
            // Check if startup already exists
            const { data: existingStartup } = await supabaseClient
              .from('startups')
              .select('id')
              .eq('company_id', startup.company_id)
              .maybeSingle()

            if (existingStartup) {
              console.log(`Startup ${startup.company_id} already exists, skipping...`)
              continue
            }

            // Insert startup with ALL fields including new ones
            const { data: insertedStartup, error: startupError } = await supabaseClient
              .from('startups')
              .insert({
                company_id: startup.company_id,
                name: startup.name || '',
                city: startup.city || null,
                province: startup.province || null,
                country: startup.country || null,
                industry: startup.industry || null,
                funding_tier: startup.funding_tier || null,
                elevator_pitch: startup.elevator_pitch || '',
                exhibition_date: startup.exhibition_date || null,
                fundraising: startup.fundraising || false,
                meet_investors: startup.meet_investors || false,
                startup_women_founder: startup.startup_women_founder || false,
                startup_black_founder: startup.startup_black_founder || false,
                startup_indigenous_founder: startup.startup_indigenous_founder || false,
                endorsed_by: startup.endorsed_by || null,
                logo_url: startup.logo_urls?.medium || startup.logo_urls?.large || startup.logo_urls?.original || null,
                show_in_kanban: false,
                kanban_column: 'backlog'
              })
              .select()
              .single()

            if (startupError) {
              console.error(`Error inserting startup ${startup.company_id}:`, startupError)
              continue
            }

            // Insert external URLs
            if (startup.external_urls && Object.keys(startup.external_urls).length > 0) {
              await supabaseClient
                .from('startup_external_urls')
                .insert({
                  startup_id: insertedStartup.id,
                  homepage: startup.external_urls.homepage || null,
                  angellist: startup.external_urls.angellist || null,
                  crunchbase: startup.external_urls.crunchbase || null,
                  instagram: startup.external_urls.instagram || null,
                  twitter: startup.external_urls.twitter || null,
                  facebook: startup.external_urls.facebook || null,
                  linkedin: startup.external_urls.linkedin || null,
                  youtube: startup.external_urls.youtube || null,
                  alternative_website: startup.external_urls.alternative_website || null
                })
            }

            // Insert tags
            if (startup.tags && startup.tags.length > 0) {
              const tagInserts = startup.tags.map(tag => ({
                startup_id: insertedStartup.id,
                tag_name: tag,
                created_by: 'migration'
              }))

              await supabaseClient
                .from('startup_tags')
                .insert(tagInserts)
            }

            // Insert team members
            if (startup.attendance_ids && startup.attendance_ids.length > 0) {
              for (const attendance of startup.attendance_ids) {
                const team = attendance.data?.attendance?.exhibitor?.team?.edges || []
                
                for (const memberEdge of team) {
                  const member = memberEdge.node
                  if (member && member.id) {
                    await supabaseClient
                      .from('startup_team_members')
                      .insert({
                        startup_id: insertedStartup.id,
                        member_id: member.id,
                        name: member.name || '',
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
                        industry_name: member.industry?.name || null
                      })
                  }
                }

                // Insert topics
                const offeringTopics = attendance.data?.attendance?.offeringTopics?.edges || []
                const seekingTopics = attendance.data?.attendance?.seekingTopics?.edges || []

                for (const topicEdge of offeringTopics) {
                  const topic = topicEdge.node
                  if (topic && topic.id) {
                    await supabaseClient
                      .from('startup_topics')
                      .insert({
                        startup_id: insertedStartup.id,
                        topic_id: topic.id,
                        topic_name: topic.name,
                        topic_type: 'offering'
                      })
                  }
                }

                for (const topicEdge of seekingTopics) {
                  const topic = topicEdge.node
                  if (topic && topic.id) {
                    await supabaseClient
                      .from('startup_topics')
                      .insert({
                        startup_id: insertedStartup.id,
                        topic_id: topic.id,
                        topic_name: topic.name,
                        topic_type: 'seeking'
                      })
                  }
                }
              }
            }

            batchProcessed++
            const elapsedTime = Date.now() - startTime
            
            // If processing is taking too long, break and continue in next execution
            if (elapsedTime > 1000) { // More than 1 second per startup
              console.log(`Processing time per startup is too high (${elapsedTime}ms), breaking...`)
              break
            }
            
          } catch (error) {
            console.error(`Error processing startup ${startup.company_id}:`, error)
            continue
          }
        }
        
        // Update progress after each micro-batch
        const newProcessedCount = processedCount + batchProcessed
        await supabaseClient
          .from('migration_progress')
          .upsert({
            batch_number: currentFileIndex,
            file_name: fileName,
            status: 'processing',
            processed_count: newProcessedCount,
            total_count: startups.length
          })
      }

      // Mark current file as completed and trigger next file if not the last one
      const isLastFile = currentFileIndex >= JSON_FILES.length - 1
      const finalProcessedCount = processedCount + batchProcessed

      await supabaseClient
        .from('migration_progress')
        .upsert({
          batch_number: currentFileIndex,
          file_name: fileName,
          status: isLastFile ? 'completed' : 'completed',
          completed_at: new Date().toISOString(),
          processed_count: finalProcessedCount,
          total_count: startups.length
        })

      // If not the last file, trigger next batch
      if (!isLastFile) {
        console.log(`File ${fileName} completed. Starting next file...`)
        
        // Trigger next batch with a small delay
        setTimeout(async () => {
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/migrate-data`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                'Content-Type': 'application/json',
              },
            })
          } catch (error) {
            console.error('Error triggering next batch:', error)
          }
        }, 2000)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${batchProcessed} startups from ${fileName}`,
          file: fileName,
          processed: finalProcessedCount,
          total: startups.length,
          isComplete: isLastFile
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

    } catch (error) {
      console.error(`Error processing file ${fileName}:`, error)
      
      await supabaseClient
        .from('migration_progress')
        .upsert({
          batch_number: currentFileIndex,
          file_name: fileName,
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })

      throw error
    }

  } catch (error) {
    console.error('Migration error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
