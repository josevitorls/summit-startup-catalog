
import React, { useState } from 'react';
import { Send, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useApp } from '../../contexts/AppContext';
import { Comment } from '../../types/startup';

interface CommentBoxProps {
  companyId: string;
}

export function CommentBox({ companyId }: CommentBoxProps) {
  const { state, dispatch } = useApp();
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');

  // Filter comments for this company
  const companyComments = state.comments.filter(comment => comment.companyId === companyId);

  const handleSubmitComment = () => {
    if (!newComment.trim() || !userName.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: 'user-' + Date.now(),
      userName: userName.trim(),
      content: newComment.trim(),
      timestamp: new Date(),
      companyId,
    };

    dispatch({ type: 'ADD_COMMENT', payload: comment });
    setNewComment('');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comentários ({companyComments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Seu nome"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Escreva seu comentário sobre esta startup..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 min-h-[80px]"
            />
          </div>
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || !userName.trim()}
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Comentário
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {companyComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum comentário ainda.</p>
              <p className="text-sm">Seja o primeiro a comentar sobre esta startup!</p>
            </div>
          ) : (
            companyComments
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 bg-muted/30 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
