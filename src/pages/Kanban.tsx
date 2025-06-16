
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useStartups, useKanbanStartups, useToggleKanban, useUpdateKanbanColumn } from '../hooks/useSupabaseData';
import { useStartupFilters } from '../hooks/useStartupFilters';
import { KanbanColumn } from '../components/Kanban/KanbanColumn';

const DEFAULT_COLUMNS = [
  { id: 'backlog', name: 'Backlog', color: '#6b7280' },
  { id: 'cubo_analise', name: 'Cubo - Em Análise', color: '#8b5cf6' },
  { id: 'cubo_aprovado', name: 'Cubo - Aprovado', color: '#10b981' },
  { id: 'parceiro_dzb', name: 'DZB Partners', color: '#3b82f6' },
  { id: 'mentoria', name: 'Precisa Mentoria', color: '#f59e0b' },
  { id: 'concluido', name: 'Concluído', color: '#22c55e' },
];

export default function Kanban() {
  const [searchTerm, setSearchTerm] = useState('');
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [showAddStartups, setShowAddStartups] = useState(false);
  
  const { data: allStartups = [], isLoading: loadingAll } = useStartups();
  const { data: kanbanStartups = [], isLoading: loadingKanban } = useKanbanStartups();
  const toggleKanban = useToggleKanban();
  const updateColumn = useUpdateKanbanColumn();

  // Filtrar startups não incluídas no Kanban
  const availableStartups = allStartups.filter(
    startup => !kanbanStartups.some(k => k.company_id === startup.company_id)
  );

  // Aplicar busca nas startups disponíveis
  const filteredAvailable = useStartupFilters(availableStartups, {
    search: searchTerm,
    country: '',
    industry: '',
    fundingTier: '',
    tags: [],
    offeringTopics: [],
    seekingTopics: []
  });

  // Agrupar startups do Kanban por coluna
  const startupsByColumn = columns.reduce((acc, column) => {
    acc[column.id] = kanbanStartups.filter(startup => startup.kanban_column === column.id);
    return acc;
  }, {} as Record<string, typeof kanbanStartups>);

  const handleAddToKanban = async (companyId: string) => {
    try {
      await toggleKanban.mutateAsync({ companyId, showInKanban: true });
    } catch (error) {
      console.error('Erro ao adicionar ao Kanban:', error);
    }
  };

  const handleRemoveFromKanban = async (companyId: string) => {
    try {
      await toggleKanban.mutateAsync({ companyId, showInKanban: false });
    } catch (error) {
      console.error('Erro ao remover do Kanban:', error);
    }
  };

  const handleMoveStartup = async (companyId: string, newColumnId: string) => {
    try {
      await updateColumn.mutateAsync({ companyId, column: newColumnId });
    } catch (error) {
      console.error('Erro ao mover startup:', error);
    }
  };

  if (loadingAll || loadingKanban) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando Kanban...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Kanban Board</h1>
            <p className="text-muted-foreground">
              {kanbanStartups.length} startups no pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showAddStartups} onOpenChange={setShowAddStartups}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Startups
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Adicionar Startups ao Kanban</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 flex-1 overflow-hidden">
                <Input
                  placeholder="Buscar startups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <div className="overflow-y-auto flex-1 space-y-2">
                  {filteredAvailable.map(startup => (
                    <div key={startup.company_id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {startup.logo_urls?.thumb ? (
                          <img
                            src={startup.logo_urls.thumb}
                            alt={`${startup.name} logo`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">
                              {startup.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{startup.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {startup.city}, {startup.country} • {startup.industry}
                        </p>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAddToKanban(startup.company_id)}
                        disabled={toggleKanban.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {filteredAvailable.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhuma startup encontrada' : 'Todas as startups já estão no Kanban'}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {columns.map(column => {
          const count = startupsByColumn[column.id]?.length || 0;
          return (
            <Card key={column.id}>
              <CardContent className="p-4 text-center">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: column.color }}
                >
                  {count}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {column.name}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              startups={startupsByColumn[column.id] || []}
              onMoveStartup={handleMoveStartup}
              onRemoveStartup={handleRemoveFromKanban}
              isLoading={updateColumn.isPending || toggleKanban.isPending}
            />
          ))}
        </div>
      </div>

      {kanbanStartups.length === 0 && (
        <Card className="mt-8">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Kanban vazio</h3>
              <p className="mb-4">Adicione startups ao seu pipeline para começar a organizá-las.</p>
              <Button onClick={() => setShowAddStartups(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Startup
              </Button>
            </div>
          </CardContent>
        </div>
      )}
    </div>
  );
}
