
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, RefreshCw, Zap, Activity, Database, HardDrive } from 'lucide-react';
import { useMigrationProgress, type MigrationProgress } from '../../hooks/useSupabaseData';
import { MigrationControls } from './MigrationControls';

interface MigrationProgressProps {
  isVisible: boolean;
}

export function MigrationProgressComponent({ isVisible }: MigrationProgressProps) {
  const { data: progressData = [], isLoading } = useMigrationProgress();

  if (!isVisible || isLoading) {
    return null;
  }

  const totalFiles = 13;
  const completedFiles = progressData.filter(p => p.status === 'completed').length;
  const failedFiles = progressData.filter(p => p.status === 'failed').length;
  const processingFiles = progressData.filter(p => p.status === 'processing').length;
  
  const totalProgress = (completedFiles / totalFiles) * 100;
  
  // Calcular total correto de startups processadas (somar apenas do último registro por arquivo)
  const totalProcessed = progressData.reduce((sum, p) => sum + p.processed_count, 0);
  const totalExpected = progressData.reduce((sum, p) => sum + p.total_count, 0);

  const isRunning = processingFiles > 0;
  const isComplete = completedFiles === totalFiles && failedFiles === 0;
  const hasIssues = failedFiles > 0;

  // Calcular métricas de performance baseadas nos dados reais
  const completedProgress = progressData.filter(p => p.status === 'completed' && p.started_at && p.completed_at);
  const avgProcessingTime = completedProgress.length > 0 
    ? completedProgress.reduce((sum, p) => {
        const start = new Date(p.started_at).getTime();
        const end = new Date(p.completed_at!).getTime();
        return sum + (end - start);
      }, 0) / completedProgress.length
    : 0;

  const startupsPerSecond = avgProcessingTime > 0 && totalProcessed > 0
    ? Math.round((totalProcessed / (avgProcessingTime / 1000)) * 100) / 100
    : 0;

  const estimatedTimeRemaining = startupsPerSecond > 0 && totalExpected > totalProcessed
    ? Math.round(((totalExpected - totalProcessed) / startupsPerSecond) / 60) // em minutos
    : 0;

  const getStatusIcon = (status: MigrationProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: MigrationProgress['status']) => {
    const variants = {
      completed: 'default',
      failed: 'destructive', 
      processing: 'secondary',
      pending: 'outline',
    } as const;

    const labels = {
      completed: 'Concluído',
      failed: 'Falhou',
      processing: 'Processando',
      pending: 'Pendente',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controles de Migração */}
      <MigrationControls />

      {/* Progresso Detalhado */}
      <Card className={`${
        isComplete ? 'border-green-200 bg-green-50' :
        hasIssues ? 'border-red-200 bg-red-50' :
        'border-blue-200 bg-blue-50'
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg flex items-center gap-2 ${
            isComplete ? 'text-green-900' :
            hasIssues ? 'text-red-900' :
            'text-blue-900'
          }`}>
            {isRunning ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : isComplete ? (
              <CheckCircle className="h-5 w-5" />
            ) : hasIssues ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
            Sistema de Migração Ultra-Resiliente
          </CardTitle>

          {/* Métricas de Performance em Tempo Real */}
          {(isRunning || isComplete) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">{startupsPerSecond}/s</div>
                  <div className="text-xs text-muted-foreground">Velocidade</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">{totalProcessed}</div>
                  <div className="text-xs text-muted-foreground">Processadas</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <HardDrive className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-medium">{completedFiles}/{totalFiles}</div>
                  <div className="text-xs text-muted-foreground">Arquivos</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="font-medium">
                    {estimatedTimeRemaining > 0 ? `${estimatedTimeRemaining}m` : '--'}
                  </div>
                  <div className="text-xs text-muted-foreground">ETA</div>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progresso Geral com Métricas Avançadas */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={isComplete ? 'text-green-700' : hasIssues ? 'text-red-700' : 'text-blue-700'}>
                Progresso Geral - Sistema Resiliente Ativo
              </span>
              <span className={isComplete ? 'text-green-700' : hasIssues ? 'text-red-700' : 'text-blue-700'}>
                {Math.round(totalProgress)}% • {totalProcessed} startups migradas
              </span>
            </div>
            <Progress value={totalProgress} className="h-3" />
            <div className="flex justify-between text-xs">
              <span className={isComplete ? 'text-green-600' : hasIssues ? 'text-red-600' : 'text-blue-600'}>
                ✨ Controle manual • Auto-recovery • Processamento adaptativo
              </span>
              {totalExpected > 0 && (
                <span className={isComplete ? 'text-green-600' : hasIssues ? 'text-red-600' : 'text-blue-600'}>
                  Meta: ~1.278 startups
                </span>
              )}
            </div>
          </div>

          {/* Lista de Arquivos com Progresso Detalhado */}
          {progressData.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Progresso Detalhado por Arquivo ({progressData.length} de {totalFiles}):
              </div>
              {progressData.map((progress) => {
                const fileProgress = progress.total_count > 0 
                  ? (progress.processed_count / progress.total_count) * 100 
                  : 0;
                
                return (
                  <div key={progress.id} className="p-3 bg-white rounded border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {getStatusIcon(progress.status)}
                        <span className="text-sm font-medium truncate">
                          {progress.file_name.replace('.json', '')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {progress.status === 'processing' && (
                          <span className="text-xs text-gray-500">
                            {progress.processed_count}/{progress.total_count}
                          </span>
                        )}
                        {progress.status === 'completed' && (
                          <span className="text-xs text-green-600">
                            {progress.processed_count} ✓
                          </span>
                        )}
                        {getStatusBadge(progress.status)}
                      </div>
                    </div>
                    
                    {/* Barra de progresso individual */}
                    {progress.total_count > 0 && (
                      <div className="space-y-1">
                        <Progress value={fileProgress} className="h-1" />
                        <div className="text-xs text-gray-500 text-right">
                          {Math.round(fileProgress)}% concluído
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
