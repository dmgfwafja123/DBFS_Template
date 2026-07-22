// routes/authRoutes.js
const express = require("express");
const paypalService = require("../services/paypalService");

const router = express.Router();

// GET /api/auth/paypal/login
// Login.jsx does window.location.href = "/api/auth/paypal/login"
// We just redirect on to PayPal's own hosted login/consent screen.
router.get("/paypal/login", (req, res) => {
  const authorizeUrl = paypalService.buildAuthorizeUrl();
  res.redirect(authorizeUrl);
});

// GET /api/auth/paypal/callback
// PAYPAL_REDIRECT_URI in .env must point here. After PayPal redirects back with
// ?code=..., we exchange it for the user's profile, then bounce the browser to
// the frontend's /auth/success page with the profile in the query string -
// exactly what AuthSuccess.jsx already expects.
router.get("/paypal/callback", async (req, res) => {
  const { code, error } = req.query;
  const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";

  if (error || !code) {
    return res.redirect(`${frontendBase}/login`);
  }

  try {
    const { name, email } = await paypalService.completeLogin(code);
    const params = new URLSearchParams({
      paypal_name: name || "",
      paypal_email: email || "",
    });
    res.redirect(`${frontendBase}/auth/success?${params.toString()}`);
  } catch (err) {
    console.error("PayPal login failed:", err.message);
    res.redirect(`${frontendBase}/login`);
  }
});

module.exports = router;