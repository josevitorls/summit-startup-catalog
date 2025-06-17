
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterSection } from './FilterSection';
import { Users } from 'lucide-react';

interface DiversityFiltersProps {
  womenFounderOnly: boolean;
  blackFounderOnly: boolean;
  indigenousFounderOnly: boolean;
  onWomenFounderChange: (checked: boolean) => void;
  onBlackFounderChange: (checked: boolean) => void;
  onIndigenousFounderChange: (checked: boolean) => void;
}

export function DiversityFilters({
  womenFounderOnly,
  blackFounderOnly,
  indigenousFounderOnly,
  onWomenFounderChange,
  onBlackFounderChange,
  onIndigenousFounderChange
}: DiversityFiltersProps) {
  return (
    <FilterSection title="Diversidade" icon={<Users className="h-5 w-5" />}>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="women-founder"
            checked={womenFounderOnly}
            onCheckedChange={onWomenFounderChange}
          />
          <label htmlFor="women-founder" className="text-sm">
            Women Founder
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="black-founder"
            checked={blackFounderOnly}
            onCheckedChange={onBlackFounderChange}
          />
          <label htmlFor="black-founder" className="text-sm">
            Black Founder
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="indigenous-founder"
            checked={indigenousFounderOnly}
            onCheckedChange={onIndigenousFounderChange}
          />
          <label htmlFor="indigenous-founder" className="text-sm">
            Indigenous Founder
          </label>
        </div>
      </div>
    </FilterSection>
  );
}
