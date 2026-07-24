import subprocess
import sys
import os

def run_pip_install():
    """Installs and upgrades all dependencies from requirements.txt."""
    print("Upgrading pip...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])

    req_file = "requirements.txt"
    if not os.path.exists(req_file) and os.path.exists("Scrapping/requirements.txt"):
        req_file = "Scrapping/requirements.txt"

    print(f"Installing Python dependencies from {req_file}...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])
    except subprocess.CalledProcessError:
        print(f"Error: {req_file} not found or installation failed.")
        sys.exit(1)

def setup_nlp():
    """Downloads necessary NLTK datasets, spaCy models, and pre-caches Hugging Face models."""
    print("Downloading NLTK datasets...")
    # Deferred import to prevent ModuleNotFoundError before pip install finishes
    import nltk
    nltk_resources = ['punkt', 'stopwords', 'wordnet', 'vader_lexicon', 'punkt_tab', 'omw-1.4']
    for resource in nltk_resources:
        nltk.download(resource, quiet=True)
    
    print("Downloading spaCy NLP model (en_core_web_sm)...")
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])

    print("Pre-downloading Hugging Face multilingual models to local cache...")
    try:
        from transformers import pipeline
        print("Caching XLM-RoBERTa sentiment model...")
        pipeline("sentiment-analysis", model="cardiffnlp/twitter-xlm-roberta-base-sentiment")
        print("Caching mDeBERTa-v3 zero-shot classification model...")
        pipeline("zero-shot-classification", model="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli")
        print("Hugging Face models downloaded and cached successfully.")
    except Exception as e:
        print(f"Warning: Pre-downloading Hugging Face models failed: {e}")

def setup_playwright():
    """Installs the Chromium browser for Playwright."""
    print("Installing Playwright Chromium binary...")
    subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])

if __name__ == "__main__":
    run_pip_install()
    setup_nlp()
    setup_playwright()
    print("\nEnvironment setup complete!")