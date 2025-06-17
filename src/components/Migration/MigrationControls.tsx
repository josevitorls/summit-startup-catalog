
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  useMigrationControl, 
  usePauseMigration, 
  useResumeMigration, 
  useResetMigration 
} from '../../hooks/useMigrationControl';
import { useMigrationProgress } from '../../hooks/useSupabaseData';

export function MigrationControls() {
  const { data: controlState, isLoading: controlLoading } = useMigrationControl();
  const { data: progressData = [] } = useMigrationProgress();
  const pauseMutation = usePauseMigration();
  const resumeMutation = useResumeMigration();
  const resetMutation = useResetMigration();

  if (controlLoading || !controlState) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            Carregando controles...
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalFiles = 13;
  const completedFiles = progressData.filter(p => p.status === 'completed').length;
  const failedFiles = progressData.filter(p => p.status === 'failed').length;
  const processingFiles = progressData.filter(p => p.status === 'processing').length;
  
  const isComplete = completedFiles === totalFiles;
  const hasIssues = failedFiles > 0;
  const isPaused = controlState.is_paused;
  const isRunning = controlState.is_running || processingFiles > 0;
  
  // Detectar se migração travou (tem arquivos completed mas is_running = true sem processing)
  const isStuck = controlState.is_running && processingFiles === 0 && completedFiles > 0 && completedFiles < totalFiles;

  const getStatusInfo = () => {
    if (isComplete) {
      return {
        label: 'Concluída',
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600'
      };
    }
    if (isStuck) {
      return {
        label: 'Travada - Precisa Continuar',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-red-600'
      };
    }
    if (isPaused) {
      return {
        label: 'Pausada',
        variant: 'secondary' as const,
        icon: Pause,
        color: 'text-orange-600'
      };
    }
    if (isRunning) {
      return {
        label: 'Executando',
        variant: 'secondary' as const,
        icon: RefreshCw,
        color: 'text-blue-600'
      };
    }
    if (hasIssues) {
      return {
        label: 'Com Falhas',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-red-600'
      };
    }
    return {
      label: 'Pronta',
      variant: 'outline' as const,
      icon: Play,
      color: 'text-gray-600'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Função para forçar continuação da migração
  const handleForceContinue = async () => {
    try {
      // Primeiro resetar o estado se necessário
      if (isStuck) {
        await resetMutation.mutateAsync();
        // Aguardar um pouco antes de retomar
        setTimeout(() => {
          resumeMutation.mutate();
        }, 2000);
      } else {
        resumeMutation.mutate();
      }
    } catch (error) {
      console.error('Erro ao forçar continuação:', error);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color} ${isRunning ? 'animate-spin' : ''}`} />
            Controle de Migração Ultra-Resiliente
          </CardTitle>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="text-center p-2 bg-green-50 rounded border">
            <div className="font-bold text-green-600">{completedFiles}</div>
            <div className="text-xs text-green-600">Concluídos</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded border">
            <div className="font-bold text-blue-600">{processingFiles}</div>
            <div className="text-xs text-blue-600">Processando</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded border">
            <div className="font-bold text-red-600">{failedFiles}</div>
            <div className="text-xs text-red-600">Falharam</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded border">
            <div className="font-bold text-gray-600">
              {Math.max(0, totalFiles - completedFiles - processingFiles - failedFiles)}
            </div>
            <div className="text-xs text-gray-600">Pendentes</div>
          </div>
        </div>

        {/* Botões de Controle */}
        <div className="flex gap-2 flex-wrap">
          {/* Botão de Força para Continuar - URGENTE */}
          {(isStuck || (completedFiles > 0 && completedFiles < totalFiles && !isRunning)) && (
            <Button
              onClick={handleForceContinue}
              disabled={resumeMutation.isPending || resetMutation.isPending}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              size="sm"
            >
              <Zap className="h-4 w-4" />
              {resumeMutation.isPending || resetMutation.isPending ? 'Forçando...' : '🚨 Continuar Migração AGORA'}
            </Button>
          )}

          {/* Botão Pausar */}
          {isRunning && !isPaused && !isStuck && (
            <Button
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              {pauseMutation.isPending ? 'Pausando...' : 'Pausar'}
            </Button>
          )}

          {/* Botão Retomar/Iniciar */}
          {(!isRunning || isPaused) && !isComplete && !isStuck && (
            <Button
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="h-4 w-4" />
              {resumeMutation.isPending ? 'Iniciando...' : isPaused ? 'Retomar' : 'Iniciar'}
            </Button>
          )}

          {/* Botão Reset */}
          <Button
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending || (isRunning && !isStuck)}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {resetMutation.isPending ? 'Resetando...' : 'Reset Completo'}
          </Button>
        </div>

        {/* Alertas Contextuais */}
        {isStuck && (
          <div className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <strong>🚨 MIGRAÇÃO TRAVADA - AÇÃO URGENTE NECESSÁRIA</strong>
            </div>
            <div className="mb-2">
              A migração processou {completedFiles} de {totalFiles} arquivos e parou. 
              <strong> Clique em "Continuar Migração AGORA"</strong> para processar os {totalFiles - completedFiles} arquivos restantes.
            </div>
            <div className="text-xs text-red-600">
              ⏰ Links externos expiram hoje! Não podemos perder mais tempo.
            </div>
          </div>
        )}

        {isPaused && (
          <div className="text-sm text-orange-700 bg-orange-50 p-3 rounded border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Pause className="h-4 w-4" />
              <strong>Migração Pausada</strong>
            </div>
            <div>A migração foi pausada e pode ser retomada do ponto exato onde parou.</div>
          </div>
        )}

        {hasIssues && !isRunning && !isStuck && (
          <div className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <strong>Falhas Detectadas</strong>
            </div>
            <div>
              {failedFiles} arquivo(s) falharam. Clique em "Retomar" para tentar novamente 
              ou "Reset Completo" para recomeçar do zero.
            </div>
          </div>
        )}

        {isComplete && (
          <div className="text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4" />
              <strong>🎉 Migração Concluída!</strong>
            </div>
            <div>Todos os {totalFiles} arquivos foram processados com sucesso. Total de startups migradas disponível na base de dados.</div>
          </div>
        )}

        {/* Progresso Visual Urgente */}
        {!isComplete && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progresso da Migração</span>
              <span>{completedFiles}/{totalFiles} arquivos • {Math.round((completedFiles/totalFiles)*100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isStuck ? 'bg-red-500' : isRunning ? 'bg-blue-500' : 'bg-green-500'
                }`}
                style={{ width: `${(completedFiles/totalFiles)*100}%` }}
              />
            </div>
            {!isComplete && completedFiles > 0 && (
              <div className="text-xs text-center text-muted-foreground">
                ⚡ Faltam {totalFiles - completedFiles} arquivos para completar a migração
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
