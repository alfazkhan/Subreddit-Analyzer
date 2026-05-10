import spacy
import nltk
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from transformers import pipeline
from collections import Counter

# Initialize resources once to save memory
nltk.download(['punkt', 'stopwords', 'wordnet', 'vader_lexicon'])
nlp = spacy.load("en_core_web_sm")
lemmatizer = WordNetLemmatizer()
sentiment_pipeline = pipeline(
    "sentiment-analysis", 
    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
    device=-1
)

def get_sentiment(text: str) -> str:
    """Analyze text sentiment using RoBERTa."""
    truncated_text = text[:512]
    result = sentiment_pipeline(truncated_text)[0]
    return result['label'].capitalize()

def extract_entities(text: str) -> list:
    """Extract named entities relevant to BI."""
    doc = nlp(text)
    target_labels = ["PERSON", "ORG", "GPE", "LOC", "PRODUCT", "DATE", "MONEY"]
    return [{"text": ent.text, "label": ent.label_} for ent in doc.ents if ent.label_ in target_labels]

def extract_keywords(text: str, ignore_list: set) -> dict:
    """Tokenize and count keywords after filtering stop words."""
    words = word_tokenize(text.lower())
    sw = set(stopwords.words('english'))
    clean = [lemmatizer.lemmatize(w) for w in words if w.isalnum() and w not in sw and w not in ignore_list]
    return dict(Counter(clean))