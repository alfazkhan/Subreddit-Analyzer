import os
import logging
import sys
import uvicorn
import firebase_admin
from firebase_admin import credentials
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Domain-specific decoupled routing module assignments
from Routes import (
    routes_posts,
    routes_subreddits,
    routes_reanalyze,
    routes_ignored_words,
    routes_users,
    routes_kpis,
    routes_queue
)

IS_PRODUCTION = os.getenv("APP_ENV") == "production"
API_HOST = os.getenv("API_HOST", "0.0.0.0")
os.environ.setdefault("FORCE_CPU", "1")

# Initialize Firebase Admin SDK prior to spinning up network dependencies
if os.path.exists("firebase_creds.json"):
    cred = credentials.Certificate("firebase_creds.json")
    firebase_admin.initialize_app(cred)
else:
    raise RuntimeError("Critical Failure: Missing firebase_creds.json administrative credential files container.")

app = FastAPI(title="Subreddit Scraper REST API Gateway", version="3.0.0")


# Explicit permitted origins for CORS configuration (extendable via CORS_ALLOWED_ORIGINS)
allowed_origins = [
    "https://subanalyzer.theonlyalfaz.com",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4173",
    "http://127.0.0.1:5173",
]
extra_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
allowed_origins.extend(origin for origin in extra_origins if origin not in allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length"],
)

# Mount all underlying platform controllers
app.include_router(routes_posts.router)
app.include_router(routes_subreddits.router)
app.include_router(routes_reanalyze.router)
app.include_router(routes_ignored_words.router)
app.include_router(routes_users.router)
app.include_router(routes_kpis.router)
app.include_router(routes_queue.router)

logging.basicConfig(
    level=logging.INFO, 
    format='[%(asctime)s] API-SERVER: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S', 
    handlers=[logging.StreamHandler(sys.stdout)], 
    force=True
)

if __name__ == "__main__":
    logging.info(f"Launching API Server Gateway on http://{API_HOST}:8000")
    uvicorn.run(app, host=API_HOST, port=8000, log_level="info")