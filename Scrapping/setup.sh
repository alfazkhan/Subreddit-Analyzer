#!/bin/bash
set -e

echo "Starting system provisioning pipeline..."

cd /root/Reddit-Data-Scrapper
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip

if [ -f "Scrapping/requirements.txt" ]; then
    pip install -r Scrapping/requirements.txt
fi

playwright install --with-deps chromium
python -m spacy download en_core_web_sm

python -c "
import nltk
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('stopwords')
nltk.download('wordnet')
"

echo "System pipeline completed successfully."