
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { Startup } from '../../types/startup';
import { Link } from 'react-router-dom';

interface GlobalSearchProps {
  startups: Startup[];
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export function GlobalSearch({ startups, onSearchChange, searchQuery }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Startup[]>([]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const filtered = startups.filter(startup =>
        startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.elevator_pitch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5);
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [searchQuery, startups]);

  const handleClear = () => {
    onSearchChange('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar startups..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            {results.map((startup) => (
              <Link
                key={startup.company_id}
                to={`/startup/${startup.company_id}`}
                className="block p-3 hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-3">
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
                    <div className="flex gap-1 mt-1">
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
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
