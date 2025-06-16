
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, ExternalLink, Calendar, Tag, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useApp } from '../contexts/AppContext';
import { CommentBox } from '../components/Comments/CommentBox';
import { Startup } from '../types/startup';

export default function StartupDetails() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useApp();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [newTag, setNewTag] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  useEffect(() => {
    if (id && state.startups.length > 0) {
      const foundStartup = state.startups.find(s => s.company_id === id);
      setStartup(foundStartup || null);
    }
  }, [id, state.startups]);

  if (!startup) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Startup não encontrada</h1>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao catálogo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const teamMembers = startup.attendance_ids.flatMap(
    attendance => {
      // Add null safety checks
      if (!attendance?.data?.attendance?.exhibitor?.team?.edges) {
        return [];
      }
      return attendance.data.attendance.exhibitor.team.edges.map(edge => edge.node);
    }
  );

  const offeringTopics = startup.attendance_ids.flatMap(
    attendance => {
      // Add null safety checks
      if (!attendance?.data?.attendance?.offeringTopics?.edges) {
        return [];
      }
      return attendance.data.attendance.offeringTopics.edges.map(edge => edge.node.name);
    }
  );

  const seekingTopics = startup.attendance_ids.flatMap(
    attendance => {
      // Add null safety checks
      if (!attendance?.data?.attendance?.seekingTopics?.edges) {
        return [];
      }
      return attendance.data.attendance.seekingTopics.edges.map(edge => edge.node.name);
    }
  );

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    dispatch({ type: 'ADD_CUSTOM_TAG', payload: newTag.trim() });
    dispatch({ 
      type: 'ADD_TAG_TO_STARTUP', 
      payload: { companyId: startup.company_id, tag: newTag.trim() }
    });
    setNewTag('');
    setShowAddTag(false);
  };

  const handleRemoveTag = (tag: string) => {
    dispatch({ 
      type: 'REMOVE_TAG_FROM_STARTUP', 
      payload: { companyId: startup.company_id, tag }
    });
  };

  const handleQuickAddTag = (tag: string) => {
    if (startup.tags?.includes(tag)) return;
    
    dispatch({ 
      type: 'ADD_TAG_TO_STARTUP', 
      payload: { companyId: startup.company_id, tag }
    });
  };

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
              {startup.logo_urls?.large ? (
                <img
                  src={startup.logo_urls.large}
                  alt={`${startup.name} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">
                    {startup.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{startup.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{startup.city}, {startup.province}, {startup.country}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Exhibition: {startup.exhibition_date}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{startup.industry}</Badge>
                <Badge variant="outline">{startup.funding_tier}</Badge>
                {startup.fundraising && (
                  <Badge variant="destructive">Fundraising</Badge>
                )}
                {startup.meet_investors && (
                  <Badge variant="secondary">Meet Investors</Badge>
                )}
                {startup.startup_women_founder && (
                  <Badge variant="outline">Women Founder</Badge>
                )}
              </div>
              
              <p className="text-lg leading-relaxed">{startup.elevator_pitch}</p>
              
              {/* External Links */}
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
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {startup.tags?.map((tag) => (
              <Badge key={tag} variant="default" className="flex items-center gap-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:bg-red-500/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            
            {showAddTag ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nova tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="px-2 py-1 text-sm border rounded"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddTag}>Adicionar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddTag(false)}>Cancelar</Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTag(true)}
                className="border-dashed"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Tag
              </Button>
            )}
          </div>
          
          {/* Quick Add Tags */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Tags rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {state.tags.filter(tag => !startup.tags?.includes(tag)).map((tag) => (
                <Button
                  key={tag}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAddTag(tag)}
                  className="border border-dashed"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
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
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.jobTitle}</p>
                    {member.bio && (
                      <p className="text-sm mt-1">{member.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Tópicos e Interesses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Offering Topics */}
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
            
            {/* Seeking Topics */}
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
          </CardContent>
        </Card>
      </div>

      {/* Comments Section */}
      <CommentBox companyId={startup.company_id} />
    </div>
  );
}
