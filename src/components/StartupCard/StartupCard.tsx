
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, ExternalLink, Tag, CheckSquare, Square } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Startup } from '../../types/startup';
import { useApp } from '../../contexts/AppContext';

interface StartupCardProps {
  startup: Startup;
  showSelection?: boolean;
}

export function StartupCard({ startup, showSelection = false }: StartupCardProps) {
  const { state, dispatch } = useApp();
  const isSelected = state.selectedStartups.has(startup.company_id);

  const handleToggleSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_STARTUP_SELECTION', payload: startup.company_id });
  };

  const teamMembers = startup.attendance_ids.flatMap(
    attendance => attendance.data.attendance.exhibitor.team.edges.map(edge => edge.node)
  );

  const offeringTopics = startup.attendance_ids.flatMap(
    attendance => attendance.data.attendance.offeringTopics.edges.map(edge => edge.node.name)
  );

  return (
    <Card className="h-full hover:shadow-md transition-shadow group relative">
      {showSelection && (
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleSelection}
            className="h-8 w-8 p-0"
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      <Link to={`/startup/${startup.company_id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {startup.logo_urls?.thumb ? (
                <img
                  src={startup.logo_urls.thumb}
                  alt={`${startup.name} logo`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">
                    {startup.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {startup.name}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{startup.city}, {startup.country}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div>
            <Badge variant="secondary" className="text-xs">
              {startup.industry}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-3">
            {startup.elevator_pitch}
          </p>

          {/* Team Members */}
          {teamMembers.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {teamMembers.length} {teamMembers.length === 1 ? 'membro' : 'membros'}
              </span>
            </div>
          )}

          {/* Offering Topics */}
          {offeringTopics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {offeringTopics.slice(0, 3).map((topic, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {offeringTopics.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{offeringTopics.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Custom Tags */}
          {startup.tags && startup.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {startup.tags.map((tag, index) => (
                <Badge key={index} variant="default" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex gap-2 pt-2">
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
          </div>

          {/* External Links */}
          {startup.external_urls?.homepage && (
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(startup.external_urls.homepage, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Website
              </Button>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
