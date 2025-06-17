import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Download, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStartups, useIndustries, useFundingTiers, usePredefinedTags } from '../hooks/useSupabaseData';
import { useStartupFilters } from '../hooks/useStartupFilters';
import { StartupCard } from '../components/StartupCard/StartupCard';
import { StartupList } from '../components/StartupList/StartupList';
import { DiversityFilters } from '../components/StartupFilters/DiversityFilters';
import { GeographicFilters } from '../components/StartupFilters/GeographicFilters';
import { TopicsFilters } from '../components/StartupFilters/TopicsFilters';
import { EndorsedByFilter } from '../components/StartupFilters/EndorsedByFilter';
import { FilterSection } from '../components/StartupFilters/FilterSection';

interface SavedFilter {
  id: string;
  name: string;
  filters: any;
  createdAt: Date;
}

export default function Filters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedFundingTiers, setSelectedFundingTiers] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedOfferingTopics, setSelectedOfferingTopics] = useState<string[]>([]);
  const [selectedSeekingTopics, setSelectedSeekingTopics] = useState<string[]>([]);
  const [selectedEndorsers, setSelectedEndorsers] = useState<string[]>([]);
  const [fundraisingOnly, setFundraisingOnly] = useState(false);
  const [meetInvestorsOnly, setMeetInvestorsOnly] = useState(false);
  const [womenFounderOnly, setWomenFounderOnly] = useState(false);
  const [blackFounderOnly, setBlackFounderOnly] = useState(false);
  const [indigenousFounderOnly, setIndigenousFounderOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState('');

  const { data: startups = [], isLoading } = useStartups();
  const { data: industries = [] } = useIndustries();
  const { data: fundingTiers = [] } = useFundingTiers();
  const { data: predefinedTags = [] } = usePredefinedTags();

  // Extract unique values from startups data
  const { countries, cities, provinces, offeringTopics, seekingTopics, endorsers } = useMemo(() => {
    const countriesSet = new Set<string>();
    const citiesSet = new Set<string>();
    const provincesSet = new Set<string>();
    const offeringTopicsSet = new Set<string>();
    const seekingTopicsSet = new Set<string>();
    const endorsersSet = new Set<string>();

    startups.forEach(startup => {
      if (startup.country) countriesSet.add(startup.country);
      if (startup.city) citiesSet.add(startup.city);
      if (startup.province) provincesSet.add(startup.province);
      if (startup.endorsed_by) endorsersSet.add(startup.endorsed_by);

      // Extract topics from attendance data
      startup.attendance_ids.forEach(attendance => {
        attendance.data.attendance.offeringTopics.edges.forEach(edge => {
          offeringTopicsSet.add(edge.node.name);
        });
        attendance.data.attendance.seekingTopics.edges.forEach(edge => {
          seekingTopicsSet.add(edge.node.name);
        });
      });
    });

    return {
      countries: Array.from(countriesSet).sort(),
      cities: Array.from(citiesSet).sort(),
      provinces: Array.from(provincesSet).sort(),
      offeringTopics: Array.from(offeringTopicsSet).sort(),
      seekingTopics: Array.from(seekingTopicsSet).sort(),
      endorsers: Array.from(endorsersSet).sort()
    };
  }, [startups]);

  // Apply filters
  const filters = {
    search: searchTerm,
    country: '',
    industry: '',
    fundingTier: '',
    countries: selectedCountries,
    cities: selectedCities,
    provinces: selectedProvinces,
    industries: selectedIndustries,
    fundingTiers: selectedFundingTiers,
    fundraising: fundraisingOnly ? true : undefined,
    meetInvestors: meetInvestorsOnly ? true : undefined,
    womenFounder: womenFounderOnly ? true : undefined,
    blackFounder: blackFounderOnly ? true : undefined,
    indigenousFounder: indigenousFounderOnly ? true : undefined,
    tags: selectedTags,
    offeringTopics: selectedOfferingTopics,
    seekingTopics: selectedSeekingTopics,
    endorsedBy: selectedEndorsers
  };

  const filteredStartups = useStartupFilters(startups, filters);

  const handleCountryChange = (country: string, checked: boolean) => {
    if (checked) {
      setSelectedCountries([...selectedCountries, country]);
    } else {
      setSelectedCountries(selectedCountries.filter(c => c !== country));
    }
  };

  const handleCityChange = (city: string, checked: boolean) => {
    if (checked) {
      setSelectedCities([...selectedCities, city]);
    } else {
      setSelectedCities(selectedCities.filter(c => c !== city));
    }
  };

  const handleProvinceChange = (province: string, checked: boolean) => {
    if (checked) {
      setSelectedProvinces([...selectedProvinces, province]);
    } else {
      setSelectedProvinces(selectedProvinces.filter(p => p !== province));
    }
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    if (checked) {
      setSelectedIndustries([...selectedIndustries, industry]);
    } else {
      setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
    }
  };

  const handleFundingTierChange = (tier: string, checked: boolean) => {
    if (checked) {
      setSelectedFundingTiers([...selectedFundingTiers, tier]);
    } else {
      setSelectedFundingTiers(selectedFundingTiers.filter(t => t !== tier));
    }
  };

  const handleOfferingTopicChange = (topic: string, checked: boolean) => {
    if (checked) {
      setSelectedOfferingTopics([...selectedOfferingTopics, topic]);
    } else {
      setSelectedOfferingTopics(selectedOfferingTopics.filter(t => t !== topic));
    }
  };

  const handleSeekingTopicChange = (topic: string, checked: boolean) => {
    if (checked) {
      setSelectedSeekingTopics([...selectedSeekingTopics, topic]);
    } else {
      setSelectedSeekingTopics(selectedSeekingTopics.filter(t => t !== topic));
    }
  };

  const handleEndorserChange = (endorser: string, checked: boolean) => {
    if (checked) {
      setSelectedEndorsers([...selectedEndorsers, endorser]);
    } else {
      setSelectedEndorsers(selectedEndorsers.filter(e => e !== endorser));
    }
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: {
        searchTerm,
        selectedCountries,
        selectedIndustries,
        selectedFundingTiers,
        selectedTags,
        fundraisingOnly,
        meetInvestorsOnly,
        womenFounderOnly
      },
      createdAt: new Date()
    };

    setSavedFilters([...savedFilters, newFilter]);
    setFilterName('');
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    setSearchTerm(filter.filters.searchTerm || '');
    setSelectedCountries(filter.filters.selectedCountries || []);
    setSelectedIndustries(filter.filters.selectedIndustries || []);
    setSelectedFundingTiers(filter.filters.selectedFundingTiers || []);
    setSelectedTags(filter.filters.selectedTags || []);
    setFundraisingOnly(filter.filters.fundraisingOnly || false);
    setMeetInvestorsOnly(filter.filters.meetInvestorsOnly || false);
    setWomenFounderOnly(filter.filters.womenFounderOnly || false);
  };

  const handleDeleteFilter = (filterId: string) => {
    setSavedFilters(savedFilters.filter(f => f.id !== filterId));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCountries([]);
    setSelectedCities([]);
    setSelectedProvinces([]);
    setSelectedIndustries([]);
    setSelectedFundingTiers([]);
    setSelectedTags([]);
    setSelectedOfferingTopics([]);
    setSelectedSeekingTopics([]);
    setSelectedEndorsers([]);
    setFundraisingOnly(false);
    setMeetInvestorsOnly(false);
    setWomenFounderOnly(false);
    setBlackFounderOnly(false);
    setIndigenousFounderOnly(false);
  };

  const handleExportFiltered = () => {
    if (filteredStartups.length === 0) {
      alert('Nenhuma startup encontrada com os filtros atuais');
      return;
    }

    const csvHeaders = [
      'Nome',
      'Cidade',
      'País',
      'Indústria',
      'Funding Tier',
      'Descrição',
      'Fundraising',
      'Meet Investors',
      'Women Founder',
      'Website',
      'LinkedIn',
      'Tags'
    ];

    const csvData = filteredStartups.map(startup => [
      startup.name,
      startup.city,
      startup.country,
      startup.industry,
      startup.funding_tier,
      startup.elevator_pitch.replace(/"/g, '""'),
      startup.fundraising ? 'Sim' : 'Não',
      startup.meet_investors ? 'Sim' : 'Não',
      startup.startup_women_founder ? 'Sim' : 'Não',
      startup.external_urls.homepage || '',
      startup.external_urls.linkedin || '',
      startup.tags?.join('; ') || ''
    ].map(field => `"${field}"`));

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `startups_filtered_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando filtros...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Filtros Avançados</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com Filtros */}
        <div className="lg:col-span-1 space-y-6">
          {/* Busca */}
          <FilterSection title="Busca" icon={<Search className="h-5 w-5" />}>
            <Input
              placeholder="Buscar por nome, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FilterSection>

          {/* Geographic Filters */}
          <GeographicFilters
            countries={countries}
            cities={cities}
            provinces={provinces}
            selectedCountries={selectedCountries}
            selectedCities={selectedCities}
            selectedProvinces={selectedProvinces}
            onCountryChange={handleCountryChange}
            onCityChange={handleCityChange}
            onProvinceChange={handleProvinceChange}
          />

          {/* Indústrias */}
          <FilterSection title="Indústrias">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {industries.map(industry => (
                <div key={industry} className="flex items-center space-x-2">
                  <Checkbox
                    id={`industry-${industry}`}
                    checked={selectedIndustries.includes(industry)}
                    onCheckedChange={(checked) => handleIndustryChange(industry, checked === true)}
                  />
                  <label htmlFor={`industry-${industry}`} className="text-sm">
                    {industry}
                  </label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Funding Tiers */}
          <FilterSection title="Funding Tiers">
            <div className="space-y-2">
              {fundingTiers.map(tier => (
                <div key={tier} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tier-${tier}`}
                    checked={selectedFundingTiers.includes(tier)}
                    onCheckedChange={(checked) => handleFundingTierChange(tier, checked === true)}
                  />
                  <label htmlFor={`tier-${tier}`} className="text-sm">
                    {tier}
                  </label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Endorsed By Filter */}
          {endorsers.length > 0 && (
            <EndorsedByFilter
              endorsers={endorsers}
              selectedEndorsers={selectedEndorsers}
              onEndorserChange={handleEndorserChange}
            />
          )}

          {/* Topics Filters */}
          <TopicsFilters
            offeringTopics={offeringTopics}
            seekingTopics={seekingTopics}
            selectedOfferingTopics={selectedOfferingTopics}
            selectedSeekingTopics={selectedSeekingTopics}
            onOfferingTopicChange={handleOfferingTopicChange}
            onSeekingTopicChange={handleSeekingTopicChange}
          />

          {/* Tags */}
          <FilterSection title="Tags">
            <div className="space-y-2">
              {predefinedTags.map(tag => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTags.includes(tag.name)}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        setSelectedTags([...selectedTags, tag.name]);
                      } else {
                        setSelectedTags(selectedTags.filter(t => t !== tag.name));
                      }
                    }}
                  />
                  <Badge variant="outline" style={{ borderColor: tag.color }}>
                    {tag.name}
                  </Badge>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Diversity Filters */}
          <DiversityFilters
            womenFounderOnly={womenFounderOnly}
            blackFounderOnly={blackFounderOnly}
            indigenousFounderOnly={indigenousFounderOnly}
            onWomenFounderChange={setWomenFounderOnly}
            onBlackFounderChange={setBlackFounderOnly}
            onIndigenousFounderChange={setIndigenousFounderOnly}
          />

          {/* Filtros Especiais */}
          <FilterSection title="Filtros Especiais">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fundraising"
                  checked={fundraisingOnly}
                  onCheckedChange={(checked) => setFundraisingOnly(checked === true)}
                />
                <label htmlFor="fundraising" className="text-sm">
                  Apenas Fundraising
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="meet-investors"
                  checked={meetInvestorsOnly}
                  onCheckedChange={(checked) => setMeetInvestorsOnly(checked === true)}
                />
                <label htmlFor="meet-investors" className="text-sm">
                  Meet Investors
                </label>
              </div>
            </div>
          </FilterSection>

          {/* Controles */}
          <FilterSection title="Controles">
            <div className="space-y-3">
              <Button variant="outline" onClick={clearAllFilters} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
              <Button onClick={() => {}} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar ({filteredStartups.length})
              </Button>
            </div>
          </FilterSection>

          {/* Salvar Filtros */}
          <FilterSection title="Salvar Filtros">
            <div className="space-y-3">
              <Input
                placeholder="Nome do filtro..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
              <Button onClick={handleSaveFilter} className="w-full" disabled={!filterName.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </FilterSection>

          {/* Filtros Salvos */}
          {savedFilters.length > 0 && (
            <FilterSection title="Filtros Salvos">
              <div className="space-y-2">
                {savedFilters.map(filter => (
                  <div key={filter.id} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadFilter(filter)}
                      className="flex-1"
                    >
                      {filter.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFilter(filter.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </FilterSection>
          )}
        </div>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header dos Resultados */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {filteredStartups.length} startups encontradas
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    de {startups.length} startups totais
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={viewMode} onValueChange={(value: 'cards' | 'list') => setViewMode(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cards">Cards</SelectItem>
                      <SelectItem value="list">Lista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          {filteredStartups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma startup encontrada</h3>
                  <p>Tente ajustar os filtros para encontrar mais resultados.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredStartups.map((startup) => (
                    <StartupCard
                      key={startup.company_id}
                      startup={startup}
                      showSelection={false}
                    />
                  ))}
                </div>
              )}

              {viewMode === 'list' && (
                <Card>
                  <CardContent className="p-0">
                    <StartupList startups={filteredStartups} showSelection={false} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
