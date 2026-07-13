// Constants.js

export const BASE_URL = import.meta.env.PROD
  ? "https://api.theonlyalfaz.com"
  : "http://127.0.0.1:8000";

export const wsUrl = import.meta.env.PROD
  ? "wss://api.theonlyalfaz.com/ws/reanalyze"
  : "ws://127.0.0.1:8000/ws/reanalyze";