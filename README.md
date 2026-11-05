<div align="center">
<img src="./public/Logo.png" alt="Subreddit Input" width="100"/>

# Subreddit Analyzer

A full-stack civic analytics dashboard designed to scrape, process, and visualize Reddit community data (sentiment, keywords, topics, and entities) across municipal subreddits.

<br>

<a href="https://subanalyzer.theonlyalfaz.com" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Live_Demo-subanalyzer.theonlyalfaz.com-orange?style=for-the-badge&logo=vercel" alt="Live Demo" />
</a>

</div>

<br>

<div align="center">

## 🛠 Technology Stack

### Frontend
<br>
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
<img src="https://img.shields.io/badge/Chakra--UI-319795?style=for-the-badge&logo=chakraui&logoColor=white" alt="Chakra UI" />
<img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white" alt="Chart.js" />

### Backend
<br>
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" />


<img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch" />
<img src="https://img.shields.io/badge/spaCy-09A3D5?style=for-the-badge&logo=spacy&logoColor=white" alt="spaCy" />
<img src="https://img.shields.io/badge/Hugging_Face-FF9D00?style=for-the-badge&logo=huggingface&logoColor=white" alt="Hugging Face" />

</div>

<br>

<div align="center">

## 📊 Features & Analytics

This project is built to discover and analyze Reddit data with a full-stack platform that combines scraping, database storage, NLP, and dashboard visualization.

<details>
<summary><b>🖼️ View Dashboard Screenshots (Click to Expand)</b></summary>
<br>

### Subreddit Selection & Cache Summary
<img src="./src/assets/Screenshots/UserInput.png" alt="Subreddit Input" width="800"/>

### KPI Analytics
<img src="./src/assets/Screenshots/KPI-Analytics.png" alt="KPI Analytics" width="800"/>

### Sentiment Analysis Breakdown
<img src="./src/assets/Screenshots/Sentiments.png" alt="Sentiment Analysis" width="800"/>

### Keyword Frequency & Entity Recognition
<img src="./src/assets/Screenshots/Keyword-Table.png" alt="Keyword Chart" width="800"/>

### Cursor-Paginated Data Tables
<img src="./src/assets/Screenshots/Post-Table.png" alt="Posts Table" width="800"/>

### Diurnal Post Frequency
<img src="./src/assets/Screenshots/Post-Frequency.png" alt="Post Frequency" width="800"/>

### Local Timezone-Synchronized Sentiment Rhythms
<img src="./src/assets/Screenshots/Sentiment-Frequency.png" alt="Sentiment Frequency" width="800"/>

</details>

</div>

---

<div align="center">

## 🚀 Setup & Installation

</div>

### 1. Database Configuration
Ensure PostgreSQL is running locally or remotely. Create a new database for the analyzer.

### 2. Backend Setup
Navigate to the backend directory and set up your Python environment:

```bash
cd Scraping
python -m venv .venv

```

Activate the virtual environment:

* **Windows:** `.venv\Scripts\activate`
* **macOS/Linux:** `source .venv/bin/activate`

Install dependencies:

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -m spacy download xx_ent_wiki_sm
python -m playwright install

```

#### Security & Authentication Files

The backend requires two critical credential files in the `Scraping` directory. **Never commit these to version control.**

1. **`firebase_creds.json`**: Generate a private key from your Firebase Console (Project Settings > Service Accounts) and save it here.
2. **`auth.json` (Optional but recommended for scraping)**: Playwright uses this file to store a logged-in Reddit session state to avoid rate limits. Run the scraper interactively once to generate it, or manually place a valid Playwright session state JSON here.

Run the API and Worker:

```bash
# Terminal 1: Run the API Gateway
python run_api.py

# Terminal 2: Run the Background Scraper & NLP Engine
python run_worker.py

```

*The API will be available at `http://localhost:8000`.*

### 3. Frontend Setup

Open a new terminal, navigate to the project root, and install the Node dependencies:

```bash
npm install
npm run dev

```

*The React dashboard will be available at `http://localhost:5173`.*

---

## 🧪 Testing

### Backend Testing

The backend includes a comprehensive `pytest` suite testing database connections, NLP processing, routing, and pagination.

To run the backend tests:

```bash
cd Scraping
pytest tests/ -v

```

Tests use mocked PostgreSQL connections by default. To additionally verify writes against a real PostgreSQL server, set `REDDIT_TEST_DATABASE_URL` to a dedicated test database whose name contains `test`.

### Frontend Testing

Run the frontend unit tests, strict TypeScript check, and browser E2E tests with:

```bash
npm test
npm run typecheck
npm run test:e2e

```

Playwright starts the Vite app on `http://127.0.0.1:4173`; the browser workflow mocks the public summary request. The API smoke suite checks read-only backend endpoints and is opt-in. Start the backend with its database and Firebase configuration, then run this in PowerShell:

```powershell
$env:RUN_API_INTEGRATION = "true"
$env:API_BASE_URL = "[http://127.0.0.1:8000](http://127.0.0.1:8000)"
npm run test:api

```

---

## 🗂️ Project Structure

* `src/` — React app source (Vite + TypeScript)
* `src/components/ui-components/` — base Chakra UI components
* `src/components/Pages/` — analytical panels and admin dashboard
* `Scraping/` — backend app, scraper logic, NLP, database helpers
* `Scraping/Routes/` — FastAPI route modules
* `Scraping/database/` — PostgreSQL access and persistence logic
* `Scraping/tests/` — Pytest suite

---

## 📄 License

This repository is intended for learning, experimentation, and personal analytics. Modify as needed for your own deployment or research use case.

```