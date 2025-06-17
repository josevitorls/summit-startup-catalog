
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterSection } from './FilterSection';
import { Target, Search } from 'lucide-react';

interface TopicsFiltersProps {
  offeringTopics: string[];
  seekingTopics: string[];
  selectedOfferingTopics: string[];
  selectedSeekingTopics: string[];
  onOfferingTopicChange: (topic: string, checked: boolean) => void;
  onSeekingTopicChange: (topic: string, checked: boolean) => void;
}

export function TopicsFilters({
  offeringTopics,
  seekingTopics,
  selectedOfferingTopics,
  selectedSeekingTopics,
  onOfferingTopicChange,
  onSeekingTopicChange
}: TopicsFiltersProps) {
  return (
    <>
      {/* Offering Topics */}
      <FilterSection title="Tópicos Oferecidos" icon={<Target className="h-5 w-5" />}>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {offeringTopics.map(topic => (
            <div key={topic} className="flex items-center space-x-2">
              <Checkbox
                id={`offering-${topic}`}
                checked={selectedOfferingTopics.includes(topic)}
                onCheckedChange={(checked) => onOfferingTopicChange(topic, checked === true)}
              />
              <label htmlFor={`offering-${topic}`} className="text-sm">
                {topic}
              </label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Seeking Topics */}
      <FilterSection title="Tópicos Procurados" icon={<Search className="h-5 w-5" />}>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {seekingTopics.map(topic => (
            <div key={topic} className="flex items-center space-x-2">
              <Checkbox
                id={`seeking-${topic}`}
                checked={selectedSeekingTopics.includes(topic)}
                onCheckedChange={(checked) => onSeekingTopicChange(topic, checked === true)}
              />
              <label htmlFor={`seeking-${topic}`} className="text-sm">
                {topic}
              </label>
            </div>
          ))}
        </div>
      </FilterSection>
    </>
  );
}
