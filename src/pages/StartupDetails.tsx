
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, ExternalLink, Calendar, Tag, Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useStartups } from '../hooks/useSupabaseData';
import { CommentBox } from '../components/Comments/CommentBox';
import { Startup } from '../types/startup';

export default function StartupDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: startups = [], isLoading, error } = useStartups();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [newTag, setNewTag] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  useEffect(() => {
    if (id && startups.length > 0) {
      // Procurar por company_id primeiro, depois por id
      const foundStartup = startups.find(s => s.company_id === id) || 
                          startups.find(s => s.company_id.includes(id)) ||
                          startups.find(s => s.name.toLowerCase().includes(id.toLowerCase()));
      
      console.log('🔍 Procurando startup com ID:', id);
      console.log('📊 Total de startups disponíveis:', startups.length);
      console.log('🎯 Startup encontrada:', foundStartup?.name || 'Nenhuma');
      
      setStartup(foundStartup || null);
    }
  }, [id, startups]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-lg w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded-lg w-48 mx-auto"></div>
          </div>
          <p className="text-muted-foreground mt-4">Carregando detalhes da startup...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-4 text-destructive">Erro ao Carregar</h1>
            <p className="text-muted-foreground mb-6">{error.message}</p>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao catálogo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h1 className="text-2xl font-bold mb-4">Startup não encontrada</h1>
            <p className="text-muted-foreground mb-6">
              Não foi possível encontrar uma startup com o ID "{id}". 
              {startups.length === 0 && " Talvez a migração de dados ainda não tenha sido concluída."}
            </p>
            <div className="space-y-2">
              {startups.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Existem {startups.length} startups carregadas. Tente buscar por nome na página principal.
                </p>
              )}
              <Link to="/">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao catálogo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extrair dados dos membros da equipe de forma segura
  const teamMembers = startup.attendance_ids?.flatMap(
    attendance => {
      if (!attendance?.data?.attendance?.exhibitor?.team?.edges) {
        return [];
      }
      return attendance.data.attendance.exhibitor.team.edges.map(edge => edge.node);
    }
  ) || [];

  // Extrair tópicos oferecidos de forma segura
  const offeringTopics = startup.attendance_ids?.flatMap(
    attendance => {
      if (!attendance?.data?.attendance?.offeringTopics?.edges) {
        return [];
      }
      return attendance.data.attendance.offeringTopics.edges.map(edge => edge.node.name);
    }
  ) || [];

  // Extrair tópicos procurados de forma segura
  const seekingTopics = startup.attendance_ids?.flatMap(
    attendance => {
      if (!attendance?.data?.attendance?.seekingTopics?.edges) {
        return [];
      }
      return attendance.data.attendance.seekingTopics.edges.map(edge => edge.node.name);
    }
  ) || [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Company Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              {startup.logo_urls?.large || startup.logo_urls?.original ? (
                <img
                  src={startup.logo_urls.large || startup.logo_urls.original}
                  alt={`${startup.name} logo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-primary/10 flex items-center justify-center ${startup.logo_urls?.large || startup.logo_urls?.original ? 'hidden' : ''}`}>
                <span className="text-primary font-bold text-2xl">
                  {startup.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{startup.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  {(startup.city || startup.province || startup.country) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[startup.city, startup.province, startup.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {startup.exhibition_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Exhibition: {startup.exhibition_date}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {startup.industry && (
                  <Badge variant="secondary">{startup.industry}</Badge>
                )}
                {startup.funding_tier && startup.funding_tier !== 'Not specified' && (
                  <Badge variant="outline">{startup.funding_tier}</Badge>
                )}
                {startup.fundraising && (
                  <Badge variant="destructive">Fundraising</Badge>
                )}
                {startup.meet_investors && (
                  <Badge variant="secondary">Meet Investors</Badge>
                )}
                {startup.startup_women_founder && (
                  <Badge variant="outline">Women Founder</Badge>
                )}
                {startup.startup_black_founder && (
                  <Badge variant="outline">Black Founder</Badge>
                )}
                {startup.startup_indigenous_founder && (
                  <Badge variant="outline">Indigenous Founder</Badge>
                )}
              </div>
              
              {startup.elevator_pitch && (
                <p className="text-lg leading-relaxed">{startup.elevator_pitch}</p>
              )}
              
              {/* External Links */}
              {startup.external_urls && Object.values(startup.external_urls).some(url => url) && (
                <div className="flex flex-wrap gap-2">
                  {startup.external_urls.homepage && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={startup.external_urls.homepage} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                  {startup.external_urls.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={startup.external_urls.linkedin} target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {startup.external_urls.instagram && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={startup.external_urls.instagram} target="_blank" rel="noopener noreferrer">
                        Instagram
                      </a>
                    </Button>
                  )}
                  {startup.external_urls.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={startup.external_urls.twitter} target="_blank" rel="noopener noreferrer">
                        Twitter
                      </a>
                    </Button>
                  )}
                  {startup.external_urls.facebook && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={startup.external_urls.facebook} target="_blank" rel="noopener noreferrer">
                        Facebook
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tags Section */}
      {startup.tags && startup.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {startup.tags.map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        {teamMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipe ({teamMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Avatar>
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{member.name}</h3>
                      {member.jobTitle && (
                        <p className="text-sm text-muted-foreground">{member.jobTitle}</p>
                      )}
                      {member.bio && (
                        <p className="text-sm mt-1">{member.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Topics */}
        {(offeringTopics.length > 0 || seekingTopics.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Tópicos e Interesses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Offering Topics */}
              {offeringTopics.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Oferecendo:</h3>
                  <div className="flex flex-wrap gap-1">
                    {offeringTopics.map((topic, index) => (
                      <Badge key={index} variant="default" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Seeking Topics */}
              {seekingTopics.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Procurando:</h3>
                  <div className="flex flex-wrap gap-1">
                    {seekingTopics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {offeringTopics.length === 0 && seekingTopics.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum tópico disponível para esta startup.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comments Section */}
      <CommentBox companyId={startup.company_id} />
    </div>
  );
}
