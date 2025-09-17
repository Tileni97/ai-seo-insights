import { GooglePreview } from '@/types/analysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Search, Globe } from 'lucide-react';

interface GooglePreviewPanelProps {
  preview: GooglePreview;
}

export function GooglePreviewPanel({ preview }: GooglePreviewPanelProps) {
  const getTitleStatus = () => {
    if (preview.title.length < 30) return { status: 'Too Short', color: 'destructive', icon: AlertTriangle };
    if (preview.title.length > 60) return { status: 'Too Long', color: 'destructive', icon: AlertTriangle };
    return { status: 'Good Length', color: 'default', icon: CheckCircle };
  };

  const getDescriptionStatus = () => {
    if (preview.description.length < 120) return { status: 'Too Short', color: 'destructive', icon: AlertTriangle };
    if (preview.description.length > 160) return { status: 'Too Long', color: 'destructive', icon: AlertTriangle };
    return { status: 'Good Length', color: 'default', icon: CheckCircle };
  };

  const titleStatus = getTitleStatus();
  const descriptionStatus = getDescriptionStatus();

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Google Search Preview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How your content will appear in Google search results
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Google Search Result Preview */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* URL */}
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-green-700" />
            <span className="text-sm text-green-700">{preview.url}</span>
          </div>
          
          {/* Title */}
          <h3 className="text-blue-600 text-lg hover:underline cursor-pointer mb-1 leading-tight">
            {preview.titleTruncated ? `${preview.title.slice(0, 57)}...` : preview.title}
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed">
            {preview.descriptionTruncated ? `${preview.description.slice(0, 157)}...` : preview.description}
          </p>
        </div>

        {/* Status Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Title Tag</span>
              <Badge variant={titleStatus.color as any} className="text-xs flex items-center gap-1">
                <titleStatus.icon className="h-3 w-3" />
                {titleStatus.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{preview.title.length}</span> characters
              <span className="ml-2">(30-60 recommended)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  preview.title.length >= 30 && preview.title.length <= 60 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((preview.title.length / 60) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Description Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Meta Description</span>
              <Badge variant={descriptionStatus.color as any} className="text-xs flex items-center gap-1">
                <descriptionStatus.icon className="h-3 w-3" />
                {descriptionStatus.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{preview.description.length}</span> characters
              <span className="ml-2">(120-160 recommended)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  preview.description.length >= 120 && preview.description.length <= 160 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((preview.description.length / 160) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {(preview.titleTruncated || preview.descriptionTruncated) && (
          <div className="space-y-2">
            {preview.titleTruncated && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border-l-4 border-l-destructive rounded">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-destructive">Title will be truncated</span>
                  <p className="text-muted-foreground mt-1">
                    Your title is too long and will be cut off in search results. Consider shortening it to 30-60 characters.
                  </p>
                </div>
              </div>
            )}
            
            {preview.descriptionTruncated && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border-l-4 border-l-destructive rounded">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-destructive">Description will be truncated</span>
                  <p className="text-muted-foreground mt-1">
                    Your meta description is too long and will be cut off in search results. Consider shortening it to 120-160 characters.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Optimization Tips */}
        <div className="p-4 bg-primary/5 border-l-4 border-l-primary rounded">
          <h4 className="font-medium text-sm mb-2">Optimization Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Include your primary keyword in the title</li>
            <li>• Make your title compelling and click-worthy</li>
            <li>• Write a description that summarizes your content</li>
            <li>• Include a call-to-action in your description</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}