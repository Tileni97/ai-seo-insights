import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Brain, Search, Target } from 'lucide-react';

export function AnalysisLoadingState() {
  const steps = [
    { icon: Brain, text: "AI is analyzing your content...", delay: 0 },
    { icon: Search, text: "Extracting keywords and topics...", delay: 600 },
    { icon: Target, text: "Generating optimization recommendations...", delay: 1200 },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Processing Status */}
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="animate-pulse">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Processing Your Content
          </h2>
          <p className="text-muted-foreground">
            Our AI is performing comprehensive SEO analysis...
          </p>
        </div>

        {/* Processing Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center justify-center space-x-3 opacity-0 animate-fade-in"
              style={{ animationDelay: `${step.delay}ms` }}
            >
              <step.icon className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Skeleton */}
      <Card className="glass-card animate-pulse">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Analysis Panels Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="glass-card animate-pulse">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-8">
          <Card className="glass-card animate-pulse">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border-l-4 border-l-muted rounded-lg">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}