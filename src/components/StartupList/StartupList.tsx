
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Startup } from '../../types/startup';
import { useApp } from '../../contexts/AppContext';

interface StartupListProps {
  startups: Startup[];
  showSelection?: boolean;
}

export function StartupList({ startups, showSelection = false }: StartupListProps) {
  const { state, dispatch } = useApp();

  const handleToggleSelection = (companyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_STARTUP_SELECTION', payload: companyId });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            {showSelection && (
              <th className="w-12 p-3 text-left">
                <span className="sr-only">Seleção</span>
              </th>
            )}
            <th className="p-3 text-left font-medium">Logo</th>
            <th className="p-3 text-left font-medium">Nome</th>
            <th className="p-3 text-left font-medium">Localização</th>
            <th className="p-3 text-left font-medium">Indústria</th>
            <th className="p-3 text-left font-medium">Status</th>
            <th className="p-3 text-left font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {startups.map((startup) => {
            const isSelected = state.selectedStartups.has(startup.company_id);
            
            return (
              <tr
                key={startup.company_id}
                className="border-b hover:bg-muted/30 transition-colors"
              >
                {showSelection && (
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleToggleSelection(startup.company_id, e)}
                      className="h-8 w-8 p-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </td>
                )}
                
                <td className="p-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                    {startup.logo_urls?.thumb ? (
                      <img
                        src={startup.logo_urls.thumb}
                        alt={`${startup.name} logo`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                          {startup.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="p-3">
                  <Link 
                    to={`/startup/${startup.company_id}`}
                    className="hover:text-primary transition-colors"
                  >
                    <div className="font-semibold">{startup.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {startup.elevator_pitch}
                    </div>
                  </Link>
                </td>
                
                <td className="p-3">
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{startup.city}, {startup.country}</span>
                  </div>
                </td>
                
                <td className="p-3">
                  <Badge variant="secondary" className="text-xs">
                    {startup.industry}
                  </Badge>
                </td>
                
                <td className="p-3">
                  <div className="flex flex-col gap-1">
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
                    {startup.tags && startup.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {startup.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
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
                </td>
                
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Link to={`/startup/${startup.company_id}`}>
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </Link>
                    {startup.external_urls?.homepage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(startup.external_urls.homepage, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
