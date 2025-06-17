
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

    // Country filter (legacy single field)
    if (filters.country) {
      filtered = filtered.filter(startup => 
        startup.country.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Countries filter (new multi-select)
    if (filters.countries.length > 0) {
      filtered = filtered.filter(startup => 
        filters.countries.some(country => startup.country === country)
      );
    }

    // Cities filter
    if (filters.cities.length > 0) {
      filtered = filtered.filter(startup => 
        filters.cities.some(city => startup.city === city)
      );
    }

    // Provinces filter
    if (filters.provinces.length > 0) {
      filtered = filtered.filter(startup => 
        filters.provinces.some(province => startup.province === province)
      );
    }

    // Industry filter (legacy single field)
    if (filters.industry) {
      filtered = filtered.filter(startup => 
        startup.industry.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }

    // Industries filter (new multi-select)
    if (filters.industries.length > 0) {
      filtered = filtered.filter(startup => 
        filters.industries.some(industry => startup.industry === industry)
      );
    }

    // Funding tier filter (legacy single field)
    if (filters.fundingTier) {
      filtered = filtered.filter(startup => 
        startup.funding_tier.toLowerCase().includes(filters.fundingTier.toLowerCase())
      );
    }

    // Funding tiers filter (new multi-select)
    if (filters.fundingTiers.length > 0) {
      filtered = filtered.filter(startup => 
        filters.fundingTiers.some(tier => startup.funding_tier === tier)
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

    // Women founder filter
    if (filters.womenFounder !== undefined) {
      filtered = filtered.filter(startup => startup.startup_women_founder === filters.womenFounder);
    }

    // Black founder filter
    if (filters.blackFounder !== undefined) {
      filtered = filtered.filter(startup => startup.startup_black_founder === filters.blackFounder);
    }

    // Indigenous founder filter
    if (filters.indigenousFounder !== undefined) {
      filtered = filtered.filter(startup => startup.startup_indigenous_founder === filters.indigenousFounder);
    }

    // Endorsed by filter
    if (filters.endorsedBy.length > 0) {
      filtered = filtered.filter(startup => 
        startup.endorsed_by && filters.endorsedBy.some(endorser => 
          startup.endorsed_by.toLowerCase().includes(endorser.toLowerCase())
        )
      );
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
