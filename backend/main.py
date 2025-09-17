from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import nltk
from collections import Counter
import textstat
from textblob import TextBlob
import uvicorn
from typing import Literal, List, Dict, Any

# Download required NLTK data
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

try:
    nltk.data.find("corpora/stopwords")
except LookupError:
    nltk.download("stopwords")

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

app = FastAPI(title="SEO Analysis API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisRequest(BaseModel):
    text: str


class Recommendation(BaseModel):
    id: int
    title: str
    description: str
    impact: Literal["High", "Medium", "Low"]
    effort: Literal["Quick Fix", "Moderate", "Complex"]
    category: Literal["Content", "Technical", "Keywords", "Links"]
    priority: int
    actionable: bool = True
    fixSuggestion: str = ""


class MetaTags(BaseModel):
    title: str
    description: str
    keywords: List[str]


class ContentHealth(BaseModel):
    readabilityScore: float
    readingTime: int
    wordCount: int
    health: str


class ContentStructure(BaseModel):
    headings: Dict[str, Any]
    paragraphs: Dict[str, Any]
    readability: Dict[str, Any]
    linkingSuggestions: List[str]


class GooglePreview(BaseModel):
    title: str
    url: str
    description: str
    titleTruncated: bool
    descriptionTruncated: bool


class AnalysisResult(BaseModel):
    seoScore: int
    contentHealth: ContentHealth
    contentStructure: ContentStructure
    recommendations: List[Recommendation]
    metaTags: MetaTags
    googlePreview: GooglePreview
    sentiment: Literal["Positive", "Neutral", "Negative"]
    keywords: List[str]
    rawText: str


class SEOAnalyzer:
    def __init__(self):
        self.stop_words = set(stopwords.words("english"))

    def extract_title(self, text: str) -> str:
        """Extract or generate a title from the text"""
        lines = text.strip().split("\n")
        for line in lines[:3]:
            line = line.strip()
            if line and len(line) < 100 and not line.endswith("."):
                return line

        sentences = sent_tokenize(text)
        if sentences:
            first_sentence = sentences[0]
            if len(first_sentence) <= 60:
                return first_sentence.rstrip(".")
            else:
                return first_sentence[:60] + "..."

        return text[:60] + "..." if len(text) > 60 else text

    def generate_meta_description(self, text: str) -> str:
        """Generate a meta description from the text"""
        sentences = sent_tokenize(text)
        description = ""

        for sentence in sentences:
            if len(description + sentence) <= 160:
                description += sentence + " "
            else:
                break

        return description.strip() or text[:160] + "..."

    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract important keywords from the text"""
        text_lower = text.lower()
        cleaned_text = re.sub(r"[^\w\s]", " ", text_lower)
        tokens = word_tokenize(cleaned_text)

        filtered_words = [
            word
            for word in tokens
            if word not in self.stop_words and len(word) > 3 and word.isalpha()
        ]

        word_freq = Counter(filtered_words)
        keywords = [word for word, freq in word_freq.most_common(max_keywords)]

        return keywords

    def calculate_readability(self, text: str) -> float:
        """Calculate readability score using multiple metrics"""
        try:
            flesch_score = textstat.flesch_reading_ease(text)
            normalized_score = max(0, min(100, flesch_score))
            return round(normalized_score, 1)
        except:
            sentences = sent_tokenize(text)
            words = word_tokenize(text)

            if not sentences or not words:
                return 50.0

            avg_sentence_length = len(words) / len(sentences)
            avg_word_length = sum(len(word) for word in words) / len(words)

            score = 100 - (avg_sentence_length * 1.5) - (avg_word_length * 2)
            return max(0, min(100, round(score, 1)))

    def analyze_sentiment(
        self, text: str
    ) -> Literal["Positive", "Neutral", "Negative"]:
        """Analyze sentiment of the text"""
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity

            if polarity > 0.1:
                return "Positive"
            elif polarity < -0.1:
                return "Negative"
            else:
                return "Neutral"
        except:
            return "Neutral"

    def count_words(self, text: str) -> int:
        """Count words in the text"""
        words = word_tokenize(text)
        return len([word for word in words if word.isalpha()])

    def calculate_reading_time(self, word_count: int) -> int:
        """Calculate reading time based on average reading speed (200 words per minute)"""
        return max(1, round(word_count / 200))

    def generate_summary(self, text: str, max_length: int = 200) -> str:
        """Generate a summary of the text"""
        sentences = sent_tokenize(text)
        if not sentences:
            return text[:max_length] + "..." if len(text) > max_length else text

        summary = ""
        for sentence in sentences:
            if len(summary + sentence) <= max_length:
                summary += sentence + " "
            else:
                break

        return summary.strip() or text[:max_length] + "..."

    def analyze_content_structure(self, text: str) -> ContentStructure:
        """Analyze content structure including headings, paragraphs, etc."""

        # Simple heading detection for plain text
        lines = text.split("\n")
        headings = {"h1": 0, "h2": 0, "h3": 0, "h4": 0, "issues": []}

        # Look for potential headings (short lines, title case, etc.)
        for line in lines:
            line = line.strip()
            if line and len(line) < 100 and not line.endswith("."):
                if line.isupper():
                    headings["h1"] += 1
                elif line.title() == line:
                    headings["h2"] += 1

        # Add issues if no headings found
        if headings["h1"] == 0 and headings["h2"] == 0:
            headings["issues"].append(
                "No clear headings found - consider adding structure"
            )
        if headings["h1"] > 1:
            headings["issues"].append("Multiple H1-level headings detected")

        # Analyze paragraphs
        paragraphs_text = [
            p.strip()
            for p in re.split(r"\n\s*\n", text)
            if p.strip() and len(p.strip()) > 20
        ]
        word_counts = [len(word_tokenize(p)) for p in paragraphs_text]
        avg_paragraph_length = sum(word_counts) / len(word_counts) if word_counts else 0
        long_paragraphs = len([wc for wc in word_counts if wc > 150])

        paragraphs_analysis = {
            "total": len(paragraphs_text),
            "averageLength": round(avg_paragraph_length, 1),
            "longParagraphs": long_paragraphs,
        }

        # Readability analysis
        readability_score = self.calculate_readability(text)

        def get_reading_grade(flesch_score: float) -> str:
            if flesch_score >= 90:
                return "5th grade"
            elif flesch_score >= 80:
                return "6th grade"
            elif flesch_score >= 70:
                return "7th grade"
            elif flesch_score >= 60:
                return "8th-9th grade"
            elif flesch_score >= 50:
                return "10th-12th grade"
            elif flesch_score >= 30:
                return "College level"
            else:
                return "Graduate level"

        def get_complexity_level(flesch_score: float) -> str:
            if flesch_score >= 70:
                return "Easy"
            elif flesch_score >= 30:
                return "Medium"
            else:
                return "Hard"

        readability_analysis = {
            "fleschScore": readability_score,
            "grade": get_reading_grade(readability_score),
            "complexity": get_complexity_level(readability_score),
        }

        # Generate linking suggestions
        keywords = self.extract_keywords(text, max_keywords=20)
        linking_suggestions = []

        if any(keyword in ["guide", "tutorial", "how"] for keyword in keywords):
            linking_suggestions.append(
                "Link to related tutorials or guides on your website"
            )
        if any(keyword in ["product", "service", "solution"] for keyword in keywords):
            linking_suggestions.append("Add links to relevant product or service pages")
        if any(keyword in ["research", "study", "data"] for keyword in keywords):
            linking_suggestions.append("Link to supporting research or case studies")

        if not linking_suggestions:
            linking_suggestions = [
                "Add links to related articles on your website",
                "Include links to your main category pages",
                "Link to your contact or about page where relevant",
            ]

        return ContentStructure(
            headings=headings,
            paragraphs=paragraphs_analysis,
            readability=readability_analysis,
            linkingSuggestions=linking_suggestions[:4],
        )

    def create_google_preview(self, title: str, description: str) -> GooglePreview:
        """Create Google search result preview"""
        base_url = "yoursite.com"

        title_truncated = len(title) > 60
        description_truncated = len(description) > 160

        display_title = title[:57] + "..." if title_truncated else title
        display_description = (
            description[:157] + "..." if description_truncated else description
        )

        return GooglePreview(
            title=display_title,
            url=base_url,
            description=display_description,
            titleTruncated=title_truncated,
            descriptionTruncated=description_truncated,
        )

    def calculate_seo_score(
        self,
        readability: float,
        word_count: int,
        keywords: List[str],
        title: str,
        description: str,
    ) -> int:
        """Calculate overall SEO score based on various factors"""
        score = 0

        # Readability contribution (25% of score)
        if readability >= 70:
            score += 25
        elif readability >= 50:
            score += 20
        elif readability >= 30:
            score += 15
        else:
            score += 10

        # Word count contribution (25% of score)
        if word_count >= 600:
            score += 25
        elif word_count >= 300:
            score += 20
        elif word_count >= 150:
            score += 15
        else:
            score += 5

        # Keywords contribution (25% of score)
        if len(keywords) >= 8:
            score += 25
        elif len(keywords) >= 5:
            score += 20
        elif len(keywords) >= 3:
            score += 15
        else:
            score += 5

        # Title and description contribution (25% of score)
        title_score = 0
        desc_score = 0

        if 30 <= len(title) <= 60:
            title_score = 15
        elif 20 <= len(title) <= 80:
            title_score = 10
        else:
            title_score = 5

        if 120 <= len(description) <= 160:
            desc_score = 10
        elif 100 <= len(description) <= 180:
            desc_score = 7
        else:
            desc_score = 3

        score += title_score + desc_score

        return min(100, max(0, int(score)))

    def determine_content_health(
        self, readability: float, word_count: int, keywords: List[str]
    ) -> str:
        """Determine overall content health"""
        if readability >= 70 and word_count >= 300 and len(keywords) >= 5:
            return "Excellent"
        elif readability >= 50 and word_count >= 200 and len(keywords) >= 3:
            return "Good"
        elif readability >= 30 and word_count >= 100:
            return "Fair"
        else:
            return "Needs Improvement"

    def generate_recommendations(
        self,
        keywords: List[str],
        word_count: int,
        readability: float,
        title: str,
        description: str,
        content_structure: ContentStructure,
    ) -> List[Recommendation]:
        """Generate comprehensive SEO recommendations with actionable fixes"""
        recommendations = []
        rec_id = 1

        # Title optimization
        if len(title) < 30:
            recommendations.append(
                Recommendation(
                    id=rec_id,
                    title="Optimize Title Length",
                    description="Your title is too short. Expand it to 30-60 characters to include more relevant keywords and improve search visibility.",
                    impact="High",
                    effort="Quick Fix",
                    category="Technical",
                    priority=1,
                    actionable=True,
                    fixSuggestion=f"Expand your current title '{title}' by adding descriptive keywords or your brand name to reach 30-60 characters.",
                )
            )
            rec_id += 1
        elif len(title) > 60:
            recommendations.append(
                Recommendation(
                    id=rec_id,
                    title="Shorten Title Tag",
                    description="Your title is too long and may be truncated in search results. Keep it between 30-60 characters for optimal display.",
                    impact="High",
                    effort="Quick Fix",
                    category="Technical",
                    priority=1,
                    actionable=True,
                    fixSuggestion=f"Shorten your title to approximately: '{title[:50]}...'",
                )
            )
            rec_id += 1

        # Primary keyword optimization
        if keywords:
            primary_keyword = keywords[0]
            recommendations.append(
                Recommendation(
                    id=rec_id,
                    title=f"Optimize for '{primary_keyword}'",
                    description=f"Ensure your primary keyword '{primary_keyword}' appears in your title, first paragraph, and naturally throughout the content.",
                    impact="High",
                    effort="Quick Fix",
                    category="Keywords",
                    priority=1,
                    actionable=True,
                    fixSuggestion=f"1. Include '{primary_keyword}' in your title\n2. Mention '{primary_keyword}' in the first paragraph\n3. Use it in 2-3 subheadings\n4. Include variations throughout content",
                )
            )
            rec_id += 1

        # Content length recommendations
        if word_count < 300:
            recommendations.append(
                Recommendation(
                    id=rec_id,
                    title="Increase Content Length",
                    description="Add more valuable content to reach at least 300 words. Longer content typically ranks better and provides more value to readers.",
                    impact="High",
                    effort="Moderate",
                    category="Content",
                    priority=1,
                    actionable=True,
                    fixSuggestion="Add sections covering: examples, benefits, step-by-step instructions, FAQs, or related tips to expand your content meaningfully.",
                )
            )
            rec_id += 1

        # Readability improvements
        if readability < 50:
            recommendations.append(
                Recommendation(
                    id=rec_id,
                    title="Enhance Content Clarity",
                    description="Break up long sentences and use more common words to make your content easier to read and understand.",
                    impact="Medium",
                    effort="Quick Fix",
                    category="Content",
                    priority=3,
                    actionable=True,
                    fixSuggestion="1. Split sentences longer than 20 words\n2. Replace complex words with simpler alternatives\n3. Add bullet points for lists\n4. Keep paragraphs to 3-4 sentences max",
                )
            )
            rec_id += 1

        return recommendations[:8]

    def analyze(self, text: str) -> AnalysisResult:
        """Perform complete SEO analysis"""
        title = self.extract_title(text)
        meta_description = self.generate_meta_description(text)
        keywords = self.extract_keywords(text)
        readability_score = self.calculate_readability(text)
        word_count = self.count_words(text)
        reading_time = self.calculate_reading_time(word_count)
        sentiment = self.analyze_sentiment(text)
        summary = self.generate_summary(text)

        # Analyze content structure
        content_structure = self.analyze_content_structure(text)

        # Create Google preview
        google_preview = self.create_google_preview(title, meta_description)

        # Calculate SEO score
        seo_score = self.calculate_seo_score(
            readability_score, word_count, keywords, title, meta_description
        )

        # Determine content health
        health_status = self.determine_content_health(
            readability_score, word_count, keywords
        )

        # Generate comprehensive recommendations
        recommendations = self.generate_recommendations(
            keywords,
            word_count,
            readability_score,
            title,
            meta_description,
            content_structure,
        )

        # Create structured response
        content_health = ContentHealth(
            readabilityScore=readability_score,
            readingTime=reading_time,
            wordCount=word_count,
            health=health_status,
        )

        meta_tags = MetaTags(
            title=title,
            description=meta_description,
            keywords=keywords[:10],
        )

        return AnalysisResult(
            seoScore=seo_score,
            contentHealth=content_health,
            contentStructure=content_structure,
            recommendations=recommendations,
            metaTags=meta_tags,
            googlePreview=google_preview,
            sentiment=sentiment,
            keywords=keywords,
            rawText=summary,
        )


# Initialize analyzer
analyzer = SEOAnalyzer()


@app.get("/")
async def root():
    return {"message": "SEO Analysis API is running"}


@app.post("/analyze", response_model=AnalysisResult)
async def analyze_content(request: AnalysisRequest):
    """Analyze content for SEO insights"""
    if not request.text.strip():
        # Return empty analysis with proper structure
        empty_structure = ContentStructure(
            headings={
                "h1": 0,
                "h2": 0,
                "h3": 0,
                "h4": 0,
                "issues": ["No content provided"],
            },
            paragraphs={"total": 0, "averageLength": 0, "longParagraphs": 0},
            readability={"fleschScore": 0, "grade": "N/A", "complexity": "Medium"},
            linkingSuggestions=["Add content to analyze"],
        )

        return AnalysisResult(
            seoScore=0,
            contentHealth=ContentHealth(
                readabilityScore=0.0,
                readingTime=0,
                wordCount=0,
                health="Needs Improvement",
            ),
            contentStructure=empty_structure,
            recommendations=[
                Recommendation(
                    id=1,
                    title="Add Content to Analyze",
                    description="Please provide content to analyze for SEO optimization opportunities.",
                    impact="High",
                    effort="Quick Fix",
                    category="Content",
                    priority=1,
                    actionable=True,
                    fixSuggestion="Paste your content into the text area and click analyze again.",
                )
            ],
            metaTags=MetaTags(
                title="No Content",
                description="No content provided for analysis",
                keywords=[],
            ),
            googlePreview=GooglePreview(
                title="No Content",
                url="yoursite.com",
                description="No content provided for analysis",
                titleTruncated=False,
                descriptionTruncated=False,
            ),
            sentiment="Neutral",
            keywords=[],
            rawText="No content to analyze",
        )

    try:
        result = analyzer.analyze(request.text)
        return result
    except Exception as e:
        print(f"Analysis error: {e}")

        # Return error response with proper structure
        error_structure = ContentStructure(
            headings={
                "h1": 0,
                "h2": 0,
                "h3": 0,
                "h4": 0,
                "issues": ["Analysis error occurred"],
            },
            paragraphs={"total": 0, "averageLength": 0, "longParagraphs": 0},
            readability={"fleschScore": 50, "grade": "Error", "complexity": "Medium"},
            linkingSuggestions=["Try analyzing different content"],
        )

        return AnalysisResult(
            seoScore=50,
            contentHealth=ContentHealth(
                readabilityScore=50.0, readingTime=1, wordCount=0, health="Error"
            ),
            contentStructure=error_structure,
            recommendations=[
                Recommendation(
                    id=1,
                    title="Analysis Error",
                    description="An error occurred during analysis. Please try again with different content.",
                    impact="High",
                    effort="Quick Fix",
                    category="Technical",
                    priority=1,
                    actionable=True,
                    fixSuggestion="Try with shorter content or check for special characters that might cause issues.",
                )
            ],
            metaTags=MetaTags(
                title="Analysis Error",
                description="Error occurred during analysis",
                keywords=[],
            ),
            googlePreview=GooglePreview(
                title="Analysis Error",
                url="yoursite.com",
                description="Error occurred during analysis",
                titleTruncated=False,
                descriptionTruncated=False,
            ),
            sentiment="Neutral",
            keywords=[],
            rawText=(
                request.text[:200] + "..." if len(request.text) > 200 else request.text
            ),
        )


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
