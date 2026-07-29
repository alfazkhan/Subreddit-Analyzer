FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install Linux system dependencies required for C-extensions, Playwright, and PostgreSQL
# Added procps, psmisc, lsof, and net-tools so debugging tools (ps, kill, fuser, netstat) are pre-installed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libpq-dev \
    procps \
    psmisc \
    lsof \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage Docker build layer caching
COPY requirements.txt /app/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Install Playwright browser dependencies and Chromium binary
RUN playwright install chromium --with-deps

# Pre-download SpaCy and NLTK language datasets into the Docker image
RUN python -m spacy download en_core_web_sm
RUN python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('wordnet', quiet=True); nltk.download('vader_lexicon', quiet=True); nltk.download('omw-1.4', quiet=True)"

# Copy project files
COPY . /app

EXPOSE 8000

# Keeps container running silently without starting python run_api.py on boot
CMD ["sleep", "infinity"]