
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Table } from 'lucide-react';
import { Startup } from '../../types/startup';

interface ExportOptionsProps {
  startups: Startup[];
  selectedStartups: Set<string>;
}

export function ExportOptions({ startups, selectedStartups }: ExportOptionsProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [includeFields, setIncludeFields] = useState({
    basic: true,
    contact: true,
    team: false,
    topics: false,
    urls: false,
    tags: true
  });

  const exportFields = [
    { key: 'basic', label: 'Informações Básicas', description: 'Nome, cidade, país, indústria' },
    { key: 'contact', label: 'Contato', description: 'Website, LinkedIn, redes sociais' },
    { key: 'team', label: 'Equipe', description: 'Membros da equipe e funções' },
    { key: 'topics', label: 'Tópicos', description: 'Oferecendo e buscando' },
    { key: 'urls', label: 'URLs Externas', description: 'Todas as URLs sociais' },
    { key: 'tags', label: 'Tags', description: 'Tags e categorias' }
  ];

  const selectedStartupsList = startups.filter(s => selectedStartups.has(s.company_id));

  const handleExport = () => {
    if (selectedStartupsList.length === 0) {
      alert('Selecione ao menos uma startup para exportar');
      return;
    }

    const headers: string[] = [];
    const getData = (startup: Startup): string[] => {
      const row: string[] = [];

      if (includeFields.basic) {
        if (headers.length === 0) {
          headers.push('Nome', 'Cidade', 'País', 'Indústria', 'Funding Tier', 'Descrição');
        }
        row.push(
          startup.name,
          startup.city,
          startup.country,
          startup.industry,
          startup.funding_tier,
          startup.elevator_pitch.replace(/"/g, '""')
        );
      }

      if (includeFields.contact) {
        if (headers.filter(h => h.includes('Website')).length === 0) {
          headers.push('Website', 'LinkedIn');
        }
        row.push(
          startup.external_urls.homepage || '',
          startup.external_urls.linkedin || ''
        );
      }

      if (includeFields.tags) {
        if (headers.filter(h => h.includes('Tags')).length === 0) {
          headers.push('Tags');
        }
        row.push(startup.tags?.join('; ') || '');
      }

      return row;
    };

    if (exportFormat === 'csv') {
      const csvData = selectedStartupsList.map(getData);
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `startups_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const jsonData = selectedStartupsList.map(startup => {
        const data: any = {};
        
        if (includeFields.basic) {
          data.basic = {
            name: startup.name,
            city: startup.city,
            country: startup.country,
            industry: startup.industry,
            funding_tier: startup.funding_tier,
            elevator_pitch: startup.elevator_pitch
          };
        }

        if (includeFields.contact) {
          data.contact = {
            website: startup.external_urls.homepage,
            linkedin: startup.external_urls.linkedin
          };
        }

        if (includeFields.tags) {
          data.tags = startup.tags;
        }

        return data;
      });

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `startups_export_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={selectedStartups.size === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar ({selectedStartups.size})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Opções de Exportação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Formato</label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Campos para Incluir</label>
            <div className="space-y-3">
              {exportFields.map(field => (
                <div key={field.key} className="flex items-start space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={includeFields[field.key as keyof typeof includeFields]}
                    onCheckedChange={(checked) => 
                      setIncludeFields(prev => ({ ...prev, [field.key]: checked === true }))
                    }
                  />
                  <div className="flex-1">
                    <label htmlFor={field.key} className="text-sm font-medium">
                      {field.label}
                    </label>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleExport} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Exportar {selectedStartups.size} startups
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
