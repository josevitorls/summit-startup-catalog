
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Globe, Building, DollarSign } from 'lucide-react';

interface StartupStatsProps {
  stats: {
    total: number;
    fundraising: number;
    meetInvestors: number;
    countries: number;
    industries: number;
    womenFounders: number;
    blackFounders: number;
    indigenousFounders: number;
  };
}

export function StartupStats({ stats }: StartupStatsProps) {
  const statCards = [
    {
      title: "Total Startups",
      value: stats.total,
      icon: Building,
      color: "text-blue-600"
    },
    {
      title: "Fundraising",
      value: stats.fundraising,
      icon: DollarSign,
      color: "text-green-600",
      percentage: Math.round((stats.fundraising / stats.total) * 100)
    },
    {
      title: "Meet Investors",
      value: stats.meetInvestors,
      icon: TrendingUp,
      color: "text-purple-600",
      percentage: Math.round((stats.meetInvestors / stats.total) * 100)
    },
    {
      title: "Países",
      value: stats.countries,
      icon: Globe,
      color: "text-orange-600"
    }
  ];

  const diversityStats = [
    { label: "Women Founders", value: stats.womenFounders, color: "bg-pink-100 text-pink-800" },
    { label: "Black Founders", value: stats.blackFounders, color: "bg-purple-100 text-purple-800" },
    { label: "Indigenous Founders", value: stats.indigenousFounders, color: "bg-green-100 text-green-800" }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.percentage && (
                      <p className="text-xs text-muted-foreground">
                        {stat.percentage}% do total
                      </p>
                    )}
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diversidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {diversityStats.map((stat) => (
              <Badge key={stat.label} className={stat.color}>
                {stat.label}: {stat.value}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
