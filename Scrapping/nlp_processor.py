import os
from collections import Counter
import spacy
import torch
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from transformers import pipeline

# Suppress Hugging Face verbosity
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["HF_HOME"] = r"D:\huggingface_cache"

# Bypass torch.load safety check for legacy transformers
import transformers.utils.import_utils
import transformers.modeling_utils
transformers.utils.import_utils.check_torch_load_is_safe = lambda: None
transformers.modeling_utils.check_torch_load_is_safe = lambda: None

SENTIMENT_MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
CLASSIFIER_MODEL_NAME = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"

# Target GPU device 0 if CUDA is available
device_id = 0 if torch.cuda.is_available() else -1
dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# Global lightweight NLP tools initialization
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")

lemmatizer = WordNetLemmatizer()
ENGLISH_STOPWORDS = set(stopwords.words('english'))

# Pre-load Sentiment Pipeline on GPU in FP16
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model=SENTIMENT_MODEL_NAME,
    tokenizer=SENTIMENT_MODEL_NAME,
    device=device_id,
    torch_dtype=dtype,
    truncation=True,
    max_length=512
)

# Pre-load Zero-Shot Classifier Pipeline on GPU in FP16
classifier_pipeline = pipeline(
    "zero-shot-classification",
    model=CLASSIFIER_MODEL_NAME,
    device=device_id,
    torch_dtype=dtype,
    truncation=True,
    max_length=1024
)

CANDIDATE_LABELS = [
    "Rent Prices & Affordability",
    "Utility Bills & Energy Costs",
    "Job Postings & Career Advice",
    "Salaries & Cost of Living Rants",
    "Supermarket Prices & Groceries",
    "Subway, Tram & Train Schedules",
    "Bus Routes & Reliability",
    "Transit Passes & Ticket Pricing",
    "Bicycle Lanes & Cycling Safety",
    "Traffic Congestion & Roadwork",
    "City Parking & Driving Permits",
    "City Registration & Paperwork",
    "Home Maintenance & Damage Repairs",
    "Restaurant & Cafe Reviews",
    "Bars, Nightclubs & Nightlife",
    "Street Food & Local Cuisines",
    "Festivals, Concerts & Public Events",
    "Museums, Art & Theater",
    "Amateur Sports & Fitness Groups",
    "Tourist Attractions & Sightseeing",
    "Neighborhood Safety & Crime Alerts",
    "Protests, Strikes & Demonstrations",
    "City Council Policies & Budgets",
    "Local Elections & Candidates",
    "Lost Items & Found Belongings",
    "Visas & Residence Permits",
    "Apartment Viewings & Contracts",
    "Flatmates & Shared Housing",
    "Landlord Disputes & Evictions",
    "Student Shifts & Part-Time Work"
]


def get_sentiment(text: str) -> dict:
    clean_text = text.strip() if text else ""
    if not clean_text:
        return {
            "label": "Neutral",
            "scores": {"positive": 0.0, "neutral": 1.0, "negative": 0.0}
        }
    
    results = sentiment_pipeline(clean_text, top_k=None)
    scores = {"positive": 0.0, "neutral": 0.0, "negative": 0.0}
    predictions = results[0] if isinstance(results[0], list) else results

    for res in predictions:
        raw_label = str(res["label"]).lower()
        if "pos" in raw_label:
            scores["positive"] = round(float(res["score"]), 4)
        elif "neg" in raw_label:
            scores["negative"] = round(float(res["score"]), 4)
        else:
            scores["neutral"] = round(float(res["score"]), 4)

    top_label = max(scores, key=scores.get).capitalize()
    return {"label": top_label, "scores": scores}


def extract_entities(text: str) -> list:
    doc = nlp(text)
    labels = ["PERSON", "ORG", "GPE", "LOC", "PRODUCT", "DATE", "MONEY"]
    return [{"text": ent.text, "label": ent.label_} for ent in doc.ents if ent.label_ in labels]


def extract_keywords(text: str, dynamic_ignored_words: set = None) -> dict:
    if dynamic_ignored_words is None:
        dynamic_ignored_words = set()
    words = word_tokenize(text.lower())
    sw = ENGLISH_STOPWORDS.union(dynamic_ignored_words)
    clean = [lemmatizer.lemmatize(w) for w in words if w.isalnum() and w not in sw]
    return dict(Counter(clean))


def classify_topics(text: str) -> dict:
    clean_text = text.strip() if text else ""
    if not clean_text:
        return {"labels": [], "scores": [], "primary_topic": "Community Discussion"}
        
    result = classifier_pipeline(clean_text, candidate_labels=CANDIDATE_LABELS)
    return {
        "labels": result["labels"],
        "scores": [round(score, 3) for score in result["scores"]],
        "primary_topic": result["labels"][0]
    }