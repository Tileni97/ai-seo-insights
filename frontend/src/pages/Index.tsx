import { ThemeProvider } from '@/contexts/ThemeContext';
import { SEOAnalysisApp } from '@/components/SEOAnalysisApp';

const Index = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="seo-insights-theme">
      <SEOAnalysisApp />
    </ThemeProvider>
  );
};

export default Index;
