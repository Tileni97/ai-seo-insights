import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BarChart3, Clock, Target, Zap } from 'lucide-react';

export function HeroSection() {
  const stats = [
    {
      icon: BarChart3,
      label: "1000+ analyses completed",
      value: "1000+"
    },
    {
      icon: Target,
      label: "99.2% accuracy rate",
      value: "99.2%"
    },
    {
      icon: Clock,
      label: "< 3s response time",
      value: "< 3s"
    },
    {
      icon: Zap,
      label: "AI-powered insights",
      value: "AI"
    }
  ];

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-background via-background to-surface border-b border-border/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5"></div>
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="flex justify-center">
            <Badge 
              variant="outline" 
              className="glass-surface px-4 py-2 text-sm font-medium border-primary/20 text-primary hover-lift"
            >
              Demo SEO Application
            </Badge>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-gradient animate-gradient">
                AI SEO Insights
              </span>
              <br />
              <span className="text-foreground">
                Generator
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Professional SEO Analysis Powered by AI
              <span className="hidden sm:inline"> • Built with FastAPI + React + Hugging Face</span>
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="glass-card p-4 rounded-lg hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">{stat.value}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}