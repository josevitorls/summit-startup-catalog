
import { useMemo } from 'react';
import { Startup, FilterState } from '../types/startup';
import { searchStartups } from '../services/dataLoader';

export function useStartupFilters(startups: Startup[], filters: FilterState): Startup[] {
  return useMemo(() => {
    let filtered = [...startups];

    // Search filter
    if (filters.search) {
      filtered = searchStartups(filtered, filters.search);
    }

    // Country filter
    if (filters.country) {
      filtered = filtered.filter(startup => 
        startup.country.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Industry filter
    if (filters.industry) {
      filtered = filtered.filter(startup => 
        startup.industry.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }

    // Funding tier filter
    if (filters.fundingTier) {
      filtered = filtered.filter(startup => 
        startup.funding_tier.toLowerCase().includes(filters.fundingTier.toLowerCase())
      );
    }

    // Fundraising filter
    if (filters.fundraising !== undefined) {
      filtered = filtered.filter(startup => startup.fundraising === filters.fundraising);
    }

    // Meet investors filter
    if (filters.meetInvestors !== undefined) {
      filtered = filtered.filter(startup => startup.meet_investors === filters.meetInvestors);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(startup => 
        startup.tags && filters.tags.some(tag => startup.tags.includes(tag))
      );
    }

    // Offering topics filter
    if (filters.offeringTopics.length > 0) {
      filtered = filtered.filter(startup => {
        const offeringTopics = startup.attendance_ids.flatMap(
          attendance => attendance.data.attendance.offeringTopics.edges.map(edge => edge.node.name)
        );
        return filters.offeringTopics.some(topic => 
          offeringTopics.some(offering => offering.toLowerCase().includes(topic.toLowerCase()))
        );
      });
    }

    // Seeking topics filter
    if (filters.seekingTopics.length > 0) {
      filtered = filtered.filter(startup => {
        const seekingTopics = startup.attendance_ids.flatMap(
          attendance => attendance.data.attendance.seekingTopics.edges.map(edge => edge.node.name)
        );
        return filters.seekingTopics.some(topic => 
          seekingTopics.some(seeking => seeking.toLowerCase().includes(topic.toLowerCase()))
        );
      });
    }

    return filtered;
  }, [startups, filters]);
}
