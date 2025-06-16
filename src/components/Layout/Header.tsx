
import React from 'react';
import { Search, Grid3X3, List, Kanban, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '../../contexts/AppContext';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const { state, dispatch } = useApp();
  const location = useLocation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_FILTERS', payload: { search: e.target.value } });
  };

  const handleViewModeChange = (mode: 'cards' | 'list' | 'kanban') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">WS</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg text-foreground">Web Summit Rio 2025</h1>
                <p className="text-sm text-muted-foreground">Startup Catalog</p>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-auto md:mx-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar startups, membros, tópicos..."
                value={state.filters.search}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle - Only show on home page */}
            {location.pathname === '/' && (
              <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={state.viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('cards')}
                  className="h-8"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={state.viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  className="h-8"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={state.viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('kanban')}
                  className="h-8"
                >
                  <Kanban className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Navigation Links */}
            <Link to="/filters">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </Link>

            <Link to="/kanban">
              <Button variant="outline" size="sm">
                <Kanban className="h-4 w-4 mr-2" />
                Kanban
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{state.filteredStartups.length} startups encontradas</span>
            {state.selectedStartups.size > 0 && (
              <span className="text-primary font-medium">
                {state.selectedStartups.size} selecionadas
              </span>
            )}
          </div>
          {state.loading && (
            <span className="text-primary">Carregando...</span>
          )}
        </div>
      </div>
    </header>
  );
}
