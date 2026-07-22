// routes/paymentRoutes.js
const express = require("express");
const paypalService = require("../services/paypalService");
const metalsService = require("../services/metalsService");

const router = express.Router();

const ALLOWED_METALS = ["gold", "silver", "platinum"];

// POST /api/precious-metals/buy
// body: { metal: "gold" | "silver" | "platinum", quantityOz: number }
//
// Re-fetches the current price server-side (never trust a price the client sends),
// then creates + captures a PayPal order for that amount. Per the brief, we don't
// need to persist trade history - just prove the end-to-end API call chain.
router.post("/buy", async (req, res) => {
  const { metal, quantityOz } = req.body || {};

  if (!ALLOWED_METALS.includes(metal)) {
    return res.status(400).json({ error: `metal must be one of: ${ALLOWED_METALS.join(", ")}` });
  }
  const qty = Number(quantityOz);
  if (!qty || qty <= 0) {
    return res.status(400).json({ error: "quantityOz must be a positive number" });
  }

  try {
    const priceData = await metalsService.getLatestPricesSgd();
    const selected = priceData.metals.find((m) => m.id === metal);
    if (!selected) {
      return res.status(502).json({ error: "Price unavailable for that metal right now." });
    }

    const amountSgd = Math.round(selected.pricePerOunceSgd * qty * 100) / 100;

    const order = await paypalService.createAndCaptureOrder({
      amountSgd,
      description: `${qty} oz ${selected.name} @ SGD ${selected.pricePerOunceSgd}/oz`,
    });

    res.json({
      orderId: order.id,
      status: order.status,
      metal: selected.name,
      quantityOz: qty,
      pricePerOunceSgd: selected.pricePerOunceSgd,
      totalSgd: amountSgd,
      mocked: order.mocked,
    });
  } catch (err) {
    console.error("Buy request failed:", err.message);
    res.status(502).json({ error: "The purchase could not be completed. Please try again." });
  }
});

module.exports = router;