
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterSection } from './FilterSection';
import { Award } from 'lucide-react';

interface EndorsedByFilterProps {
  endorsers: string[];
  selectedEndorsers: string[];
  onEndorserChange: (endorser: string, checked: boolean) => void;
}

export function EndorsedByFilter({
  endorsers,
  selectedEndorsers,
  onEndorserChange
}: EndorsedByFilterProps) {
  return (
    <FilterSection title="Endorsed By" icon={<Award className="h-5 w-5" />}>
      <div className="space-y-2">
        {endorsers.map(endorser => (
          <div key={endorser} className="flex items-center space-x-2">
            <Checkbox
              id={`endorser-${endorser}`}
              checked={selectedEndorsers.includes(endorser)}
              onCheckedChange={(checked) => onEndorserChange(endorser, checked === true)}
            />
            <label htmlFor={`endorser-${endorser}`} className="text-sm">
              {endorser}
            </label>
          </div>
        ))}
      </div>
    </FilterSection>
  );
}
