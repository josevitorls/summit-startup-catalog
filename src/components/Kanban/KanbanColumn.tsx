
import React from 'react';
import { MoreVertical, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Startup } from '../../types/startup';
import { Link } from 'react-router-dom';

interface KanbanColumnProps {
  column: {
    id: string;
    name: string;
    color: string;
  };
  startups: Startup[];
  onMoveStartup: (companyId: string, columnId: string) => void;
  onRemoveStartup: (companyId: string) => void;
  isLoading: boolean;
}

const COLUMN_OPTIONS = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'cubo_analise', name: 'Cubo - Em Análise' },
  { id: 'cubo_aprovado', name: 'Cubo - Aprovado' },
  { id: 'parceiro_dzb', name: 'DZB Partners' },
  { id: 'mentoria', name: 'Precisa Mentoria' },
  { id: 'concluido', name: 'Concluído' },
];

export function KanbanColumn({ column, startups, onMoveStartup, onRemoveStartup, isLoading }: KanbanColumnProps) {
  return (
    <div className="w-80 flex-shrink-0">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <span className="text-sm font-medium">{column.name}</span>
              <Badge variant="secondary" className="text-xs">
                {startups.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {startups.map(startup => (
            <Card key={startup.company_id} className="p-3 hover:shadow-sm transition-shadow">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {startup.logo_urls?.thumb ? (
                        <img
                          src={startup.logo_urls.thumb}
                          alt={`${startup.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold text-xs">
                            {startup.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/startup/${startup.company_id}`}
                        className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                      >
                        {startup.name}
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {startup.city}, {startup.country}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {COLUMN_OPTIONS
                        .filter(option => option.id !== column.id)
                        .map(option => (
                          <DropdownMenuItem
                            key={option.id}
                            onClick={() => onMoveStartup(startup.company_id, option.id)}
                            disabled={isLoading}
                          >
                            Mover para {option.name}
                          </DropdownMenuItem>
                        ))}
                      <DropdownMenuItem
                        onClick={() => onRemoveStartup(startup.company_id)}
                        disabled={isLoading}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover do Kanban
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {startup.industry}
                  </Badge>
                  
                  <div className="flex flex-wrap gap-1">
                    {startup.fundraising && (
                      <Badge variant="destructive" className="text-xs">
                        Fundraising
                      </Badge>
                    )}
                    {startup.meet_investors && (
                      <Badge variant="secondary" className="text-xs">
                        Meet Investors
                      </Badge>
                    )}
                    {startup.startup_women_founder && (
                      <Badge variant="outline" className="text-xs">
                        Women Founder
                      </Badge>
                    )}
                  </div>

                  {startup.tags && startup.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {startup.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="default" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {startup.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{startup.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {startup.elevator_pitch}
                </p>
              </div>
            </Card>
          ))}

          {startups.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-xs">
                Nenhuma startup nesta coluna
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
