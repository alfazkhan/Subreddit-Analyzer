#!/bin/bash
set -e

echo "Starting system provisioning pipeline..."

# Dynamically resolve script location instead of using hardcoded paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Upgrading pip..."
pip install --upgrade pip

REQ_PATH="requirements.txt"
if [ ! -f "$REQ_PATH" ] && [ -f "Scrapping/requirements.txt" ]; then
    REQ_PATH="Scrapping/requirements.txt"
fi

if [ -f "$REQ_PATH" ]; then
    echo "Installing requirements from $REQ_PATH..."
    pip install -r "$REQ_PATH"
else
    echo "Error: requirements.txt not found."
    exit 1
fi

echo "Installing Playwright system dependencies and Chromium..."
playwright install --with-deps chromium

echo "Downloading spaCy model..."
python -m spacy download en_core_web_sm

echo "Downloading NLTK datasets..."
python -c "
import nltk
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('vader_lexicon', quiet=True)
nltk.download('omw-1.4', quiet=True)
"

echo "Pre-downloading Hugging Face multilingual models..."
python -c "
from transformers import pipeline
print('Caching XLM-RoBERTa sentiment model...')
pipeline('sentiment-analysis', model='cardiffnlp/twitter-xlm-roberta-base-sentiment')
print('Caching mDeBERTa-v3 zero-shot classification model...')
pipeline('zero-shot-classification', model='MoritzLaurer/mDeBERTa-v3-base-mnli-xnli')
"

echo "System pipeline completed successfully."