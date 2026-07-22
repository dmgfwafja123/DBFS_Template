// services/metalsService.js
//
// Wraps the data-provider API call for precious metals pricing:
//   GET https://api.metalpriceapi.com/v1/latest  -> live XAU/XAG/XPT rates vs USD
//
// Converts USD -> SGD using the fixed rate the assignment brief permits (1.275),
// so no second FX API call is required. Swap FIXED_USD_SGD_RATE for a live FX
// API call later if you want an extra unique API URI for bonus marks.
//
// MOCK MODE: if METALS_API_KEY isn't set, returns realistic static sample prices
// instead of failing, so the page is demoable without a registered API key.

const METALS_API_BASE = "https://api.metalpriceapi.com/v1";
const FIXED_USD_SGD_RATE = 1.275;

const METAL_SYMBOLS = {
  gold: "XAU",
  silver: "XAG",
  platinum: "XPT",
};

const MOCK_USD_PER_OUNCE = {
  gold: 2385.4,
  silver: 28.65,
  platinum: 968.2,
};

function apiKeyConfigured() {
  return Boolean(process.env.METALS_API_KEY);
}

async function getLatestPricesSgd() {
  if (!apiKeyConfigured()) {
    return buildResponse(MOCK_USD_PER_OUNCE, { mocked: true });
  }

  const symbols = Object.values(METAL_SYMBOLS).join(",");
  const url = `${METALS_API_BASE}/latest?api_key=${process.env.METALS_API_KEY}&base=USD&currencies=${symbols}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Metals API request failed (${res.status})`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error?.info || "Metals API returned an error");
  }

  // metalpriceapi returns rates as "1 USD = X <metal>" (a small fraction),
  // so USD-per-ounce is the reciprocal.
  const usdPerOunce = {
    gold: 1 / data.rates[METAL_SYMBOLS.gold],
    silver: 1 / data.rates[METAL_SYMBOLS.silver],
    platinum: 1 / data.rates[METAL_SYMBOLS.platinum],
  };

  return buildResponse(usdPerOunce, { mocked: false, fetchedAt: data.timestamp });
}

function buildResponse(usdPerOunce, meta) {
  const metals = Object.entries(usdPerOunce).map(([key, usdPrice]) => ({
    id: key,
    symbol: METAL_SYMBOLS[key],
    name: key.charAt(0).toUpperCase() + key.slice(1),
    pricePerOunceUsd: round2(usdPrice),
    pricePerOunceSgd: round2(usdPrice * FIXED_USD_SGD_RATE),
  }));

  return {
    fxRateUsdToSgd: FIXED_USD_SGD_RATE,
    metals,
    ...meta,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { getLatestPricesSgd, apiKeyConfigured, METAL_SYMBOLS };