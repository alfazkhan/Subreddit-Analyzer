import asyncio

#Local
DB_CONFIG = {
    "user": "postgres",
    "password": "admin123",
    "database": "reddit-scrapper",
    "host": "127.0.0.1"
}

#Prod
# DB_CONFIG = {
#     "user": "postgres",
#     "password": "admin123",
#     "database": "reddit-scrapper",
#     "host": "127.0.0.1",
#     "port": 5433 
# }

AUTH_FILE = "auth.json"
MAX_CONCURRENT_TABS = 1
semaphore = asyncio.Semaphore(MAX_CONCURRENT_TABS)
SCRAPE_INTERVAL = 300 # 15 minutes