export const BASE_URL = import.meta.env.PROD
  ? "https://api.theonlyalfaz.com"
  : "http://192.168.0.246:8000";

export const wsUrl = import.meta.env.PROD
  ? "wss://api.theonlyalfaz.com/ws/reanalyze"
  : "ws://192.168.0.246:8000/ws/reanalyze";
