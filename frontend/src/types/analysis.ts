// types/analysis.ts

export interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'Quick Fix' | 'Moderate' | 'Complex';
  category: 'Content' | 'Technical' | 'Keywords' | 'Links';
  priority: number; // 1-5
  actionable?: boolean; // Whether this can be auto-fixed
  fixSuggestion?: string; // Specific text to use for fixes
}

export interface MetaTags {
  title: string;
  description: string;
  keywords: string[];
}

export interface ContentHealth {
  readabilityScore: number; // 0-100
  readingTime: number; // minutes
  wordCount: number;
  health: string; // e.g., "Good", "Poor"
}

export interface ContentStructure {
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    issues: string[];
  };
  paragraphs: {
    total: number;
    averageLength: number;
    longParagraphs: number; // paragraphs > 150 words
  };
  readability: {
    fleschScore: number;
    grade: string;
    complexity: 'Easy' | 'Medium' | 'Hard';
  };
  linkingSuggestions: string[];
}

export interface GooglePreview {
  title: string;
  url: string;
  description: string;
  titleTruncated: boolean;
  descriptionTruncated: boolean;
}

export interface AnalysisResult {
  seoScore: number;
  contentHealth: ContentHealth;
  contentStructure: ContentStructure;
  recommendations: Recommendation[];
  metaTags: MetaTags;
  googlePreview: GooglePreview;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  keywords: string[];
  rawText: string;
}