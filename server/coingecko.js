import fetch from "node-fetch";

const API_BASE = "https://api.coingecko.com/api/v3";

async function fetchFromCoinGecko(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Error fetching from CoinGecko:", err.message);
    return null;
  }
}

export async function getCoinPrices() {
  return await fetchFromCoinGecko(
    "/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
  );
}

export async function getMarketTrends() {
  return await fetchFromCoinGecko("/search/trending");
}
