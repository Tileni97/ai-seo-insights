import { AnalysisResult } from '@/types/analysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/CircularProgress';
import { KeywordsPanel } from '@/components/KeywordsPanel';
import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { MetaTagsPanel } from '@/components/MetaTagsPanel';
import { GooglePreviewPanel } from '@/components/GooglePreviewPanel';
import { ContentStructurePanel } from '@/components/ContentStructurePanel';
import { 
  BookOpen, 
  Clock, 
  FileText, 
  Target, 
  TrendingUp,
  Users,
  Eye,
  Share2,
  Download,
  ExternalLink,
  Search,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';

interface ResultsDashboardProps {
  results: AnalysisResult;
}

export function ResultsDashboard({ results }: ResultsDashboardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const { seoScore, contentHealth, contentStructure, keywords, recommendations, metaTags, googlePreview } = results;

  const overviewCards = [
    {
      title: 'SEO Score',
      value: seoScore,
      isScore: true,
      icon: Target,
      description: 'Overall optimization score'
    },
    {
      title: 'Readability',
      value: contentHealth.readabilityScore,
      isScore: true,
      icon: BookOpen,
      description: 'Content readability score'
    },
    {
      title: 'Keywords Found',
      value: keywords.length,
      isScore: false,
      icon: FileText,
      description: 'Optimizable keywords'
    },
    {
      title: 'Reading Time',
      value: contentHealth.readingTime,
      isScore: false,
      icon: Clock,
      description: 'Minutes to read',
      suffix: 'min'
    }
  ];

  const optimizationStats = [
    { 
      label: 'Title Tag', 
      progress: metaTags.title.length > 30 && metaTags.title.length < 60 ? 85 : 60,
      status: metaTags.title.length > 30 && metaTags.title.length < 60 ? 'Good' : 'Needs Work'
    },
    { 
      label: 'Meta Description', 
      progress: metaTags.description.length > 120 && metaTags.description.length < 160 ? 85 : 60,
      status: metaTags.description.length > 120 && metaTags.description.length < 160 ? 'Good' : 'Needs Work'
    },
    { 
      label: 'Content Length', 
      progress: contentHealth.wordCount >= 300 ? 90 : contentHealth.wordCount >= 150 ? 70 : 40,
      status: contentHealth.wordCount >= 300 ? 'Excellent' : contentHealth.wordCount >= 150 ? 'Good' : 'Needs Work'
    },
    { 
      label: 'Content Structure', 
      progress: contentStructure.headings.h1 === 1 && contentStructure.headings.h2 >= 2 ? 85 : 60,
      status: contentStructure.headings.h1 === 1 && contentStructure.headings.h2 >= 2 ? 'Good' : 'Needs Work'
    }
  ];

  const generateReportHTML = () => {
    const reportDate = new Date().toLocaleDateString();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SEO Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; color: #3B82F6; }
        .section { margin: 30px 0; }
        .section h2 { color: #1F2937; border-left: 4px solid #3B82F6; padding-left: 15px; }
        .meta-tags { background: #F9FAFB; padding: 20px; border-radius: 8px; }
        .recommendations { list-style: none; padding: 0; }
        .recommendations li { background: #FEF7F0; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; }
        .keywords { display: flex; flex-wrap: wrap; gap: 10px; }
        .keyword-tag { background: #EBF8FF; color: #1E40AF; padding: 5px 12px; border-radius: 20px; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat-card { background: #F9FAFB; padding: 20px; border-radius: 8px; text-align: center; }
        .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; }
        .google-preview { background: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .google-title { color: #1a0dab; font-size: 18px; font-weight: normal; margin-bottom: 5px; }
        .google-url { color: #006621; font-size: 14px; margin-bottom: 5px; }
        .google-desc { color: #4d5156; font-size: 14px; line-height: 1.4; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SEO Analysis Report</h1>
        <div class="score">${seoScore}/100</div>
        <p>Report generated on ${reportDate}</p>
    </div>

    <div class="section">
        <h2>Google Search Preview</h2>
        <div class="google-preview">
            <div class="google-url">${googlePreview.url}</div>
            <div class="google-title">${googlePreview.title}</div>
            <div class="google-desc">${googlePreview.description}</div>
        </div>
        <p><strong>Title Status:</strong> ${googlePreview.titleTruncated ? 'Will be truncated' : 'Good length'} (${metaTags.title.length} characters)</p>
        <p><strong>Description Status:</strong> ${googlePreview.descriptionTruncated ? 'Will be truncated' : 'Good length'} (${metaTags.description.length} characters)</p>
    </div>

    <div class="section">
        <h2>Overview</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>SEO Score</h3>
                <div style="font-size: 24px; font-weight: bold; color: #3B82F6;">${seoScore}/100</div>
            </div>
            <div class="stat-card">
                <h3>Readability</h3>
                <div style="font-size: 24px; font-weight: bold; color: #10B981;">${contentHealth.readabilityScore.toFixed(1)}/100</div>
            </div>
            <div class="stat-card">
                <h3>Word Count</h3>
                <div style="font-size: 24px; font-weight: bold; color: #8B5CF6;">${contentHealth.wordCount}</div>
            </div>
            <div class="stat-card">
                <h3>Reading Time</h3>
                <div style="font-size: 24px; font-weight: bold; color: #F59E0B;">${contentHealth.readingTime} min</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Content Structure</h2>
        <p><strong>Headings:</strong> H1: ${contentStructure.headings.h1}, H2: ${contentStructure.headings.h2}, H3: ${contentStructure.headings.h3}</p>
        <p><strong>Paragraphs:</strong> ${contentStructure.paragraphs.total} total, ${contentStructure.paragraphs.averageLength} words average</p>
        <p><strong>Readability Grade:</strong> ${contentStructure.readability.grade} (${contentStructure.readability.complexity})</p>
        ${contentStructure.headings.issues.length > 0 ? `<p><strong>Issues:</strong> ${contentStructure.headings.issues.join(', ')}</p>` : ''}
    </div>

    <div class="section">
        <h2>Meta Tags</h2>
        <div class="meta-tags">
            <p><strong>Title:</strong> ${metaTags.title}</p>
            <p><strong>Description:</strong> ${metaTags.description}</p>
            <p><strong>Keywords:</strong> ${Array.isArray(metaTags.keywords) ? metaTags.keywords.join(', ') : metaTags.keywords}</p>
        </div>
    </div>

    <div class="section">
        <h2>Top Keywords</h2>
        <div class="keywords">
            ${keywords.slice(0, 10).map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
        </div>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ul class="recommendations">
            ${recommendations.map(rec => `
                <li>
                    <strong>${rec.title}</strong><br>
                    ${rec.description}
                    ${rec.fixSuggestion ? `<br><em>Fix: ${rec.fixSuggestion}</em>` : ''}
                    <div style="margin-top: 10px;">
                        <span style="background: ${rec.impact === 'High' ? '#FEE2E2; color: #DC2626' : rec.impact === 'Medium' ? '#FEF3C7; color: #D97706' : '#DCFCE7; color: #16A34A'}; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                            ${rec.impact} Impact
                        </span>
                        <span style="background: ${rec.effort === 'Quick Fix' ? '#DCFCE7; color: #16A34A' : rec.effort === 'Moderate' ? '#FEF3C7; color: #D97706' : '#FEE2E2; color: #DC2626'}; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">
                            ${rec.effort} Effort
                        </span>
                        <span style="background: #E5E7EB; color: #374151; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">
                            ${rec.category}
                        </span>
                    </div>
                </li>
            `).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>Content Analysis</h2>
        <p><strong>Sentiment:</strong> ${results.sentiment}</p>
        <p><strong>Content Health:</strong> ${contentHealth.health}</p>
        <p><strong>Word Count:</strong> ${contentHealth.wordCount} words</p>
        <p><strong>Reading Time:</strong> ${contentHealth.readingTime} minutes</p>
    </div>

    <div class="footer">
        <p>This report was generated by Adaptify SEO - AI-Powered Content Analysis</p>
        <p>For more detailed analysis and recommendations, visit our platform.</p>
    </div>
</body>
</html>`;
  };

  const handlePreview = () => {
    const reportHTML = generateReportHTML();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(reportHTML);
      newWindow.document.close();
    }
  };

  const handleExportPDF = () => {
    try {
      // Create HTML content
      const reportHTML = generateReportHTML();
      
      // Create a temporary iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '8.5in';
      iframe.style.height = '11in';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(reportHTML);
        iframeDoc.close();
        
        // Wait for content to load then print
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 100);
        }, 500);
      }
    } catch (error) {
      console.error('Export failed:', error);
      
      // Fallback: download as HTML file
      const reportHTML = generateReportHTML();
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-analysis-report-${new Date().getTime()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleShareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: 'SEO Analysis Results',
        text: `Check out my SEO analysis results: ${seoScore}/100 SEO Score, ${contentHealth.readabilityScore.toFixed(1)} Readability Score`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const shareText = `SEO Analysis Results:\n• SEO Score: ${seoScore}/100\n• Readability: ${contentHealth.readabilityScore.toFixed(1)}/100\n• Keywords Found: ${keywords.length}\n• Reading Time: ${contentHealth.readingTime} minutes`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Analysis summary copied to clipboard!');
      }).catch(() => {
        alert('Sharing not supported on this device');
      });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-12 space-y-8 animate-fade-in">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => (
          <Card key={card.title} className="glass-card hover-lift animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <card.icon className="h-8 w-8 text-primary" />
                {card.isScore && (
                  <CircularProgress 
                    value={card.value} 
                    size={60}
                    strokeWidth={6}
                    color={card.value >= 80 ? 'success' : card.value >= 60 ? 'warning' : 'destructive'}
                  />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">{card.title}</h3>
                {!card.isScore && (
                  <p className="text-2xl font-bold text-primary">
                    {card.value}{card.suffix && <span className="text-sm text-muted-foreground ml-1">{card.suffix}</span>}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Optimization Status */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Optimization Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {optimizationStats.map((stat, index) => (
            <div key={stat.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{stat.label}</span>
                <Badge 
                  variant={stat.progress >= 80 ? 'default' : stat.progress >= 60 ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {stat.status}
                </Badge>
              </div>
              <Progress value={stat.progress} className="h-2 animate-progress" style={{ animationDelay: `${index * 0.2}s` }} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Google Preview */}
      <GooglePreviewPanel preview={googlePreview} />

      {/* Analysis Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <KeywordsPanel keywords={keywords} />
          <MetaTagsPanel metaTags={metaTags} />
          <ContentStructurePanel structure={contentStructure} />
        </div>
        <div className="space-y-8">
          <RecommendationsPanel recommendations={recommendations} />
        </div>
      </div>

      {/* Export Actions */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Share Your Analysis</p>
                <p className="text-sm text-muted-foreground">Export or share these insights</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleShareResults}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" /> Share Results
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePreview}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" /> Preview Report
              </Button>
              <Button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-primary-foreground hover-lift"
              >
                <Download className="h-4 w-4" /> Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}