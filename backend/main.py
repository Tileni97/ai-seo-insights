from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import nltk
from collections import Counter
import textstat
from textblob import TextBlob
import uvicorn
import os
import requests
import json
from typing import Literal, List, Dict, Any
from dotenv import load_dotenv
import time
from pathlib import Path

# Load environment variables
load_dotenv()

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

# Hugging Face configuration - Load from environment
HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL = os.getenv("HF_MODEL", "distilbert-base-uncased")
HF_API_URL = "https://api-inference.huggingface.co/models/"

# Validate API key
if not HF_API_KEY:
    print("Warning: HF_API_KEY not found in environment variables")
    print("AI features will be disabled")


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


class HuggingFaceClient:
    """Client for interacting with Hugging Face API"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
        self.enabled = bool(api_key)

    def query_model(self, model_name: str, payload: dict, max_retries: int = 3) -> dict:
        """Query a Hugging Face model with retry logic"""
        if not self.enabled:
            print("HuggingFace API key not available, skipping AI analysis")
            return None

        url = f"{HF_API_URL}{model_name}"

        for attempt in range(max_retries):
            try:
                response = requests.post(
                    url, headers=self.headers, json=payload, timeout=30
                )

                if response.status_code == 200:
                    result = response.json()
                    return result
                elif response.status_code == 503:
                    # Model is loading, wait and retry
                    wait_time = 2**attempt
                    print(f"Model loading, waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                elif response.status_code == 401:
                    print("HuggingFace API authentication failed - check your API key")
                    self.enabled = False
                    return None
                elif response.status_code == 429:
                    print("Rate limit exceeded, waiting before retry...")
                    time.sleep(5)
                    continue
                else:
                    print(f"HF API error: {response.status_code} - {response.text}")
                    return None

            except requests.exceptions.Timeout:
                print(f"Request timeout (attempt {attempt + 1}/{max_retries})")
                if attempt == max_retries - 1:
                    return None
            except requests.exceptions.RequestException as e:
                print(f"Request error (attempt {attempt + 1}): {e}")
                if attempt == max_retries - 1:
                    return None

        return None

    def analyze_sentiment_advanced(self, text: str) -> dict:
        """Advanced sentiment analysis using Hugging Face"""
        if not self.enabled:
            return None

        try:
            # Truncate text to avoid API limits
            text_input = text[:512] if len(text) > 512 else text

            result = self.query_model(
                "cardiffnlp/twitter-roberta-base-sentiment-latest",
                {"inputs": text_input},
            )

            if result and isinstance(result, list) and len(result) > 0:
                # Handle different response formats
                if isinstance(result[0], list):
                    scores = result[0]
                else:
                    scores = result

                # Get the highest scoring sentiment
                best_sentiment = max(scores, key=lambda x: x.get("score", 0))
                return {
                    "label": best_sentiment.get("label", "UNKNOWN"),
                    "score": best_sentiment.get("score", 0),
                    "all_scores": scores,
                }
        except Exception as e:
            print(f"Sentiment analysis error: {e}")

        return None

    def extract_keywords_ai(self, text: str) -> List[str]:
        """AI-powered keyword extraction using summarization"""
        if not self.enabled:
            return []

        try:
            # Use the configured model or fall back to BART
            model_name = (
                HF_MODEL if "bart" in HF_MODEL.lower() else "facebook/bart-large-cnn"
            )

            result = self.query_model(
                model_name,
                {
                    "inputs": text,
                    "parameters": {
                        "max_length": 50,
                        "min_length": 10,
                        "do_sample": False,
                    },
                },
            )

            if result and isinstance(result, list) and len(result) > 0:
                summary_text = result[0].get("summary_text", "")
                # Extract meaningful words from summary
                words = re.findall(r"\b[a-zA-Z]{4,}\b", summary_text.lower())
                # Remove common words and return unique keywords
                common_words = {
                    "this",
                    "that",
                    "with",
                    "have",
                    "will",
                    "from",
                    "they",
                    "been",
                    "were",
                    "said",
                    "each",
                    "which",
                    "their",
                    "time",
                    "more",
                    "very",
                    "what",
                    "know",
                    "just",
                    "first",
                    "into",
                    "over",
                    "think",
                    "also",
                    "your",
                    "work",
                    "life",
                    "only",
                    "can",
                }
                keywords = [word for word in words if word not in common_words]
                return list(set(keywords))[:10]

        except Exception as e:
            print(f"AI keyword extraction error: {e}")

        return []

    def generate_content_suggestions(self, text: str, keywords: List[str]) -> List[str]:
        """Generate content improvement suggestions"""
        if not self.enabled:
            return []

        try:
            # Create a focused prompt for content analysis
            analysis_text = text[:300] + "..." if len(text) > 300 else text
            keyword_list = ", ".join(keywords[:5])

            # For now, return rule-based suggestions since complex text generation
            # requires more sophisticated prompting
            suggestions = []

            # Analyze content characteristics
            sentences = sent_tokenize(text)
            avg_sentence_length = (
                sum(len(word_tokenize(s)) for s in sentences) / len(sentences)
                if sentences
                else 0
            )

            if avg_sentence_length > 25:
                suggestions.append("Break down long sentences to improve readability")

            if len(keywords) < 5:
                suggestions.append(
                    "Consider adding more relevant keywords throughout your content"
                )

            if len(text.split("\n\n")) < 3:
                suggestions.append(
                    "Add more paragraph breaks to improve content structure"
                )

            return suggestions[:3]

        except Exception as e:
            print(f"Content suggestions error: {e}")

        return []


class SEOAnalyzer:
    def __init__(self, hf_client: HuggingFaceClient):
        try:
            self.stop_words = set(stopwords.words("english"))
        except:
            # Fallback if NLTK stopwords aren't available
            self.stop_words = set(
                [
                    "i",
                    "me",
                    "my",
                    "myself",
                    "we",
                    "our",
                    "ours",
                    "ourselves",
                    "you",
                    "your",
                    "yours",
                    "yourself",
                    "yourselves",
                    "he",
                    "him",
                    "his",
                    "himself",
                    "she",
                    "her",
                    "hers",
                    "herself",
                    "it",
                    "its",
                    "itself",
                    "they",
                    "them",
                    "their",
                    "theirs",
                    "themselves",
                    "what",
                    "which",
                    "who",
                    "whom",
                    "this",
                    "that",
                    "these",
                    "those",
                    "am",
                    "is",
                    "are",
                    "was",
                    "were",
                    "be",
                    "been",
                    "being",
                    "have",
                    "has",
                    "had",
                    "having",
                    "do",
                    "does",
                    "did",
                    "doing",
                    "a",
                    "an",
                    "the",
                    "and",
                    "but",
                    "if",
                    "or",
                    "because",
                    "as",
                    "until",
                    "while",
                    "of",
                    "at",
                    "by",
                    "for",
                    "with",
                    "through",
                    "during",
                    "before",
                    "after",
                    "above",
                    "below",
                    "up",
                    "down",
                    "in",
                    "out",
                    "on",
                    "off",
                    "over",
                    "under",
                    "again",
                    "further",
                    "then",
                    "once",
                ]
            )
        self.hf_client = hf_client

    def extract_title(self, text: str) -> str:
        """Extract or generate a title from the text"""
        lines = text.strip().split("\n")
        # Look for the first meaningful line that could be a title
        for line in lines[:3]:
            line = line.strip()
            if line and len(line) < 100 and not line.endswith(".") and len(line) > 10:
                return line

        # Fall back to first sentence if no clear title
        sentences = sent_tokenize(text)
        if sentences:
            first_sentence = sentences[0]
            if len(first_sentence) <= 60:
                return first_sentence.rstrip(".")
            else:
                return first_sentence[:57] + "..."

        # Last resort: truncate text
        return (text[:60] + "...") if len(text) > 60 else text

    def generate_meta_description(self, text: str) -> str:
        """Generate a meta description from the text"""
        sentences = sent_tokenize(text)
        description = ""

        for sentence in sentences:
            potential_desc = description + sentence + " "
            if len(potential_desc) <= 155:  # Leave room for "..."
                description = potential_desc
            else:
                break

        result = description.strip()
        if not result:
            result = text[:155] + "..." if len(text) > 155 else text
        elif len(result) > 155:
            result = result[:152] + "..."

        return result

    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract important keywords using traditional NLP + AI enhancement"""
        # Traditional keyword extraction
        text_lower = text.lower()
        cleaned_text = re.sub(r"[^\w\s]", " ", text_lower)

        try:
            tokens = word_tokenize(cleaned_text)
        except:
            # Fallback tokenization
            tokens = cleaned_text.split()

        # Filter meaningful words
        filtered_words = [
            word
            for word in tokens
            if word not in self.stop_words
            and len(word) > 3
            and word.isalpha()
            and not word.isdigit()
        ]

        # Count frequency
        word_freq = Counter(filtered_words)
        traditional_keywords = [
            word for word, freq in word_freq.most_common(max_keywords * 2)
        ]

        # Try to enhance with AI keywords
        ai_keywords = self.hf_client.extract_keywords_ai(text)

        # Combine and deduplicate, prioritizing AI keywords
        combined_keywords = []
        seen = set()

        # Add AI keywords first
        for kw in ai_keywords:
            if kw not in seen and len(kw) > 2:
                combined_keywords.append(kw)
                seen.add(kw)

        # Add traditional keywords
        for kw in traditional_keywords:
            if kw not in seen and len(combined_keywords) < max_keywords:
                combined_keywords.append(kw)
                seen.add(kw)

        return combined_keywords[:max_keywords]

    def calculate_readability(self, text: str) -> float:
        """Calculate readability score using multiple metrics"""
        try:
            flesch_score = textstat.flesch_reading_ease(text)
            return max(0.0, min(100.0, round(flesch_score, 1)))
        except:
            # Fallback calculation
            try:
                sentences = sent_tokenize(text)
                words = word_tokenize(text)
            except:
                sentences = text.split(".")
                words = text.split()

            if not sentences or not words:
                return 50.0

            # Simple readability approximation
            avg_sentence_length = len(words) / len(sentences)
            avg_word_length = sum(len(word) for word in words if word.isalpha()) / max(
                1, len([w for w in words if w.isalpha()])
            )

            # Flesch-like formula
            score = (
                206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_word_length / 100)
            )
            return max(0.0, min(100.0, round(score, 1)))

    def analyze_sentiment(
        self, text: str
    ) -> Literal["Positive", "Neutral", "Negative"]:
        """Analyze sentiment using AI-enhanced analysis"""
        # Try AI-powered sentiment analysis first
        ai_sentiment = self.hf_client.analyze_sentiment_advanced(text)

        if ai_sentiment:
            label = ai_sentiment["label"].upper()
            if "POSITIVE" in label or "POS" in label:
                return "Positive"
            elif "NEGATIVE" in label or "NEG" in label:
                return "Negative"
            else:
                return "Neutral"

        # Fallback to TextBlob
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
        try:
            words = word_tokenize(text)
            return len([word for word in words if word.isalpha()])
        except:
            # Fallback word counting
            words = re.findall(r"\b[a-zA-Z]+\b", text)
            return len(words)

    def calculate_reading_time(self, word_count: int) -> int:
        """Calculate reading time based on average reading speed (200 words per minute)"""
        return max(1, round(word_count / 200))

    def generate_summary(self, text: str, max_length: int = 200) -> str:
        """Generate a summary of the text"""
        try:
            sentences = sent_tokenize(text)
        except:
            sentences = text.split(".")

        if not sentences:
            return text[:max_length] + "..." if len(text) > max_length else text

        summary = ""
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            potential_summary = summary + sentence + ". "
            if len(potential_summary) <= max_length:
                summary = potential_summary
            else:
                break

        result = summary.strip()
        if not result:
            result = text[:max_length] + "..." if len(text) > max_length else text

        return result

    def analyze_content_structure(self, text: str) -> ContentStructure:
        """Analyze content structure including headings, paragraphs, etc."""
        lines = text.split("\n")
        headings = {"h1": 0, "h2": 0, "h3": 0, "h4": 0, "issues": []}

        # Enhanced heading detection
        for line in lines:
            line = line.strip()
            if not line or len(line) > 100:
                continue

            # Check for common heading patterns
            if line.isupper() and len(line.split()) <= 8:
                headings["h1"] += 1
            elif (
                line.title() == line
                and not line.endswith(".")
                and len(line.split()) <= 10
            ):
                headings["h2"] += 1
            elif line.startswith("#"):
                # Markdown headers
                if line.startswith("# "):
                    headings["h1"] += 1
                elif line.startswith("## "):
                    headings["h2"] += 1
                elif line.startswith("### "):
                    headings["h3"] += 1

        # Analyze issues
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

        if paragraphs_text:
            try:
                word_counts = [len(word_tokenize(p)) for p in paragraphs_text]
            except:
                word_counts = [len(p.split()) for p in paragraphs_text]

            avg_paragraph_length = sum(word_counts) / len(word_counts)
            long_paragraphs = len([wc for wc in word_counts if wc > 150])
        else:
            avg_paragraph_length = 0
            long_paragraphs = 0

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

        # Get AI-powered suggestions
        ai_suggestions = self.hf_client.generate_content_suggestions(text, keywords)
        linking_suggestions.extend(ai_suggestions)

        # Add traditional suggestions
        keyword_set = set(kw.lower() for kw in keywords)
        if any(word in keyword_set for word in ["guide", "tutorial", "how", "step"]):
            linking_suggestions.append(
                "Link to related tutorials or guides on your website"
            )
        if any(
            word in keyword_set for word in ["product", "service", "solution", "tool"]
        ):
            linking_suggestions.append("Add links to relevant product or service pages")
        if any(
            word in keyword_set for word in ["research", "study", "data", "analysis"]
        ):
            linking_suggestions.append("Link to supporting research or case studies")

        # Default suggestions if none found
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
        """Generate comprehensive SEO recommendations"""
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

        # Meta description optimization
        if len(description) < 120:
            recommendations.append(
                Recommendation(
                    id=rec_id,
                    title="Expand Meta Description",
                    description="Your meta description is too short. Expand it to 120-160 characters to provide more context and improve click-through rates.",
                    impact="Medium",
                    effort="Quick Fix",
                    category="Technical",
                    priority=2,
                    actionable=True,
                    fixSuggestion="Add more descriptive text about your content's value proposition and include relevant keywords naturally.",
                )
            )
            rec_id += 1

        # Keyword optimization
        if keywords:
            primary_keyword = keywords[0]
            recommendations.append(
                Recommendation(
                    id=rec_id,
                    title=f"Optimize for Primary Keyword: '{primary_keyword}'",
                    description=f"Focus on your primary keyword '{primary_keyword}' by ensuring it appears strategically throughout your content.",
                    impact="High",
                    effort="Moderate",
                    category="Keywords",
                    priority=1,
                    actionable=True,
                    fixSuggestion=f"1. Include '{primary_keyword}' in your title tag\n2. Use '{primary_keyword}' in the first 100 words\n3. Add '{primary_keyword}' to H2/H3 subheadings\n4. Maintain 1-2% keyword density throughout content",
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
                    fixSuggestion="Add sections covering: detailed explanations, examples, step-by-step guides, FAQs, or case studies to expand your content meaningfully.",
                )
            )
            rec_id += 1

        # Readability improvements
        if readability < 50:
            recommendations.append(
                Recommendation(
                    id=rec_id,
                    title="Improve Content Readability",
                    description="Your content complexity may hinder user engagement. Simplify language and structure for better accessibility.",
                    impact="Medium",
                    effort="Moderate",
                    category="Content",
                    priority=2,
                    actionable=True,
                    fixSuggestion="1. Replace complex words with simpler alternatives\n2. Split sentences longer than 20 words\n3. Use transition words for flow\n4. Add bullet points and numbered lists\n5. Include subheadings every 200-300 words",
                )
            )
            rec_id += 1

        # Structure recommendations
        if (
            content_structure.headings.get("h1", 0) == 0
            and content_structure.headings.get("h2", 0) == 0
        ):
            recommendations.append(
                Recommendation(
                    id=rec_id,
                    title="Add Content Structure",
                    description="Your content lacks clear headings. Add headings to improve readability and SEO.",
                    impact="Medium",
                    effort="Quick Fix",
                    category="Content",
                    priority=2,
                    actionable=True,
                    fixSuggestion="Add H2 and H3 headings every 200-300 words to break up your content and make it more scannable.",
                )
            )
            rec_id += 1

        return recommendations[:8]  # Limit to 8 recommendations

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


