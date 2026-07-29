// Constants.js

export const BASE_URL = import.meta.env.PROD
  ? "https://api.theonlyalfaz.com"
  : "http://localhost:8050";

export const wsUrl = import.meta.env.PROD
  ? "wss://api.theonlyalfaz.com/ws/reanalyze"
  : "ws://localhost:8050/ws/reanalyze";