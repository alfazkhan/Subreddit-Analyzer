import asyncio

# Database and Path configurations
DB_CONFIG = {
    "user": "postgres",
    "password": "admin123",
    "database": "reddit-scrapper",
    "host": "127.0.0.1"
}

AUTH_FILE = "auth.json"
MAX_CONCURRENT_TABS = 1
semaphore = asyncio.Semaphore(MAX_CONCURRENT_TABS)
SCRAPE_INTERVAL = 900 

# Use a set for faster membership checking
IGNORE_WORDS = {
    "i", "me", "my", "myself", "we", "us", "our", "ours", "ourselves", "you", "your", "yours", 
    "yourself", "yourselves", "he", "him", "his", "she", "her", "hers", "it", "its", "they", 
    "them", "their", "someone", "anyone", "am", "is", "are", "was", "were", "be", "been", 
    "being", "have", "has", "had", "do", "does", "did", "shall", "will", "should", "would", 
    "may", "might", "must", "can", "could", "get", "got", "getting", "go", "goes", "went", 
    "gone", "take", "took", "taken", "make", "made", "making", "like", "know", "knows", 
    "knew", "want", "wants", "wanted", "look", "looks", "really", "very", "just", "actually", 
    "basically", "literally", "even", "also", "still", "maybe", "probably", "quite", "much", 
    "many", "lot", "lots", "thing", "things", "stuff", "reddit", "subreddit", "sub", "post", 
    "posts", "comment", "comments", "thread", "edit", "deleted", "removed", "amp", "https", 
    "http", "com", "www"
}