# Initialize Hugging Face client and analyzer
hf_client = HuggingFaceClient(HF_API_KEY)
analyzer = SEOAnalyzer(hf_client)

# Check if static directory exists and mount it
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    # Mount static files with proper MIME types
    app.mount(
        "/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets"
    )
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# API Routes
@app.get("/api/status")
async def api_status():
    return {
        "message": "AI-Powered SEO Analysis API is running",
        "ai_enabled": hf_client.enabled,
        "version": "2.0.0",
        "hf_model": HF_MODEL,
    }


@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_content(request: AnalysisRequest):
    """Analyze content for SEO insights using AI enhancement"""
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
                    fixSuggestion="Paste your content into the text area and click analyze again to get AI-powered insights.",
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
        import traceback

        traceback.print_exc()

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
                    description=f"An error occurred during analysis: {str(e)}",
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
    """Health check endpoint with detailed status"""
    models_status = {}

    if hf_client.enabled:
        # Test basic connectivity to HuggingFace
        try:
            test_result = hf_client.query_model(
                "cardiffnlp/twitter-roberta-base-sentiment-latest", {"inputs": "test"}
            )
            models_status["sentiment"] = "available" if test_result else "error"
        except:
            models_status["sentiment"] = "error"
    else:
        models_status["sentiment"] = "disabled"

    return {
        "status": "healthy",
        "ai_status": "enabled" if hf_client.enabled else "disabled",
        "hf_api_key_configured": bool(HF_API_KEY),
        "hf_model": HF_MODEL,
        "models_status": models_status,
        "nltk_data": {
            "punkt": _check_nltk_data("tokenizers/punkt"),
            "stopwords": _check_nltk_data("corpora/stopwords"),
        },
        "version": "2.0.0",
    }


