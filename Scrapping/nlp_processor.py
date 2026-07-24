import spacy
import logging
import os

# Suppress Hugging Face and TensorFlow initialization warnings
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from transformers import pipeline
from collections import Counter

logging.info("NLP: Loading multilingual models and resources...")

# Load spaCy NLP model for entity extraction
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    logging.warning("NLP: Fallback loading spaCy sm pipeline...")
    nlp = spacy.blank("en")

lemmatizer = WordNetLemmatizer()

# Multilingual Sentiment Analysis Engine (XLM-RoBERTa)
sentiment_pipeline = pipeline(
    "sentiment-analysis", 
    model="cardiffnlp/twitter-xlm-roberta-base-sentiment", 
    device=-1
)

# Multilingual Zero-Shot Topic Classification Engine (mDeBERTa-v3)
classifier_pipeline = pipeline(
    "zero-shot-classification", 
    model="MoritzLaurer/mDeBERTa-v3-base-mnli-fever-anli", 
    device=-1
)

# Exact 30 original candidate strings categorized under the 5 Thesis KPI domains
CANDIDATE_LABELS = [
    # 1. Economic Sentiment Index (ESI)
    "Rent Prices & Affordability",
    "Utility Bills & Energy Costs",
    "Job Postings & Career Advice",
    "Salaries & Cost of Living Rants",
    "Supermarket Prices & Groceries",

    # 2. Infrastructure & Services Index (ISI)
    "Subway, Tram & Train Schedules",
    "Bus Routes & Reliability",
    "Transit Passes & Ticket Pricing",
    "Bicycle Lanes & Cycling Safety",
    "Traffic Congestion & Roadwork",
    "City Parking & Driving Permits",
    "City Registration & Paperwork",
    "Home Maintenance & Damage Repairs",

    # 3. Local Consumer Intent Index (CII)
    "Restaurant & Cafe Reviews",
    "Bars, Nightclubs & Nightlife",
    "Street Food & Local Cuisines",
    "Festivals, Concerts & Public Events",
    "Museums, Art & Theater",
    "Amateur Sports & Fitness Groups",
    "Tourist Attractions & Sightseeing",

    # 4. Community Concern & Safety Index (CCI)
    "Neighborhood Safety & Crime Alerts",
    "Protests, Strikes & Demonstrations",
    "City Council Policies & Budgets",
    "Local Elections & Candidates",
    "Lost Items & Found Belongings",

    # 5. Expat & Integration Index (EII)
    "Visas & Residence Permits",
    "Apartment Viewings & Contracts",
    "Flatmates & Shared Housing",
    "Landlord Disputes & Evictions",
    "Student Shifts & Part-Time Work"
]

logging.info("NLP: Multilingual Models ready.")


def get_sentiment(text: str) -> dict:
    """
    Extracts multilingual sentiment category and continuous probability scores 
    using XLM-RoBERTa.
    Returns:
        {
            "label": "Positive",
            "scores": {"positive": 0.8521, "neutral": 0.1102, "negative": 0.0377}
        }
    """
    truncated = text[:512].strip()
    if not truncated:
        return {
            "label": "Neutral",
            "scores": {"positive": 0.0, "neutral": 1.0, "negative": 0.0}
        }
    
    # top_k=None forces pipeline to return confidence probabilities for all 3 classes
    results = sentiment_pipeline(truncated, top_k=None)
    
    # Standardize output keys
    scores = {}
    for res in results:
        raw_label = res["label"].lower()
        if "pos" in raw_label:
            key = "positive"
        elif "neg" in raw_label:
            key = "negative"
        else:
            key = "neutral"
        scores[key] = round(float(res["score"]), 4)
    
    # Fallback default values if keys are missing
    for default_key in ["positive", "neutral", "negative"]:
        if default_key not in scores:
            scores[default_key] = 0.0

    # Determine primary string label for backward compatibility
    top_label = max(scores, key=scores.get).capitalize()
    
    return {
        "label": top_label,
        "scores": scores
    }


def extract_entities(text: str) -> list:
    """
    Extracts named entities from text using spaCy.
    """
    doc = nlp(text)
    labels = ["PERSON", "ORG", "GPE", "LOC", "PRODUCT", "DATE", "MONEY"]
    return [{"text": ent.text, "label": ent.label_} for ent in doc.ents if ent.label_ in labels]


def extract_keywords(text: str, dynamic_ignored_words: set = None) -> dict:
    """
    Cleans, tokenizes, and extracts word frequency counts from text.
    """
    if dynamic_ignored_words is None:
        dynamic_ignored_words = set()
    words = word_tokenize(text.lower())
    sw = set(stopwords.words('english')).union(dynamic_ignored_words)
    clean = [lemmatizer.lemmatize(w) for w in words if w.isalnum() and w not in sw]
    return dict(Counter(clean))


def classify_topics(text: str) -> dict:
    """
    Runs text through mDeBERTa-v3 to map content into business domains.
    Returns structured dict for frontend analytics state.
    """
    truncated = text[:1024].strip()  # DeBERTa accepts up to 1024 tokens safely
    if not truncated:
        return {"labels": [], "scores": [], "primary_topic": "Community Discussion"}
        
    result = classifier_pipeline(truncated, candidate_labels=CANDIDATE_LABELS)
    
    return {
        "labels": result["labels"],
        "scores": [round(score, 3) for score in result["scores"]],
        "primary_topic": result["labels"][0]  # Highest confidence choice
    }