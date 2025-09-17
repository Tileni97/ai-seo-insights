import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { AnalysisResult } from "@/types/analysis";
import { AnalysisInput } from "@/components/AnalysisInput";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { AnalysisLoadingState } from "@/components/AnalysisLoadingState";

export function SEOAnalysisApp() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async (text: string) => {
    setIsAnalyzing(true);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("API request failed");

      const result: AnalysisResult = await res.json();

      // ✅ Ensure contentStructure exists
      if (!result.contentStructure) {
        result.contentStructure = {
          headings: { h1: 0, h2: 0, h3: 0, h4: 0, issues: ["Structure analysis unavailable"] },
          paragraphs: { total: 0, averageLength: 0, longParagraphs: 0 },
          readability: { fleschScore: 50, grade: "Unknown", complexity: "Medium" },
          linkingSuggestions: ["Add relevant internal links"],
        };
      }

      // ✅ Ensure googlePreview exists
      if (!result.googlePreview) {
        result.googlePreview = {
          title: result.metaTags.title || "Your Page Title",
          url: "yoursite.com",
          description: result.metaTags.description || "Your page description",
          titleTruncated: (result.metaTags.title?.length || 0) > 60,
          descriptionTruncated: (result.metaTags.description?.length || 0) > 160,
        };
      }

      // ✅ Normalize recommendations
      result.recommendations = result.recommendations.map((rec) => ({
        ...rec,
        actionable: rec.actionable ?? (rec.effort === "Quick Fix"),
        fixSuggestion: rec.fixSuggestion || "Follow the description for implementation steps",
      }));

      setAnalysisResult(result);
    } catch (err) {
      console.error("Error fetching analysis:", err);

      // 🚨 Fallback error result
      const errorResult: AnalysisResult = {
        seoScore: 0,
        contentHealth: {
          readabilityScore: 0,
          wordCount: text.split(/\s+/).filter((word) => word.trim().length > 0).length,
          readingTime: Math.ceil(
            text.split(/\s+/).filter((word) => word.trim().length > 0).length / 200
          ),
          health: "Error",
        },
        contentStructure: {
          headings: { h1: 0, h2: 0, h3: 0, h4: 0, issues: ["Analysis failed"] },
          paragraphs: { total: 0, averageLength: 0, longParagraphs: 0 },
          readability: { fleschScore: 0, grade: "Error", complexity: "Medium" },
          linkingSuggestions: ["Fix connection issues first"],
        },
        recommendations: [
          {
            id: 1,
            title: "Connection Error",
            description:
              "Unable to connect to analysis server. Please check if the backend server is running on the configured API URL.",
            impact: "High",
            effort: "Quick Fix",
            category: "Technical",
            priority: 1,
            actionable: true,
            fixSuggestion:
              "1. Check if Python backend is running\n2. Verify the server is on port 8000\n3. Check your network connection",
          },
        ],
        metaTags: {
          title: "Analysis Error",
          description: "Unable to analyze content at this time",
          keywords: [],
        },
        googlePreview: {
          title: "Analysis Error",
          url: "yoursite.com",
          description: "Unable to analyze content at this time",
          titleTruncated: false,
          descriptionTruncated: false,
        },
        sentiment: "Neutral",
        keywords: [],
        rawText: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
      };

      setAnalysisResult(errorResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface">
      <HeroSection />

      {!analysisResult && !isAnalyzing && (
        <AnalysisInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      )}

      {isAnalyzing && <AnalysisLoadingState />}

      {analysisResult && (
        <div className="space-y-8">
          <ResultsDashboard results={analysisResult} />

          <section className="max-w-4xl mx-auto px-6 pb-12 text-center">
            <button
              onClick={handleNewAnalysis}
              className="px-8 py-3 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-lg font-semibold hover:from-primary-dark hover:to-purple-700 transition-all hover-lift"
            >
              Analyze New Content
            </button>
          </section>
        </div>
      )}

      <footer className="border-t border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Built with cutting-edge technology
            </div>
            <div className="flex items-center gap-2">
              {["React", "TypeScript", "FastAPI", "AI/ML"].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Demo for <span className="font-semibold text-primary">Adaptify SEO</span> Application
          </div>
        </div>
      </footer>
    </div>
  );
}