def _check_nltk_data(resource: str) -> bool:
    """Check if NLTK data is available"""
    try:
        nltk.data.find(resource)
        return True
    except LookupError:
        return False


@app.get("/api/test-ai")
async def test_ai_features():
    """Test AI features endpoint"""
    if not hf_client.enabled:
        raise HTTPException(
            status_code=503, detail="AI features disabled - HF_API_KEY not configured"
        )

    test_text = (
        "This is a sample text for testing our AI-powered SEO analysis features."
    )

    results = {}

    # Test sentiment analysis
    try:
        sentiment_result = hf_client.analyze_sentiment_advanced(test_text)
        results["sentiment_analysis"] = {
            "status": "working" if sentiment_result else "error",
            "result": sentiment_result,
        }
    except Exception as e:
        results["sentiment_analysis"] = {"status": "error", "error": str(e)}

    # Test keyword extraction
    try:
        keywords_result = hf_client.extract_keywords_ai(test_text)
        results["keyword_extraction"] = {
            "status": "working" if keywords_result else "error",
            "result": keywords_result,
        }
    except Exception as e:
        results["keyword_extraction"] = {"status": "error", "error": str(e)}

    return {"ai_enabled": True, "test_results": results, "hf_model": HF_MODEL}


# Serve React app for frontend routes
@app.get("/")
async def serve_frontend():
    """Serve the React frontend"""
    if static_dir.exists():
        index_file = static_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))

    # Fallback if no static files found
    return {
        "message": "AI-Powered SEO Analysis API",
        "frontend": "not_found",
        "api_endpoints": {
            "analyze": "/api/analyze",
            "health": "/health",
            "status": "/api/status",
            "test_ai": "/api/test-ai",
            "docs": "/docs",
        },
    }


@app.get("/{full_path:path}")
async def serve_frontend_routes(full_path: str):
    """Catch-all route to serve React app for frontend routes"""
    # Don't serve static files for API routes or docs
    if full_path.startswith(("api/", "docs", "openapi.json", "health")):
        raise HTTPException(status_code=404, detail="Not found")

    # Handle assets properly - should never reach here due to mount, but just in case
    if full_path.startswith("assets/"):
        raise HTTPException(status_code=404, detail="Asset not found")

    # Serve React app for all other routes
    if static_dir.exists():
        index_file = static_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))

    # Fallback if no static files
    raise HTTPException(status_code=404, detail="Frontend not found")


if __name__ == "__main__":
    print(f"Starting SEO Analysis API...")
    print(f"HuggingFace API Key configured: {bool(HF_API_KEY)}")
    print(f"HuggingFace Model: {HF_MODEL}")
    print(f"AI Features: {'Enabled' if HF_API_KEY else 'Disabled'}")
    print(f"Static files directory: {static_dir}")
    print(f"Static files exist: {static_dir.exists()}")

    # Use Railway's PORT environment variable
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
