# Subreddit Analyzer: Real-Time Business Intelligence Dashboard

A full-stack Business Intelligence (BI) tool designed to scrape, analyze, and visualize Reddit data in real-time. This project uses a Python-based backend for advanced Natural Language Processing (NLP) and a React-powered frontend for a seamless data visualization experience.

## Overview

Subreddit Scrapper allows users to enter any subreddit name and fetch a specified number of posts. The system performs real-time sentiment analysis, keyword extraction, and Named Entity Recognition (NER) to provide actionable insights through an interactive dashboard.

### Key Features
* **Live Scrapping:** Uses Playwright to navigate Reddit and stream new posts directly to the UI.
* **Hybrid Caching:** Implements a gap-filling caching mechanism that stores historical data locally in JSON format to speed up repeated queries.
* **Sentiment Analysis:** Utilizes the `cardiffnlp/twitter-roberta-base-sentiment-latest` Transformer model for high-accuracy context-aware sentiment classification.
* **Named Entity Recognition (NER):** Leverages Spacy (`en_core_web_sm`) to identify entities such as Organizations, Money, Dates, and People.
* **Real-Time Updates:** Communication between the frontend and backend is handled via WebSockets for live progress tracking and data deltas.
* **Visual Analytics:** Interactive pie charts, sentiment cards, and keyword frequency tables.

## Dashboard Preview

To help visualize the data, the dashboard provides several analytical views:

### Sentiment Analysis
The sentiment overview gives a high-level breakdown of the emotional tone of the scraped posts.
![Sentiment Dashboard](./src/assets/Screenshots/Sentiments.png)

### Keyword Visualization
Interactive charts show the most frequent terms, allowing for quick identification of trending topics.
![Keyword Pie Chart](./src/assets/Screenshots/Pie-Chart.png)

### Data Tables
Detailed views for specific posts and entity extraction results.
![Posts Table with NER](./src/assets/Screenshots/Post-Table.png)
![Keyword Frequency Table](./src/assets/Screenshots/Keyword-Table.png)

---

## Tech Stack

### Backend (Python)
* **Playwright:** Headless/Headful browser automation for web scraping.
* **WebSockets:** Real-time bi-directional communication.
* **Transformers (Hugging Face):** RoBERTa model for sentiment analysis.
* **Spacy:** Named Entity Recognition (NER).
* **NLTK:** Tokenization, stopword removal, and lemmatization.
* **Asyncio:** Concurrent processing of multiple browser tabs.

### Frontend (React)
* **Tailwind CSS:** Modern, responsive UI design.
* **Lucide React:** Icon set for the dashboard.
* **chartjs:** Visualization for sentiment and keyword data.
* **State Management:** Hooks for handling live WebSocket data streams.

---

##  Backend Logic & Workflow

1.  **Command Reception:** The backend waits for a WebSocket command containing the subreddit name and post count.
2.  **Phase 1 (Priority Stream):** The scraper identifies new posts not present in the cache and prioritizes them for immediate analysis and UI update.
3.  **Phase 2 (NLP Pipeline):**
    * **Tokenization & Cleaning:** Removes stopwords and "Reddit-specific" noise like "deleted" or "amp".
    * **Sentiment:** Classified via RoBERTa Transformer.
    * **NER:** Filters for BI-relevant labels like `ORG`, `GPE`, `MONEY`, and `PRODUCT`.
4.  **Phase 3 (Background Maintenance):** While the user views the data, the scraper continues to fill "gaps" between the latest post and the last cached post silently in the background.
5.  **Phase 4 (Persistence):** Data is saved to local JSON files per subreddit to allow for "Cache Only" mode, bypassing the browser entirely for instant loading.

---

## Installation & Setup

### Prerequisites
* Python 3.8+
* Node.js & npm
* Brave Browser (or Chromium)

### Backend Setup
1.  Navigate to the project directory.
2.  Install dependencies:
    ```bash
    pip install nltk websockets playwright transformers torch spacy
    python -m spacy download en_core_web_sm
    ```
3.  Update the `BRAVE_PATH` in the script to point to your browser executable.
4.  Run the server:
    ```bash
    python Scrapping.py
    ```

### Frontend Setup
1.  Navigate to the frontend folder.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```

---

## 📝 License
This project was developed for educational and research purposes in Business Intelligence and Data Science.