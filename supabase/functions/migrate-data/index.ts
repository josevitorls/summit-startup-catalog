
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuração adaptativa e resiliente
const CONFIG = {
  MAX_EXECUTION_TIME: 105000, // 105s (deixando 5s para cleanup)
  CHECKPOINT_INTERVAL: 1, // Checkpoint a cada startup processada
  MAX_RETRIES: 3,
  INITIAL_BATCH_SIZE: 1,
  MAX_BATCH_SIZE: 3,
  BASE_RETRY_DELAY: 1000, // 1s
  TIMEOUT_PER_STARTUP: 5000, // 5s por startup
  PAUSE_CHECK_INTERVAL: 5, // Verificar pausa a cada 5 startups
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

// Health checker para monitoramento
class HealthChecker {
  constructor(private supabase: any) {}
  
  async checkStorageHealth(fileName: string): Promise<boolean> {
    try {
      const response = await fetch(`https://ondcyheslxgqwigoxwrg.supabase.co/storage/v1/object/public/startup-data/${fileName}`, {
        method: 'HEAD'
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('startups').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }

  async checkPauseFlag(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('migration_control')
        .select('is_paused')
        .single()
      
      return error ? false : data?.is_paused || false
    } catch {
      return false
    }
  }
}

// Processador resiliente com checkpoint granular e controle de pausa
class ResilientProcessor {
  private startTime: number
  private processedCount = 0
  private batchSize = CONFIG.INITIAL_BATCH_SIZE
  private healthChecker: HealthChecker
  
  constructor(private supabase: any) {
    this.startTime = Date.now()
    this.healthChecker = new HealthChecker(supabase)
  }
  
  private getRemainingTime(): number {
    return CONFIG.MAX_EXECUTION_TIME - (Date.now() - this.startTime)
  }
  
  private shouldContinue(): boolean {
    return this.getRemainingTime() > (CONFIG.TIMEOUT_PER_STARTUP * 2)
  }

  private async updateMigrationRunningState(isRunning: boolean) {
    try {
      await this.supabase
        .from('migration_control')
        .update({ is_running: isRunning })
        .eq('id', (await this.supabase.from('migration_control').select('id').single()).data.id)
    } catch (error) {
      console.warn('Failed to update running state:', error)
    }
  }
  
  private async updateCheckpoint(fileIndex: number, fileName: string, processedInFile: number, totalInFile: number, status: string) {
    try {
      await this.supabase
        .from('migration_progress')
        .upsert({
          batch_number: fileIndex,
          file_name: fileName,
          status,
          processed_count: processedInFile,
          total_count: totalInFile,
          started_at: status === 'processing' ? new Date().toISOString() : undefined,
          completed_at: status === 'completed' ? new Date().toISOString() : undefined,
        })
    } catch (error) {
      console.warn('Failed to update checkpoint:', error)
    }
  }
  
  private async retryWithBackoff<T>(operation: () => Promise<T>, context: string): Promise<T> {
    let lastError: any
    
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        console.warn(`Attempt ${attempt}/${CONFIG.MAX_RETRIES} failed for ${context}:`, error)
        
        if (attempt < CONFIG.MAX_RETRIES) {
          const delay = CONFIG.BASE_RETRY_DELAY * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }
  
  private adaptBatchSize(processingTime: number) {
    if (processingTime < 1000 && this.batchSize < CONFIG.MAX_BATCH_SIZE) {
      this.batchSize = Math.min(this.batchSize + 1, CONFIG.MAX_BATCH_SIZE)
    } else if (processingTime > 3000 && this.batchSize > 1) {
      this.batchSize = Math.max(this.batchSize - 1, 1)
    }
  }

  private async checkIfStartupExists(companyId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('startups')
        .select('id')
        .eq('company_id', companyId)
        .maybeSingle()

      if (error) return false
      return !!data
    } catch {
      return false
    }
  }
  
  async processStartup(startup: any, insertedId: string): Promise<boolean> {
    const startupStartTime = Date.now()
    
    try {
      // Processar URLs externas de forma resiliente
      if (startup.external_urls && Object.keys(startup.external_urls).length > 0) {
        await this.retryWithBackoff(async () => {
          const { error } = await this.supabase
            .from('startup_external_urls')
            .upsert({
              startup_id: insertedId,
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
          
          if (error) throw error
        }, `external URLs for ${startup.company_id}`)
      }

      // Processar tags de forma resiliente
      if (startup.tags && Array.isArray(startup.tags) && startup.tags.length > 0) {
        await this.retryWithBackoff(async () => {
          const tagInserts = startup.tags.map(tag => ({
            startup_id: insertedId,
            tag_name: tag,
            created_by: 'migration'
          }))

          const { error } = await this.supabase
            .from('startup_tags')
            .upsert(tagInserts, { onConflict: 'startup_id,tag_name' })
          
          if (error) throw error
        }, `tags for ${startup.company_id}`)
      }

      // Processar membros da equipe e tópicos de forma resiliente
      if (startup.attendance_ids && Array.isArray(startup.attendance_ids)) {
        for (const attendance of startup.attendance_ids) {
          if (!attendance?.data?.attendance) continue

          // Team members
          const team = attendance.data.attendance.exhibitor?.team?.edges || []
          if (team.length > 0) {
            await this.retryWithBackoff(async () => {
              const memberInserts = team.map(memberEdge => {
                const member = memberEdge.node
                return {
                  startup_id: insertedId,
                  member_id: member.id || `temp-${Date.now()}`,
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
                }
              })

              const { error } = await this.supabase
                .from('startup_team_members')
                .upsert(memberInserts, { onConflict: 'startup_id,member_id' })
              
              if (error) throw error
            }, `team members for ${startup.company_id}`)
          }

          // Topics (offering e seeking)
          const allTopics = [
            ...(attendance.data.attendance.offeringTopics?.edges || []).map(edge => ({
              ...edge.node,
              topic_type: 'offering'
            })),
            ...(attendance.data.attendance.seekingTopics?.edges || []).map(edge => ({
              ...edge.node,
              topic_type: 'seeking'
            }))
          ]

          if (allTopics.length > 0) {
            await this.retryWithBackoff(async () => {
              const topicInserts = allTopics.map(topic => ({
                startup_id: insertedId,
                topic_id: topic.id || `temp-${Date.now()}`,
                topic_name: topic.name,
                topic_type: topic.topic_type
              }))

              const { error } = await this.supabase
                .from('startup_topics')
                .upsert(topicInserts, { onConflict: 'startup_id,topic_id,topic_type' })
              
              if (error) throw error
            }, `topics for ${startup.company_id}`)
          }
        }
      }

      const processingTime = Date.now() - startupStartTime
      this.adaptBatchSize(processingTime)
      
      return true
    } catch (error) {
      console.error(`Failed to process startup ${startup.company_id} after retries:`, error)
      return false
    }
  }
  
  async processFile(fileIndex: number, fileName: string, resumeFrom: number = 0): Promise<{ processed: number; total: number; success: boolean; paused: boolean }> {
    console.log(`🚀 Processing file: ${fileName} (resuming from ${resumeFrom})`)
    
    // Marcar migração como em execução
    await this.updateMigrationRunningState(true)
    
    // Health check antes de processar
    const storageHealthy = await this.healthChecker.checkStorageHealth(fileName)
    const dbHealthy = await this.healthChecker.checkDatabaseHealth()
    const isPaused = await this.healthChecker.checkPauseFlag()
    
    if (isPaused) {
      console.log('🛑 Migration is paused, stopping execution')
      await this.updateMigrationRunningState(false)
      return { processed: resumeFrom, total: 0, success: false, paused: true }
    }
    
    if (!storageHealthy || !dbHealthy) {
      console.error(`Health check failed: storage=${storageHealthy}, db=${dbHealthy}`)
      await this.updateCheckpoint(fileIndex, fileName, resumeFrom, 0, 'failed')
      await this.updateMigrationRunningState(false)
      return { processed: resumeFrom, total: 0, success: false, paused: false }
    }

    await this.updateCheckpoint(fileIndex, fileName, resumeFrom, 0, 'processing')

    try {
      // Fetch file com timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const response = await fetch(
        `https://ondcyheslxgqwigoxwrg.supabase.co/storage/v1/object/public/startup-data/${fileName}`,
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`)
      }

      const data = await response.json()
      const startups = Array.isArray(data) ? data : Object.values(data)
      
      console.log(`📊 Found ${startups.length} startups in ${fileName}, starting from ${resumeFrom}`)
      
      let processedInFile = resumeFrom
      let successfullyProcessed = 0
      
      // Processar startups com batch adaptativo, começando do ponto de retomada
      for (let i = resumeFrom; i < startups.length && this.shouldContinue(); i += this.batchSize) {
        // Verificar flag de pausa periodicamente
        if (i % CONFIG.PAUSE_CHECK_INTERVAL === 0) {
          const isPausedNow = await this.healthChecker.checkPauseFlag()
          if (isPausedNow) {
            console.log(`🛑 Migration paused at startup ${i}, saving checkpoint...`)
            await this.updateCheckpoint(fileIndex, fileName, processedInFile, startups.length, 'processing')
            await this.updateMigrationRunningState(false)
            return { processed: processedInFile, total: startups.length, success: false, paused: true }
          }
        }
        
        const batch = startups.slice(i, i + this.batchSize)
        
        for (const startup of batch) {
          if (!this.shouldContinue()) {
            console.log(`⏰ Time limit approaching, stopping at ${processedInFile}/${startups.length}`)
            break
          }
          
          try {
            // Verificar se startup já existe (deduplicação)
            const exists = await this.checkIfStartupExists(startup.company_id)
            if (exists) {
              console.log(`⏭️ Startup ${startup.company_id} already exists, skipping...`)
              processedInFile++
              continue
            }

            // Inserir startup principal com UPSERT
            const { data: insertedStartup, error: startupError } = await this.supabase
              .from('startups')
              .upsert({
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
              }, { onConflict: 'company_id' })
              .select()
              .single()

            if (startupError) {
              console.error(`❌ Error inserting startup ${startup.company_id}:`, startupError)
              processedInFile++
              continue
            }

            // Processar dados relacionados
            const relationshipSuccess = await this.processStartup(startup, insertedStartup.id)
            
            if (relationshipSuccess) {
              successfullyProcessed++
            }
            
            processedInFile++
            
            // Checkpoint granular a cada startup
            if (processedInFile % CONFIG.CHECKPOINT_INTERVAL === 0) {
              await this.updateCheckpoint(fileIndex, fileName, processedInFile, startups.length, 'processing')
            }
            
          } catch (error) {
            console.error(`❌ Error processing startup ${startup.company_id}:`, error)
            processedInFile++
            continue
          }
        }
      }

      // Checkpoint final
      const isComplete = processedInFile >= startups.length
      await this.updateCheckpoint(
        fileIndex, 
        fileName, 
        processedInFile, 
        startups.length, 
        isComplete ? 'completed' : 'processing'
      )

      await this.updateMigrationRunningState(false)

      console.log(`✅ File ${fileName} processed: ${successfullyProcessed}/${processedInFile} successful`)
      
      return { 
        processed: processedInFile, 
        total: startups.length, 
        success: isComplete,
        paused: false
      }

    } catch (error) {
      console.error(`💥 Error processing file ${fileName}:`, error)
      await this.updateCheckpoint(fileIndex, fileName, resumeFrom, 0, 'failed')
      await this.updateMigrationRunningState(false)
      return { processed: resumeFrom, total: 0, success: false, paused: false }
    }
  }
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

    console.log('🚀 Starting ultra-resilient migration process with manual controls...')

    // Verificar se migração está pausada
    const { data: controlState } = await supabaseClient
      .from('migration_control')
      .select('is_paused')
      .single()

    if (controlState?.is_paused) {
      console.log('🛑 Migration is paused, not starting')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Migration is paused',
          paused: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Usar função SQL para obter próximo arquivo
    const { data: nextFileData, error: nextFileError } = await supabaseClient
      .rpc('get_next_migration_file')

    if (nextFileError) {
      console.error('Failed to get next file:', nextFileError)
      throw nextFileError
    }

    if (!nextFileData || nextFileData.length === 0) {
      console.log('🎉 All files have been processed!')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Migration completed - all files processed',
          isComplete: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const { file_name: fileName, batch_number: fileIndex, resume_from: resumeFrom } = nextFileData[0]
    
    console.log(`📍 Processing file: ${fileName} (index: ${fileIndex}, resume from: ${resumeFrom})`)
    
    const processor = new ResilientProcessor(supabaseClient)
    
    // Processar arquivo com sistema resiliente
    const result = await processor.processFile(fileIndex, fileName, resumeFrom)
    
    if (result.paused) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Migration paused during processing of ${fileName}`,
          file: fileName,
          processed: result.processed,
          total: result.total,
          paused: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
    
    // Determinar se deve continuar automaticamente
    const shouldTriggerNext = result.success && fileIndex < JSON_FILES.length - 1
    
    if (shouldTriggerNext) {
      console.log(`🔄 File ${fileName} completed. Triggering next file...`)
      
      // Trigger próximo arquivo com delay para evitar overlap
      setTimeout(async () => {
        try {
          await fetch(`https://ondcyheslxgqwigoxwrg.supabase.co/functions/v1/migrate-data`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Error triggering next batch:', error)
        }
      }, 3000) // 3s delay
    }

    const responseMessage = result.success 
      ? `Successfully processed ${result.processed}/${result.total} startups from ${fileName}`
      : `Partially processed ${result.processed}/${result.total} startups from ${fileName}`

    return new Response(
      JSON.stringify({
        success: result.success,
        message: responseMessage,
        file: fileName,
        processed: result.processed,
        total: result.total,
        isComplete: fileIndex >= JSON_FILES.length - 1 && result.success,
        nextFile: shouldTriggerNext ? JSON_FILES[fileIndex + 1] : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Migration error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
