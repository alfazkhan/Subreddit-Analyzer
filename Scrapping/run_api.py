import os
import logging
import sys
import uvicorn
import firebase_admin
from firebase_admin import credentials
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Domain-specific decouple routing modules assignments
from Routes import routes_posts, routes_subreddits, routes_reanalyze, routes_ignored_words, routes_users, routes_reanalyze

IS_PRODUCTION = os.getenv("APP_ENV") == "production"
API_HOST = "0.0.0.0" if IS_PRODUCTION else "192.168.0.246"

# Initialize Firebase Admin SDK prior to spinning up network dependencies
if os.path.exists("firebase_creds.json"):
    cred = credentials.Certificate("firebase_creds.json")
    firebase_admin.initialize_app(cred)
else:
    raise RuntimeError("Critical Failure: Missing firebase_creds.json administrative credential files container.")

app = FastAPI(title="Subreddit Scrapper REST API Gateway", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all underlying platform controllers
app.include_router(routes_posts.router)
app.include_router(routes_subreddits.router)
app.include_router(routes_reanalyze.router)
app.include_router(routes_ignored_words.router)
app.include_router(routes_users.router) 
app.include_router(routes_reanalyze.router)

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