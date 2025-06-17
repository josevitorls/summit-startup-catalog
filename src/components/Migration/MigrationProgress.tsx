
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, RefreshCw, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMigrationProgress, useMigrateData, type MigrationProgress } from '../../hooks/useSupabaseData';

interface MigrationProgressProps {
  isVisible: boolean;
}

export function MigrationProgressComponent({ isVisible }: MigrationProgressProps) {
  const { data: progressData = [], isLoading } = useMigrationProgress();
  const migrateMutation = useMigrateData();

  if (!isVisible || isLoading) {
    return null;
  }

  const totalFiles = progressData.length || 13; // Fallback para 13 arquivos conhecidos
  const completedFiles = progressData.filter(p => p.status === 'completed').length;
  const failedFiles = progressData.filter(p => p.status === 'failed').length;
  const processingFiles = progressData.filter(p => p.status === 'processing').length;
  
  const totalProgress = totalFiles > 0 ? (completedFiles / 13) * 100 : 0; // Usar 13 como total real
  const totalProcessed = progressData.reduce((sum, p) => sum + p.processed_count, 0);
  const totalExpected = progressData.reduce((sum, p) => sum + p.total_count, 0);

  const isRunning = processingFiles > 0 || migrateMutation.isPending;
  const isComplete = completedFiles === 13 && failedFiles === 0;
  const hasIssues = failedFiles > 0;

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

  const handleStartMigration = () => {
    migrateMutation.mutate();
  };

  return (
    <Card className={`mb-6 ${
      isComplete ? 'border-green-200 bg-green-50' :
      hasIssues ? 'border-red-200 bg-red-50' :
      'border-blue-200 bg-blue-50'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
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
              <Play className="h-5 w-5" />
            )}
            Migração de Dados - Micro-Batches
          </CardTitle>
          
          {!isRunning && !isComplete && (
            <Button 
              onClick={handleStartMigration}
              disabled={migrateMutation.isPending}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {migrateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Continuar Migração
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progresso Geral */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={isComplete ? 'text-green-700' : hasIssues ? 'text-red-700' : 'text-blue-700'}>
              Progresso Geral
            </span>
            <span className={isComplete ? 'text-green-700' : hasIssues ? 'text-red-700' : 'text-blue-700'}>
              {completedFiles}/13 arquivos • {totalProcessed} startups
            </span>
          </div>
          <Progress value={totalProgress} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className={isComplete ? 'text-green-600' : hasIssues ? 'text-red-600' : 'text-blue-600'}>
              {Math.round(totalProgress)}% concluído
            </span>
            {totalExpected > 0 && (
              <span className={isComplete ? 'text-green-600' : hasIssues ? 'text-red-600' : 'text-blue-600'}>
                Meta: ~1.278 startups
              </span>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{completedFiles}</div>
            <div className="text-xs text-green-600">Concluídos</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{processingFiles}</div>
            <div className="text-xs text-blue-600">Processando</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{failedFiles}</div>
            <div className="text-xs text-red-600">Falharam</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-gray-600">{Math.max(0, 13 - completedFiles - processingFiles - failedFiles)}</div>
            <div className="text-xs text-gray-600">Pendentes</div>
          </div>
        </div>

        {/* Lista de Arquivos */}
        {progressData.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="text-sm font-medium mb-2">
              Detalhes por Arquivo ({progressData.length} de 13):
            </div>
            {progressData.map((progress) => (
              <div key={progress.id} className="flex items-center justify-between p-2 bg-white rounded border">
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
            ))}
          </div>
        )}

        {/* Mensagens de Status */}
        {isRunning && (
          <div className="text-center text-sm text-blue-700 bg-blue-100 p-3 rounded">
            🔄 Migração em andamento com micro-batches (5 startups por vez)...
            <br />
            <span className="text-xs">Processamento automático a cada ~7 segundos</span>
          </div>
        )}

        {isComplete && (
          <div className="text-center text-sm text-green-700 bg-green-100 p-3 rounded">
            🎉 Migração concluída com sucesso!
            <br />
            <span className="text-xs">Todas as startups foram processadas e estão disponíveis</span>
          </div>
        )}

        {hasIssues && !isRunning && (
          <div className="text-center text-sm text-red-700 bg-red-100 p-3 rounded">
            ⚠️ Alguns arquivos falharam durante a migração.
            <br />
            <span className="text-xs">Clique em "Continuar Migração" para tentar novamente</span>
          </div>
        )}

        {!isRunning && !isComplete && !hasIssues && progressData.length === 0 && (
          <div className="text-center text-sm text-blue-700 bg-blue-100 p-3 rounded">
            🚀 Pronto para iniciar a migração otimizada!
            <br />
            <span className="text-xs">Sistema de micro-batches com processamento inteligente</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
