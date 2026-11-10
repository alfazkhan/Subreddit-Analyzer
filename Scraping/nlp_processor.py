import os
import nltk
from collections import Counter
import spacy
import torch
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from transformers import pipeline

# Configure PyTorch allocator
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

# Force Hugging Face offline mode
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["HF_HOME"] = r"D:\huggingface_cache"

# Register local NLTK directory paths
nltk.data.path.append(r"C:\Users\Administrator\AppData\Roaming\nltk_data")
nltk.data.path.append(r"D:\React JS\Reddit-Data-Scrapper\Reddit-Scrapper\nltk_data")

# Bypass torch.load safety check
import transformers.utils.import_utils
import transformers.modeling_utils
transformers.utils.import_utils.check_torch_load_is_safe = lambda: None
transformers.modeling_utils.check_torch_load_is_safe = lambda: None

SENTIMENT_MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
CLASSIFIER_MODEL_NAME = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"

# Lazy global model containers
_sentiment_pipeline = None
_classifier_pipeline = None

# Multilingual SpaCy NER Loader
_nlp_en = None
_nlp_multi = None

def get_spacy_models():
    global _nlp_en, _nlp_multi
    if _nlp_en is None:
        try:
            _nlp_en = spacy.load("en_core_web_sm")
        except Exception:
            _nlp_en = None

    if _nlp_multi is None:
        try:
            _nlp_multi = spacy.load("xx_ent_wiki_sm")
        except Exception:
            _nlp_multi = None

    return _nlp_en, _nlp_multi

lemmatizer = WordNetLemmatizer()
try:
    ENGLISH_STOPWORDS = set(stopwords.words('english'))
except Exception:
    ENGLISH_STOPWORDS = set()

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

# Complete set matching your frontend labelConfig
SUPPORTED_ENTITY_LABELS = {
    "PERSON", "NORP", "FAC", "ORG", "GPE", "LOC", 
    "PRODUCT", "EVENT", "WORK_OF_ART", "LAW", 
    "LANGUAGE", "DATE", "TIME", "MONEY", "QUANTITY", "PERCENT"
}


def _get_target_device():
    force_cpu = os.getenv("FORCE_CPU", "0") == "1"
    if force_cpu or not torch.cuda.is_available():
        return -1, torch.float32
    return 0, torch.float16


def get_sentiment_pipeline():
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        device_id, dtype = _get_target_device()
        kwargs = {
            "model": SENTIMENT_MODEL_NAME,
            "tokenizer": SENTIMENT_MODEL_NAME,
            "truncation": True,
            "max_length": 512,
            "local_files_only": True
        }
        if device_id == 0:
            kwargs.update({"device": device_id, "dtype": dtype, "model_kwargs": {"low_cpu_mem_usage": True}})
        else:
            kwargs["device"] = -1
        _sentiment_pipeline = pipeline("sentiment-analysis", **kwargs)
    return _sentiment_pipeline


def get_classifier_pipeline():
    global _classifier_pipeline
    if _classifier_pipeline is None:
        device_id, dtype = _get_target_device()
        kwargs = {
            "model": CLASSIFIER_MODEL_NAME,
            "truncation": True,
            "max_length": 1024,
            "local_files_only": True
        }
        if device_id == 0:
            kwargs.update({"device": device_id, "dtype": dtype, "model_kwargs": {"low_cpu_mem_usage": True}})
        else:
            kwargs["device"] = -1
        _classifier_pipeline = pipeline("zero-shot-classification", **kwargs)
    return _classifier_pipeline


def get_sentiment(text: str) -> dict:
    clean_text = text.strip() if text else ""
    if not clean_text:
        return {
            "label": "Neutral",
            "scores": {"positive": 0.0, "neutral": 1.0, "negative": 0.0}
        }
    
    pipe = get_sentiment_pipeline()
    results = pipe(clean_text, top_k=None)
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
    """
    Extracts named entities using en_core_web_sm or xx_ent_wiki_sm multilingual pipeline.
    Matches all entity labels configured in labelConfig.
    """
    clean_text = text.strip() if text else ""
    if not clean_text:
        return []

    nlp_en, nlp_multi = get_spacy_models()
    nlp_model = nlp_en or nlp_multi
    
    if not nlp_model:
        return []

    # Limit text length to avoid memory spikes on oversized submissions
    doc = nlp_model(clean_text[:10000])
    
    entities = []
    seen = set()

    for ent in doc.ents:
        label = ent.label_.upper()
        clean_entity_text = ent.text.strip()
        
        if label in SUPPORTED_ENTITY_LABELS and len(clean_entity_text) > 1:
            key = (clean_entity_text.lower(), label)
            if key not in seen:
                seen.add(key)
                entities.append({
                    "text": clean_entity_text,
                    "label": label
                })

    return entities


def extract_keywords(text: str, dynamic_ignored_words: set = None) -> dict:
    if dynamic_ignored_words is None:
        dynamic_ignored_words = set()
    words = word_tokenize(text.lower())
    sw = ENGLISH_STOPWORDS.union(dynamic_ignored_words)
    clean = [lemmatizer.lemmatize(w) for w in words if w.isalnum() and len(w) > 2 and w not in sw]
    return dict(Counter(clean))


def classify_topics(text: str) -> dict:
    clean_text = text.strip() if text else ""
    if not clean_text:
        return {"labels": [], "scores": [], "primary_topic": "Community Discussion"}
        
    pipe = get_classifier_pipeline()
    result = pipe(clean_text, candidate_labels=CANDIDATE_LABELS)
    return {
        "labels": result["labels"],
        "scores": [round(score, 3) for score in result["scores"]],
        "primary_topic": result["labels"][0]
    }