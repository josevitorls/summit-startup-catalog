
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterSection } from './FilterSection';
import { MapPin, Globe, Building } from 'lucide-react';

interface GeographicFiltersProps {
  countries: string[];
  cities: string[];
  provinces: string[];
  selectedCountries: string[];
  selectedCities: string[];
  selectedProvinces: string[];
  onCountryChange: (country: string, checked: boolean) => void;
  onCityChange: (city: string, checked: boolean) => void;
  onProvinceChange: (province: string, checked: boolean) => void;
}

export function GeographicFilters({
  countries,
  cities,
  provinces,
  selectedCountries,
  selectedCities,
  selectedProvinces,
  onCountryChange,
  onCityChange,
  onProvinceChange
}: GeographicFiltersProps) {
  return (
    <>
      {/* Countries */}
      <FilterSection title="Países" icon={<Globe className="h-5 w-5" />}>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {countries.map(country => (
            <div key={country} className="flex items-center space-x-2">
              <Checkbox
                id={`country-${country}`}
                checked={selectedCountries.includes(country)}
                onCheckedChange={(checked) => onCountryChange(country, checked === true)}
              />
              <label htmlFor={`country-${country}`} className="text-sm">
                {country}
              </label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Cities */}
      <FilterSection title="Cidades" icon={<Building className="h-5 w-5" />}>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cities.map(city => (
            <div key={city} className="flex items-center space-x-2">
              <Checkbox
                id={`city-${city}`}
                checked={selectedCities.includes(city)}
                onCheckedChange={(checked) => onCityChange(city, checked === true)}
              />
              <label htmlFor={`city-${city}`} className="text-sm">
                {city}
              </label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Provinces */}
      <FilterSection title="Estados/Províncias" icon={<MapPin className="h-5 w-5" />}>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {provinces.map(province => (
            <div key={province} className="flex items-center space-x-2">
              <Checkbox
                id={`province-${province}`}
                checked={selectedProvinces.includes(province)}
                onCheckedChange={(checked) => onProvinceChange(province, checked === true)}
              />
              <label htmlFor={`province-${province}`} className="text-sm">
                {province}
              </label>
            </div>
          ))}
        </div>
      </FilterSection>
    </>
  );
}
