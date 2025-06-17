
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle, RefreshCw, Zap, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  useMigrationControl, 
  usePauseMigration, 
  useResumeMigration, 
  useResetMigration,
  useForceResume
} from '../../hooks/useMigrationControl';
import { useMigrationProgress } from '../../hooks/useSupabaseData';

export function MigrationControls() {
  const { data: controlState, isLoading: controlLoading } = useMigrationControl();
  const { data: progressData = [] } = useMigrationProgress();
  const pauseMutation = usePauseMigration();
  const resumeMutation = useResumeMigration();
  const resetMutation = useResetMigration();
  const forceResumeMutation = useForceResume();

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
  const pendingFiles = totalFiles - completedFiles - failedFiles - processingFiles;
  
  // CORREÇÃO CRÍTICA: Sistema só está completo quando TODOS os 13 arquivos estão processed
  const isComplete = completedFiles === totalFiles && failedFiles === 0;
  const hasIssues = failedFiles > 0;
  const isPaused = controlState.is_paused;
  const isRunning = controlState.is_running || processingFiles > 0;
  
  // CORREÇÃO: Detectar se há trabalho pendente (arquivos não processados)
  const hasPendingWork = pendingFiles > 0 || failedFiles > 0;
  
  // Estado de emergência: se há arquivos pendentes e não está rodando
  const needsUrgentAction = hasPendingWork && !isRunning && !isPaused;

  const getStatusInfo = () => {
    if (isComplete) {
      return {
        label: 'Concluída',
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600'
      };
    }
    if (needsUrgentAction) {
      return {
        label: '🚨 AGUARDANDO CONTINUAÇÃO',
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

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color} ${isRunning ? 'animate-spin' : ''}`} />
            Sistema de Migração Ultra-Resiliente - DESBLOQUEADO
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
          <div className="text-center p-2 bg-orange-50 rounded border">
            <div className="font-bold text-orange-600">{pendingFiles}</div>
            <div className="text-xs text-orange-600">Pendentes</div>
          </div>
        </div>

        {/* ALERTA DE EMERGÊNCIA SEMPRE VISÍVEL */}
        {needsUrgentAction && (
          <div className="text-sm text-red-900 bg-red-100 p-4 rounded border-2 border-red-300">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="h-5 w-5 text-red-600" />
              <strong>🚨 MIGRAÇÃO PRECISA CONTINUAR URGENTEMENTE!</strong>
            </div>
            <div className="mb-3">
              <strong>{completedFiles} de {totalFiles} arquivos processados.</strong>
              <br />
              Restam <strong>{pendingFiles} arquivos</strong> com aproximadamente <strong>{Math.round((pendingFiles / totalFiles) * 1278)} startups</strong> para migrar.
            </div>
            <div className="text-xs text-red-700 font-semibold">
              ⏰ ATENÇÃO: Links externos podem expirar! Ação imediata necessária.
            </div>
          </div>
        )}

        {/* Botões de Controle - SEMPRE MOSTRAR QUANDO HÁ TRABALHO PENDENTE */}
        <div className="flex gap-2 flex-wrap">
          {/* BOTÃO DE EMERGÊNCIA - SEMPRE VISÍVEL QUANDO HÁ TRABALHO PENDENTE */}
          {hasPendingWork && (
            <Button
              onClick={() => forceResumeMutation.mutate()}
              disabled={forceResumeMutation.isPending}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
              size="lg"
            >
              <Rocket className="h-5 w-5" />
              {forceResumeMutation.isPending ? 'PROCESSANDO...' : '🚀 CONTINUAR MIGRAÇÃO AGORA'}
            </Button>
          )}

          {/* Botão Pausar */}
          {isRunning && !isPaused && (
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

          {/* Botão Retomar/Iniciar Normal */}
          {(!isRunning || isPaused) && !isComplete && (
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
            disabled={resetMutation.isPending || isRunning}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {resetMutation.isPending ? 'Resetando...' : 'Reset Completo'}
          </Button>
        </div>

        {/* Alertas Contextuais */}
        {isPaused && (
          <div className="text-sm text-orange-700 bg-orange-50 p-3 rounded border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Pause className="h-4 w-4" />
              <strong>Migração Pausada</strong>
            </div>
            <div>A migração foi pausada e pode ser retomada do ponto exato onde parou.</div>
          </div>
        )}

        {hasIssues && (
          <div className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <strong>Falhas Detectadas</strong>
            </div>
            <div>
              {failedFiles} arquivo(s) falharam. Use o botão "CONTINUAR MIGRAÇÃO AGORA" para tentar novamente.
            </div>
          </div>
        )}

        {isComplete && (
          <div className="text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4" />
              <strong>🎉 Migração Concluída!</strong>
            </div>
            <div>Todos os {totalFiles} arquivos foram processados com sucesso. Total de ~1.278 startups migradas.</div>
          </div>
        )}

        {/* Progresso Visual */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Progresso da Migração</span>
            <span>{completedFiles}/{totalFiles} arquivos • {Math.round((completedFiles/totalFiles)*100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                needsUrgentAction ? 'bg-red-500' : 
                isRunning ? 'bg-blue-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${(completedFiles/totalFiles)*100}%` }}
            />
          </div>
          {!isComplete && (
            <div className="text-xs text-center font-medium">
              {needsUrgentAction ? (
                <span className="text-red-600">🚨 {pendingFiles} arquivos aguardando processamento</span>
              ) : isRunning ? (
                <span className="text-blue-600">⚡ Processando... {pendingFiles} arquivos restantes</span>
              ) : (
                <span className="text-gray-600">⏸️ Pausado - {pendingFiles} arquivos pendentes</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
