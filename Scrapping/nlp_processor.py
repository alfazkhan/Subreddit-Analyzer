import spacy
import logging
import os
import torch

# Suppress Hugging Face and TensorFlow initialization warnings
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

# Set Hugging Face cache directory
os.environ["HF_HOME"] = r"D:\huggingface_cache"

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

# Dynamic GPU detection for PyTorch
device_id = 0 if torch.cuda.is_available() else -1

SENTIMENT_MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"

# Multilingual Sentiment Analysis Engine (XLM-RoBERTa)
sentiment_pipeline = pipeline(
    "sentiment-analysis", 
    model=SENTIMENT_MODEL_NAME,
    tokenizer=SENTIMENT_MODEL_NAME,
    device=device_id,
    truncation=True,
    max_length=512
)

# Multilingual Zero-Shot Topic Classification Engine (mDeBERTa-v3)
classifier_pipeline = pipeline(
    "zero-shot-classification", 
    model="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli", 
    device=device_id,
    truncation=True,
    max_length=1024
)

# Exact candidate strings categorized under the 5 Thesis KPI domains
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
    clean_text = text.strip() if text else ""
    if not clean_text:
        return {
            "label": "Neutral",
            "scores": {"positive": 0.0, "neutral": 1.0, "negative": 0.0}
        }
    
    # top_k=None forces pipeline to return confidence probabilities for all 3 classes
    results = sentiment_pipeline(clean_text, top_k=None)
    
    scores = {"positive": 0.0, "neutral": 0.0, "negative": 0.0}
    
    # Handle nested prediction structure safely
    predictions = results[0] if isinstance(results[0], list) else results

    for res in predictions:
        raw_label = str(res["label"]).lower()
        if "pos" in raw_label:
            scores["positive"] = round(float(res["score"]), 4)
        elif "neg" in raw_label:
            scores["negative"] = round(float(res["score"]), 4)
        else:
            scores["neutral"] = round(float(res["score"]), 4)

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
    clean_text = text.strip() if text else ""
    if not clean_text:
        return {"labels": [], "scores": [], "primary_topic": "Community Discussion"}
        
    result = classifier_pipeline(clean_text, candidate_labels=CANDIDATE_LABELS)
    
    return {
        "labels": result["labels"],
        "scores": [round(score, 3) for score in result["scores"]],
        "primary_topic": result["labels"][0]
    }