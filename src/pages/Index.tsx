
import React, { useEffect, useMemo } from 'react';
import { Header } from '../components/Layout/Header';
import { StartupCard } from '../components/StartupCard/StartupCard';
import { StartupList } from '../components/StartupList/StartupList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Download, CheckSquare, Square } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { loadAllStartups, normalizeStartupData } from '../services/dataLoader';
import { useStartupFilters } from '../hooks/useStartupFilters';

export default function Index() {
  const { state, dispatch } = useApp();

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const rawStartups = await loadAllStartups();
        const normalizedStartups = normalizeStartupData(rawStartups);
        dispatch({ type: 'SET_STARTUPS', payload: normalizedStartups });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados das startups' });
      }
    };

    if (state.startups.length === 0) {
      loadData();
    }
  }, [dispatch, state.startups.length]);

  // Apply filters
  const filteredStartups = useStartupFilters(state.startups, state.filters);

  // Update filtered startups in state when filters change
  useEffect(() => {
    dispatch({ type: 'SET_FILTERED_STARTUPS', payload: filteredStartups });
  }, [dispatch, filteredStartups]);

  // Pagination
  const totalPages = Math.ceil(state.filteredStartups.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const currentStartups = state.filteredStartups.slice(startIndex, endIndex);

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

  const handleExportCSV = () => {
    const selectedStartups = state.startups.filter(s => 
      state.selectedStartups.has(s.company_id)
    );

    if (selectedStartups.length === 0) {
      alert('Nenhuma startup selecionada para exportação');
      return;
    }

    const csvHeaders = [
      'Nome',
      'Cidade',
      'País',
      'Indústria',
      'Descrição',
      'Fundraising',
      'Meet Investors',
      'Website',
      'LinkedIn',
      'Tags',
      'Equipe'
    ];

    const csvData = selectedStartups.map(startup => {
      const teamMembers = startup.attendance_ids.flatMap(
        attendance => attendance.data.attendance.exhibitor.team.edges.map(edge => edge.node.name)
      );

      return [
        startup.name,
        startup.city,
        startup.country,
        startup.industry,
        startup.elevator_pitch.replace(/"/g, '""'),
        startup.fundraising ? 'Sim' : 'Não',
        startup.meet_investors ? 'Sim' : 'Não',
        startup.external_urls.homepage || '',
        startup.external_urls.linkedin || '',
        startup.tags?.join('; ') || '',
        teamMembers.join('; ')
      ].map(field => `"${field}"`);
    });

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'startups_web_summit_rio_2025.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const stats = useMemo(() => {
    const fundraisingCount = state.filteredStartups.filter(s => s.fundraising).length;
    const meetInvestorsCount = state.filteredStartups.filter(s => s.meet_investors).length;
    const countries = new Set(state.filteredStartups.map(s => s.country)).size;
    const industries = new Set(state.filteredStartups.map(s => s.industry)).size;

    return { fundraisingCount, meetInvestorsCount, countries, industries };
  }, [state.filteredStartups]);

  if (state.loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded-lg w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded-lg w-48 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-64"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-destructive">Erro</h1>
            <p className="text-muted-foreground">{state.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.fundraisingCount}</div>
              <div className="text-sm text-muted-foreground">Fundraising</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.meetInvestorsCount}</div>
              <div className="text-sm text-muted-foreground">Meet Investors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.countries}</div>
              <div className="text-sm text-muted-foreground">Países</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.industries}</div>
              <div className="text-sm text-muted-foreground">Indústrias</div>
            </CardContent>
          </Card>
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
                    <Button onClick={handleExportCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
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
              A visualização Kanban será implementada em breve.
            </p>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'cards' })}
            >
              Voltar para Cards
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
        <div className="text-center mt-4 text-sm text-muted-foreground">
          Mostrando {startIndex + 1}-{Math.min(endIndex, state.filteredStartups.length)} de {state.filteredStartups.length} startups
        </div>
      </main>
    </div>
  );
}
