
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useMigrationProgress, type MigrationProgress } from '../../hooks/useSupabaseData';

interface MigrationProgressProps {
  isVisible: boolean;
}

export function MigrationProgressComponent({ isVisible }: MigrationProgressProps) {
  const { data: progressData = [], isLoading } = useMigrationProgress();

  if (!isVisible || isLoading) {
    return null;
  }

  const totalFiles = progressData.length;
  const completedFiles = progressData.filter(p => p.status === 'completed').length;
  const failedFiles = progressData.filter(p => p.status === 'failed').length;
  const processingFiles = progressData.filter(p => p.status === 'processing').length;
  
  const totalProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
  const totalProcessed = progressData.reduce((sum, p) => sum + p.processed_count, 0);
  const totalExpected = progressData.reduce((sum, p) => sum + p.total_count, 0);

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
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Progresso da Migração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progresso Geral */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Progresso Geral</span>
            <span className="text-blue-700">{completedFiles}/{totalFiles} arquivos</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
          <div className="flex justify-between text-xs text-blue-600">
            <span>{totalProcessed} startups processadas</span>
            <span>{Math.round(totalProgress)}% concluído</span>
          </div>
        </div>

        {/* Resumo por Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedFiles}</div>
            <div className="text-xs text-green-600">Concluídos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{processingFiles}</div>
            <div className="text-xs text-blue-600">Processando</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{failedFiles}</div>
            <div className="text-xs text-red-600">Falharam</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{totalFiles - completedFiles - processingFiles - failedFiles}</div>
            <div className="text-xs text-gray-600">Pendentes</div>
          </div>
        </div>

        {/* Lista de Arquivos */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <div className="text-sm font-medium text-blue-700 mb-2">Detalhes por Arquivo:</div>
          {progressData.map((progress) => (
            <div key={progress.id} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                {getStatusIcon(progress.status)}
                <span className="text-sm font-medium">{progress.file_name}</span>
              </div>
              <div className="flex items-center gap-2">
                {progress.status === 'processing' && (
                  <span className="text-xs text-gray-500">
                    {progress.processed_count}/{progress.total_count}
                  </span>
                )}
                {progress.status === 'completed' && (
                  <span className="text-xs text-green-600">
                    {progress.processed_count} processadas
                  </span>
                )}
                {getStatusBadge(progress.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem de Status */}
        {processingFiles > 0 && (
          <div className="text-center text-sm text-blue-700 bg-blue-100 p-2 rounded">
            🔄 Migração em andamento... Por favor, aguarde.
          </div>
        )}

        {completedFiles === totalFiles && totalFiles > 0 && (
          <div className="text-center text-sm text-green-700 bg-green-100 p-2 rounded">
            ✅ Migração concluída com sucesso!
          </div>
        )}

        {failedFiles > 0 && processingFiles === 0 && (
          <div className="text-center text-sm text-red-700 bg-red-100 p-2 rounded">
            ⚠️ Alguns arquivos falharam. Verifique os logs para mais detalhes.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
