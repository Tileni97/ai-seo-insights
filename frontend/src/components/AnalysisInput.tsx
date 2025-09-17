import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, Upload, Wand2 } from 'lucide-react';

interface AnalysisInputProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

export function AnalysisInput({ onAnalyze, isAnalyzing }: AnalysisInputProps) {
  const [content, setContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;

  const examples = [
    {
      label: "Blog Post",
      text: `The Ultimate Guide to Sustainable Living in 2025

Living sustainably has become more important than ever as we face climate change challenges. This comprehensive guide will help you transform your lifestyle while saving money and protecting the environment.

What is Sustainable Living?

Sustainable living means adopting practices that reduce your environmental footprint. It involves making conscious choices about consumption, energy use, and waste production. By implementing sustainable practices, you can contribute to a healthier planet while often improving your quality of life.

Key Areas of Sustainable Living

Energy Efficiency: Switch to LED bulbs, use programmable thermostats, and consider renewable energy sources like solar panels. These changes can reduce your energy bills by up to 30%.

Sustainable Transportation: Walk, bike, use public transport, or consider electric vehicles. Transportation accounts for nearly 30% of greenhouse gas emissions, making this a crucial area for improvement.

Waste Reduction: Practice the 3 R's - Reduce, Reuse, Recycle. Compost organic waste, buy products with minimal packaging, and repair items instead of replacing them.`
    },
    {
      label: "Product Description",
      text: `Premium Wireless Bluetooth Headphones - Studio Quality Sound

Experience crystal-clear audio with our flagship wireless headphones designed for music enthusiasts and professionals.

Key Features:
• Active noise cancellation technology blocks up to 95% of ambient noise
• 30-hour battery life with quick charge feature (5 minutes = 3 hours playback)
• Premium leather comfort padding for all-day wear
• Advanced Bluetooth 5.0 connectivity with multipoint pairing
• Studio-grade 40mm drivers deliver rich, detailed sound
• Built-in microphone with noise reduction for clear calls

Perfect for commuting, working from home, traveling, or enjoying your favorite music. Compatible with all Bluetooth-enabled devices including smartphones, tablets, and computers.

What's Included:
- Premium wireless headphones
- USB-C charging cable
- 3.5mm audio cable
- Carrying case
- User manual

30-day money-back guarantee and 2-year warranty included.`
    },
    {
      label: "Landing Page Copy",
      text: `Transform Your Business with AI-Powered Analytics

Unlock the power of artificial intelligence to drive growth and make data-driven decisions that propel your business forward.

Why Choose Our AI Analytics Platform?

Real-Time Insights: Get instant access to critical business metrics and trends. Our advanced algorithms process data 24/7 to deliver actionable insights when you need them most.

Predictive Analytics: Forecast future trends and customer behavior with 94% accuracy. Stay ahead of market changes and make proactive business decisions.

Easy Integration: Seamlessly connect with your existing tools and platforms. Our API works with over 100 popular business applications.

Trusted by Over 10,000+ Businesses Worldwide

Key Benefits:
✓ Increase revenue by identifying high-value opportunities
✓ Reduce costs through automated optimization
✓ Improve customer satisfaction with personalized experiences
✓ Scale your business with data-driven strategies

Start Your Free Trial Today - No credit card required.`
    }
  ];

  const handleFileUpload = async (file: File) => {
    setUploadError('');
    
    if (!file) return;
    
    // Check file type
    const allowedTypes = ['.txt', '.md', '.rtf'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setUploadError('Please upload a .txt, .md, or .rtf file');
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }
    
    try {
      const text = await file.text();
      setContent(text);
    } catch (error) {
      setUploadError('Failed to read file. Please try again.');
      console.error('File reading error:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleExampleClick = (exampleText: string) => {
    setContent(exampleText);
  };

  const handleAnalyze = () => {
    if (content.trim()) {
      onAnalyze(content.trim());
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="space-y-6">
        {/* Main Input Card */}
        <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6 space-y-6">
            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${
                isDragging ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                Upload a file or paste your content
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop a .txt, .md, or .rtf file here, or click to browse
              </p>
              <input
                type="file"
                accept=".txt,.md,.rtf"
                onChange={handleFileInputChange}
                disabled={isAnalyzing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Upload text file for analysis"
                title="Upload a .txt, .md, or .rtf file"
              />
              <Button variant="outline" className="pointer-events-none">
                <FileText className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              {uploadError && (
                <p className="text-red-500 text-sm mt-2">{uploadError}</p>
              )}
            </div>

            {/* Text Input Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="content-input" 
                  className="text-sm font-medium text-gray-900"
                >
                  Content to Analyze
                </label>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{charCount} characters</span>
                  <span>{wordCount} words</span>
                </div>
              </div>
              
              <Textarea
                id="content-input"
                placeholder="Paste your blog post, product description, landing page content, or any text you want to optimize for SEO..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                disabled={isAnalyzing}
              />
            </div>

            {/* Quick Examples */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900">Quick Examples:</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <Button
                    key={example.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(example.text)}
                    disabled={isAnalyzing}
                    className="hover:bg-blue-50 hover:border-blue-400 transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {example.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!content.trim() || isAnalyzing}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Keyword Analysis", desc: "Discover high-impact keywords" },
            { label: "Meta Tag Generation", desc: "SEO-optimized titles & descriptions" },
            { label: "Content Recommendations", desc: "AI-powered optimization tips" }
          ].map((feature, index) => (
            <div 
              key={feature.label}
              className="text-center p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 opacity-0 animate-fade-in"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <Badge 
                variant="secondary" 
                className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                {feature.label}
              </Badge>
              <p className="text-sm text-gray-600">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Inline styles for animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
        `
      }} />
    </section>
  );
}