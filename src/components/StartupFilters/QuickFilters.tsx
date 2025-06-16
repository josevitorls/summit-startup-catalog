
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface QuickFilter {
  id: string;
  label: string;
  count: number;
  isActive: boolean;
}

interface QuickFiltersProps {
  filters: QuickFilter[];
  onToggle: (filterId: string) => void;
  onClearAll: () => void;
}

export function QuickFilters({ filters, onToggle, onClearAll }: QuickFiltersProps) {
  const activeFilters = filters.filter(f => f.isActive);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => (
          <Button
            key={filter.id}
            variant={filter.isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(filter.id)}
            className="text-xs"
          >
            {filter.label}
            <Badge variant="secondary" className="ml-1 text-xs">
              {filter.count}
            </Badge>
          </Button>
        ))}
      </div>
      
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          <div className="flex flex-wrap gap-1">
            {activeFilters.map(filter => (
              <Badge key={filter.id} variant="default" className="text-xs">
                {filter.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => onToggle(filter.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs">
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}
