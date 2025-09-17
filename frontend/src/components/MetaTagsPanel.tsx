import { MetaTags } from '@/types/analysis'; // ✅ use backend type
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tags, Copy, Edit, Eye, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MetaTagsPanelProps {
  metaTags: MetaTags;
}

export function MetaTagsPanel({ metaTags }: MetaTagsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTags, setEditedTags] = useState(metaTags);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: 'Copied!',
        description: `${field} copied to clipboard`,
        duration: 2000,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getCharacterCount = (text: string) => text.length;
  const getTitleStatus = (length: number) => {
    if (length <= 60) return { color: 'text-success', status: 'Good' };
    if (length <= 70) return { color: 'text-warning', status: 'Long' };
    return { color: 'text-destructive', status: 'Too Long' };
  };

  const getDescriptionStatus = (length: number) => {
    if (length >= 150 && length <= 160) return { color: 'text-success', status: 'Perfect' };
    if (length >= 120 && length <= 170) return { color: 'text-warning', status: 'Good' };
    return { color: 'text-destructive', status: 'Needs Work' };
  };

  const titleLength = getCharacterCount(editedTags.title);
  const descLength = getCharacterCount(editedTags.description);
  const titleStatus = getTitleStatus(titleLength);
  const descStatus = getDescriptionStatus(descLength);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            Meta Tags
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="hover-lift"
          >
            {isEditing ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Title Tag */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Title Tag</label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${titleStatus.color}`}>
                {titleLength}/60 - {titleStatus.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(editedTags.title, 'Title')}
                className="h-6 w-6 p-0"
              >
                {copiedField === 'Title' ? (
                  <CheckCircle className="h-3 w-3 text-success" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {isEditing ? (
            <Input
              value={editedTags.title}
              onChange={(e) => setEditedTags(prev => ({ ...prev, title: e.target.value }))}
              className="font-mono text-sm"
            />
          ) : (
            <div className="p-3 bg-muted/50 rounded-md">
              <code className="text-sm">{editedTags.title}</code>
            </div>
          )}
        </div>

        {/* Meta Description */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Meta Description</label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${descStatus.color}`}>
                {descLength}/160 - {descStatus.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(editedTags.description, 'Description')}
                className="h-6 w-6 p-0"
              >
                {copiedField === 'Description' ? (
                  <CheckCircle className="h-3 w-3 text-success" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {isEditing ? (
            <Textarea
              value={editedTags.description}
              onChange={(e) => setEditedTags(prev => ({ ...prev, description: e.target.value }))}
              className="font-mono text-sm resize-none"
              rows={3}
            />
          ) : (
            <div className="p-3 bg-muted/50 rounded-md">
              <code className="text-sm">{editedTags.description}</code>
            </div>
          )}
        </div>

        {/* Google Preview */}
        <div className="p-3 border rounded-lg bg-background">
          <p className="text-xs text-muted-foreground mb-1">Google Preview:</p>
          <div className="space-y-1">
            <h3 className="text-blue-600 hover:underline cursor-pointer text-sm font-medium line-clamp-2">
              {editedTags.title}
            </h3>
            <p className="text-xs text-green-600">yoursite.com</p>
            <p className="text-xs text-gray-600 line-clamp-2">
              {editedTags.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
