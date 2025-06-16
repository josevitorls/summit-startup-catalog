
import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Layout/Header';
import { StartupCard } from '../components/StartupCard/StartupCard';
import { StartupList } from '../components/StartupList/StartupList';
import { StartupStats } from '../components/Analytics/StartupStats';
import { GlobalSearch } from '../components/Search/GlobalSearch';
import { QuickFilters } from '../components/StartupFilters/QuickFilters';
import { ExportOptions } from '../components/Export/ExportOptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckSquare, Square, Upload, Filter, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useStartups, useMigrateData } from '../hooks/useSupabaseData';
import { useStartupFilters } from '../hooks/useStartupFilters';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Index() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [migrationProgress, setMigrationProgress] = useState<string>('');

  // Usar dados do Supabase ao invés do JSON
  const { data: supabaseStartups = [], isLoading, error, refetch } = useStartups();
  const migrateMutation = useMigrateData();

  // Se ainda não há dados no Supabase, usar dados JSON como fallback
  const startups = supabaseStartups.length > 0 ? supabaseStartups : state.startups;

  // Apply filters
  const searchFilters = { ...state.filters, search: searchQuery };
  const filteredStartups = useStartupFilters(startups, searchFilters);

  // Update filtered startups in state when filters change
  useEffect(() => {
    dispatch({ type: 'SET_FILTERED_STARTUPS', payload: filteredStartups });
  }, [dispatch, filteredStartups]);

  // Pagination
  const totalPages = Math.ceil(state.filteredStartups.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const currentStartups = state.filteredStartups.slice(startIndex, endIndex);

  // Quick filters
  const quickFilters = [
    {
      id: 'fundraising',
      label: 'Fundraising',
      count: startups.filter(s => s.fundraising).length,
      isActive: state.filters.fundraising === true
    },
    {
      id: 'meetInvestors',
      label: 'Meet Investors',
      count: startups.filter(s => s.meet_investors).length,
      isActive: state.filters.meetInvestors === true
    },
    {
      id: 'womenFounder',
      label: 'Women Founder',
      count: startups.filter(s => s.startup_women_founder).length,
      isActive: false
    }
  ];

  const handleQuickFilterToggle = (filterId: string) => {
    switch (filterId) {
      case 'fundraising':
        dispatch({
          type: 'SET_FILTERS',
          payload: {
            ...state.filters,
            fundraising: state.filters.fundraising === true ? undefined : true
          }
        });
        break;
      case 'meetInvestors':
        dispatch({
          type: 'SET_FILTERS',
          payload: {
            ...state.filters,
            meetInvestors: state.filters.meetInvestors === true ? undefined : true
          }
        });
        break;
    }
  };

  const handleClearQuickFilters = () => {
    dispatch({
      type: 'SET_FILTERS',
      payload: {
        ...state.filters,
        fundraising: undefined,
        meetInvestors: undefined
      }
    });
  };

  const handlePageChange = (page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAll = () => {
    const currentIds = currentStartups.map(s => s.company_id);
    dispatch({ type: 'SELECT_ALL_STARTUPS', payload: currentIds });
  };

  const handleClearSelection = () => {
    dispatch({ type: 'CLEAR_SELECTION' });
  };

  const handleMigrateData = async () => {
    try {
      setMigrationProgress('Iniciando migração...');
      
      const result = await migrateMutation.mutateAsync();
      
      if (result.success) {
        setMigrationProgress('');
        toast({
          title: "Migração Concluída com Sucesso!",
          description: `${result.finalCount} startups foram migradas para o Supabase.`,
        });
        
        // Recarregar dados após migração
        refetch();
      } else {
        throw new Error(result.error || 'Erro desconhecido na migração');
      }
    } catch (error) {
      setMigrationProgress('');
      console.error('Migration error:', error);
      toast({
        title: "Erro na Migração",
        description: error.message || "Ocorreu um erro durante a migração dos dados.",
        variant: "destructive",
      });
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = state.filteredStartups.length;
    const fundraising = state.filteredStartups.filter(s => s.fundraising).length;
    const meetInvestors = state.filteredStartups.filter(s => s.meet_investors).length;
    const countries = new Set(state.filteredStartups.map(s => s.country)).size;
    const industries = new Set(state.filteredStartups.map(s => s.industry)).size;
    const womenFounders = state.filteredStartups.filter(s => s.startup_women_founder).length;
    const blackFounders = state.filteredStartups.filter(s => s.startup_black_founder).length;
    const indigenousFounders = state.filteredStartups.filter(s => s.startup_indigenous_founder).length;

    return { 
      total, 
      fundraising, 
      meetInvestors, 
      countries, 
      industries,
      womenFounders,
      blackFounders,
      indigenousFounders
    };
  }, [state.filteredStartups]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <div className="h-8 bg-muted rounded-lg w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded-lg w-48 mx-auto"></div>
            </div>
            <p className="text-muted-foreground mt-4">Carregando dados das startups...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h1 className="text-2xl font-bold mb-4 text-destructive">Erro ao Carregar Dados</h1>
              <p className="text-muted-foreground mb-6">{error.message}</p>
              <Button 
                onClick={() => refetch()}
                variant="outline"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Migration Status */}
        {(supabaseStartups.length === 0 || migrationProgress) && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      {migrationProgress ? 'Migração em Andamento' : 'Dados Não Migrados'}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {migrationProgress || 'Clique no botão para migrar os dados dos arquivos JSON para o Supabase.'}
                    </p>
                  </div>
                </div>
                {!migrationProgress && (
                  <Button 
                    onClick={handleMigrateData}
                    disabled={migrateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {migrateMutation.isPending ? 'Migrando...' : 'Migrar Dados'}
                  </Button>
                )}
              </div>
              {migrationProgress && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-blue-700">{migrationProgress}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Success Status */}
        {supabaseStartups.length > 0 && !migrationProgress && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Dados Migrados com Sucesso</h3>
                  <p className="text-sm text-green-700">
                    {supabaseStartups.length} startups carregadas do Supabase.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Quick Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <GlobalSearch 
              startups={startups}
              onSearchChange={setSearchQuery}
              searchQuery={searchQuery}
            />
            <div className="flex items-center gap-2">
              <Link to="/filters">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros Avançados
                </Button>
              </Link>
              <Link to="/kanban">
                <Button variant="outline">
                  Kanban
                </Button>
              </Link>
            </div>
          </div>
          
          <QuickFilters
            filters={quickFilters}
            onToggle={handleQuickFilterToggle}
            onClearAll={handleClearQuickFilters}
          />
        </div>

        {/* Stats */}
        <div className="mb-6">
          <StartupStats stats={stats} />
        </div>

        {/* Selection and Export Controls */}
        {(state.selectedStartups.size > 0 || currentStartups.length > 0) && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={state.selectedStartups.size === currentStartups.length ? handleClearSelection : handleSelectAll}
                  >
                    {state.selectedStartups.size === currentStartups.length ? (
                      <CheckSquare className="h-4 w-4 mr-2" />
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    {state.selectedStartups.size === currentStartups.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </Button>
                  
                  {state.selectedStartups.size > 0 && (
                    <Badge variant="default">
                      {state.selectedStartups.size} selecionadas
                    </Badge>
                  )}
                </div>

                {state.selectedStartups.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleClearSelection}>
                      Limpar Seleção
                    </Button>
                    <ExportOptions 
                      startups={startups}
                      selectedStartups={state.selectedStartups}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content based on view mode */}
        {state.viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentStartups.map((startup) => (
              <StartupCard
                key={startup.company_id}
                startup={startup}
                showSelection={true}
              />
            ))}
          </div>
        )}

        {state.viewMode === 'list' && (
          <Card>
            <CardContent className="p-0">
              <StartupList startups={currentStartups} showSelection={true} />
            </CardContent>
          </Card>
        )}

        {state.viewMode === 'kanban' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Visualização Kanban</h2>
            <p className="text-muted-foreground mb-6">
              Use a página Kanban dedicada para uma experiência completa.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/kanban'}
            >
              Ir para Kanban
            </Button>
          </div>
        )}

        {/* Empty State */}
        {startups.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-4">Nenhuma Startup Encontrada</h2>
            <p className="text-muted-foreground mb-6">
              Execute a migração de dados para carregar as startups.
            </p>
          </div>
        )}

        {/* No Results */}
        {startups.length > 0 && state.filteredStartups.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Nenhum Resultado</h2>
            <p className="text-muted-foreground mb-6">
              Tente ajustar os filtros para encontrar startups.
            </p>
            <Button variant="outline" onClick={handleClearQuickFilters}>
              Limpar Filtros
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(state.currentPage - 1)}
              disabled={state.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, state.currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === state.currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(state.currentPage + 1)}
              disabled={state.currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Results info */}
        {state.filteredStartups.length > 0 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(endIndex, state.filteredStartups.length)} de {state.filteredStartups.length} startups
          </div>
        )}
      </main>
    </div>
  );
}
