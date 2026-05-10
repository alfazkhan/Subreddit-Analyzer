import subprocess
import sys
import nltk

def run_pip_install():
    """Installs all dependencies from requirements.txt."""
    print("Installing Python dependencies from requirements.txt...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    except subprocess.CalledProcessError:
        print("Error: requirements.txt not found or installation failed.")

def setup_nlp():
    """Downloads necessary NLTK and spaCy models."""
    print("Downloading NLTK datasets...")
    nltk_resources = ['punkt', 'stopwords', 'wordnet', 'vader_lexicon', 'punkt_tab', 'omw-1.4']
    for resource in nltk_resources:
        nltk.download(resource)
    
    print("Downloading spaCy NLP model (en_core_web_sm)...")
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])

def setup_playwright():
    """Installs the Chromium browser for Playwright."""
    print("Installing Playwright Chromium binary...")
    subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])

if __name__ == "__main__":
    run_pip_install()
    setup_nlp()
    setup_playwright()
    print("\nEnvironment setup complete!")