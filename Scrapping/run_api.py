import os
import logging
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Routes import routes_posts, routes_subreddits, routes_reanalyze, routes_ignored_words

IS_PRODUCTION = os.getenv("APP_ENV") == "production"
API_HOST = "0.0.0.0" if IS_PRODUCTION else "192.168.0.246"

app = FastAPI(title="Reddit BI REST API Gateway", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all HTTP and WebSocket controllers
app.include_router(routes_posts.router)
app.include_router(routes_subreddits.router)
app.include_router(routes_reanalyze.router)
app.include_router(routes_ignored_words.router)

logging.basicConfig(
    level=logging.INFO, format='[%(asctime)s] API-SERVER: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S', handlers=[logging.StreamHandler(sys.stdout)], force=True
)

if __name__ == "__main__":
    logging.info(f"Launching API Server Gateway on http://{API_HOST}:8000")
    uvicorn.run(app, host=API_HOST, port=8000, log_level="info")