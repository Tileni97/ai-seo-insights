import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, AlertTriangle, CheckCircle, Clock, Zap, Settings, FileText, Link, Copy, ExternalLink, Wand2 } from 'lucide-react';
import { Recommendation } from '@/types/analysis';
import { useState } from 'react';

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  originalText?: string;
  onTextUpdate?: (newText: string) => void;
}

export function RecommendationsPanel({ recommendations, originalText = '', onTextUpdate }: RecommendationsPanelProps) {
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<number>>(new Set());
  const [showImplementationHelp, setShowImplementationHelp] = useState<Record<number, boolean>>({});

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort.toLowerCase()) {
      case 'quick fix':
        return 'default';
      case 'moderate':
        return 'secondary';
      case 'complex':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'content':
        return FileText;
      case 'technical':
        return Settings;
      case 'keywords':
        return Zap;
      case 'links':
        return Link;
      default:
        return Lightbulb;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You might want to show a toast notification here
    });
  };

  const getImplementationSteps = (recommendation: Recommendation) => {
    const steps: string[] = [];
    
    switch (recommendation.category.toLowerCase()) {
      case 'technical':
        if (recommendation.title.includes('Title')) {
          steps.push('Update your page title tag in the HTML <head> section');
          steps.push('Ensure the title is between 30-60 characters');
          steps.push('Include your primary keyword near the beginning');
          steps.push('Make it compelling and click-worthy');
        } else if (recommendation.title.includes('Meta Description')) {
          steps.push('Update your meta description tag in the HTML <head> section');
          steps.push('Keep it between 120-160 characters');
          steps.push('Include your primary keyword naturally');
          steps.push('Add a call-to-action');
        } else if (recommendation.title.includes('Subheadings')) {
          steps.push('Add H2 tags for main sections');
          steps.push('Use H3 tags for subsections');
          steps.push('Include keywords in headings naturally');
          steps.push('Ensure logical content hierarchy');
        }
        break;
        
      case 'content':
        if (recommendation.title.includes('Length')) {
          steps.push('Expand each section with more detailed information');
          steps.push('Add examples, case studies, or data to support points');
          steps.push('Include frequently asked questions');
          steps.push('Add a comprehensive conclusion');
        } else if (recommendation.title.includes('Readability')) {
          steps.push('Break long sentences into shorter ones');
          steps.push('Use simpler, more common words');
          steps.push('Add bullet points and numbered lists');
          steps.push('Keep paragraphs under 3-4 sentences');
        }
        break;
        
      case 'keywords':
        if (recommendation.title.includes('primary keyword')) {
          const keyword = recommendation.title.match(/'([^']+)'/)?.[1] || 'your keyword';
          steps.push(`Include "${keyword}" in your title tag`);
          steps.push(`Use "${keyword}" in the first paragraph`);
          steps.push(`Add "${keyword}" to 2-3 subheadings naturally`);
          steps.push(`Include variations of "${keyword}" throughout content`);
        } else {
          steps.push('Research related keywords using Google Keyword Planner');
          steps.push('Add 3-5 relevant secondary keywords');
          steps.push('Include keywords in meta tags and headings');
          steps.push('Use keywords naturally in content');
        }
        break;
        
      case 'links':
        steps.push('Identify related pages on your website');
        steps.push('Add 2-3 contextual internal links');
        steps.push('Use descriptive anchor text');
        steps.push('Link to high-authority external sources when relevant');
        break;
    }
    
    return steps;
  };

  const getCodeExample = (recommendation: Recommendation) => {
    switch (recommendation.category.toLowerCase()) {
      case 'technical':
        if (recommendation.title.includes('Title')) {
          return `<title>Your Optimized Title Here (30-60 chars)</title>`;
        } else if (recommendation.title.includes('Meta Description')) {
          return `<meta name="description" content="Your compelling meta description here (120-160 chars)">`;
        } else if (recommendation.title.includes('Subheadings')) {
          return `<h2>Main Section Title with Keywords</h2>\n<h3>Subsection Title</h3>`;
        }
        break;
        
      case 'content':
        if (recommendation.title.includes('primary keyword')) {
          const keyword = recommendation.title.match(/'([^']+)'/)?.[1] || 'keyword';
          return `<h1>Title with ${keyword}</h1>\n<p>First paragraph mentioning ${keyword} naturally...</p>`;
        }
        break;
    }
    return null;
  };

  const toggleImplementationHelp = (id: number) => {
    setShowImplementationHelp(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const markAsApplied = (id: number) => {
    setAppliedRecommendations(prev => new Set(prev.add(id)));
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const impactA = impactOrder[a.impact as keyof typeof impactOrder] || 0;
    const impactB = impactOrder[b.impact as keyof typeof impactOrder] || 0;
    
    return impactB - impactA;
  });

  const highPriorityCount = recommendations.filter(rec => rec.priority <= 2).length;
  const quickFixCount = recommendations.filter(rec => rec.effort === 'Quick Fix').length;
  const appliedCount = appliedRecommendations.size;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          AI Recommendations
          <Badge variant="outline" className="ml-auto">
            {appliedCount}/{recommendations.length} applied
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            {highPriorityCount} high priority
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {quickFixCount} quick fixes
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {sortedRecommendations.length > 0 ? (
          sortedRecommendations.map((recommendation, index) => {
            const CategoryIcon = getCategoryIcon(recommendation.category);
            const isApplied = appliedRecommendations.has(recommendation.id);
            const showHelp = showImplementationHelp[recommendation.id];
            const steps = getImplementationSteps(recommendation);
            const codeExample = getCodeExample(recommendation);
            
            return (
              <div 
                key={recommendation.id} 
                className={`p-4 border border-border rounded-lg transition-all animate-slide-up ${
                  isApplied ? 'bg-success/5 border-success/20' : 'hover:bg-muted/30'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {isApplied ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <CategoryIcon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-grow space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-semibold leading-tight ${isApplied ? 'text-success line-through' : 'text-foreground'}`}>
                        {recommendation.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {recommendation.priority <= 2 && !isApplied && (
                          <div className="w-2 h-2 bg-red-500 rounded-full" title="High Priority" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {recommendation.description}
                    </p>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Badge 
                        variant={getImpactColor(recommendation.impact)}
                        className="text-xs"
                      >
                        {recommendation.impact} Impact
                      </Badge>
                      <Badge 
                        variant={getEffortColor(recommendation.effort)}
                        className="text-xs"
                      >
                        {recommendation.effort}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {recommendation.category}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleImplementationHelp(recommendation.id)}
                        className="text-xs"
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        {showHelp ? 'Hide Guide' : 'How to Fix'}
                      </Button>
                      
                      {!isApplied && (
                        <Button
                          size="sm"
                          onClick={() => markAsApplied(recommendation.id)}
                          className="text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark as Applied
                        </Button>
                      )}
                    </div>

                    {/* Implementation Help */}
                    {showHelp && (
                      <div className="mt-4 p-4 bg-primary/5 border-l-4 border-l-primary rounded animate-fade-in">
                        <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Implementation Steps
                        </h5>
                        
                        <ol className="text-sm space-y-2 mb-4">
                          {steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full text-xs flex items-center justify-center font-medium">
                                {stepIndex + 1}
                              </span>
                              <span className="text-muted-foreground">{step}</span>
                            </li>
                          ))}
                        </ol>

                        {/* Code Example */}
                        {codeExample && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">Code Example:</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(codeExample)}
                                className="h-6 px-2 text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-muted/50 p-3 rounded text-xs overflow-x-auto">
                              <code>{codeExample}</code>
                            </pre>
                          </div>
                        )}

                        {/* Additional Resources */}
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ExternalLink className="h-3 w-3" />
                            <span>Need help? Check our documentation or contact support</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Great job!</h3>
            <p className="text-muted-foreground">
              Your content is well-optimized. No major recommendations at this time.
            </p>
          </div>
        )}
        
        {recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Pro Tip</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Focus on high-impact, quick-fix recommendations first for immediate SEO improvements. 
              Use the implementation guides to make changes step-by-step, and mark items as applied to track your progress.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}