import { ContentStructure } from '@/types/analysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText,
  Hash,
  AlignLeft,
  BookOpen,
  Link,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ContentStructurePanelProps {
  structure: ContentStructure;
}

export function ContentStructurePanel({ structure }: ContentStructurePanelProps) {
  const getReadabilityColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getReadabilityStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const headingScore = Math.min(100, (structure.headings.h2 + structure.headings.h3) * 10);
  const paragraphScore = structure.paragraphs.averageLength < 100 ? 100 : 
                        structure.paragraphs.averageLength < 150 ? 75 : 50;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Content Structure Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Readability Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Readability Score
            </h3>
            <Badge 
              variant="outline" 
              className={getReadabilityColor(structure.readability.fleschScore)}
            >
              {structure.readability.fleschScore}/100 - {getReadabilityStatus(structure.readability.fleschScore)}
            </Badge>
          </div>
          
          <Progress 
            value={structure.readability.fleschScore} 
            className="h-2"
          />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Reading Level:</span>
              <span className="ml-2 font-medium">{structure.readability.grade}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Complexity:</span>
              <span className="ml-2 font-medium">{structure.readability.complexity}</span>
            </div>
          </div>
        </div>

        {/* Heading Structure */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Heading Structure
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{structure.headings.h1}</div>
              <div className="text-xs text-muted-foreground">H1 Tags</div>
              {structure.headings.h1 === 1 ? (
                <CheckCircle className="h-4 w-4 text-success mx-auto mt-1" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning mx-auto mt-1" />
              )}
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{structure.headings.h2}</div>
              <div className="text-xs text-muted-foreground">H2 Tags</div>
              {structure.headings.h2 >= 2 ? (
                <CheckCircle className="h-4 w-4 text-success mx-auto mt-1" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning mx-auto mt-1" />
              )}
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold">{structure.headings.h3}</div>
              <div className="text-xs text-muted-foreground">H3 Tags</div>
              <Info className="h-4 w-4 text-muted-foreground mx-auto mt-1" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Structure Score</span>
            <Badge variant="outline" className="text-xs">
              {headingScore}/100
            </Badge>
          </div>
          <Progress value={headingScore} className="h-2" />
          
          {structure.headings.issues.length > 0 && (
            <div className="space-y-2">
              {structure.headings.issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-2 text-sm p-2 bg-warning/10 border-l-4 border-l-warning rounded">
                  <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                  <span className="text-warning">{issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paragraph Analysis */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <AlignLeft className="h-4 w-4" />
            Paragraph Analysis
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Paragraphs</span>
                <span className="font-medium">{structure.paragraphs.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average Length</span>
                <span className="font-medium">{structure.paragraphs.averageLength} words</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Long Paragraphs</span>
                <span className="font-medium">{structure.paragraphs.longParagraphs}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paragraph Score</span>
                <Badge 
                  variant="outline" 
                  className={paragraphScore >= 75 ? 'text-success' : 'text-warning'}
                >
                  {paragraphScore}/100
                </Badge>
              </div>
            </div>
          </div>
          
          <Progress value={paragraphScore} className="h-2" />
          
          {structure.paragraphs.longParagraphs > 0 && (
            <div className="flex items-start gap-2 text-sm p-2 bg-warning/10 border-l-4 border-l-warning rounded">
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <span className="text-warning">
                {structure.paragraphs.longParagraphs} paragraphs are too long. Consider breaking them into shorter sections.
              </span>
            </div>
          )}
        </div>

        {/* Linking Suggestions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Link className="h-4 w-4" />
            Internal Linking Opportunities
          </h3>
          
          <div className="space-y-2">
            {structure.linkingSuggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-2 text-sm p-2 bg-primary/5 border-l-4 border-l-primary rounded">
                <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}