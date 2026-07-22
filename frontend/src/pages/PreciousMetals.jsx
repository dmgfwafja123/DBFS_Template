import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import PageHeader from "../components/PageHeader";
import { getUser } from "../utils/auth";
import { getMetalPrices, buyMetal } from "../utils/api";

const METAL_ICONS = {
  gold: "🥇",
  silver: "🥈",
  platinum: "⚪",
};

export default function PreciousMetals() {
  const user = getUser();

  const [prices, setPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [priceError, setPriceError] = useState(null);

  const [selectedMetal, setSelectedMetal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState(null);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    loadPrices();
  }, []);

  async function loadPrices() {
    setLoadingPrices(true);
    setPriceError(null);
    try {
      const data = await getMetalPrices();
      setPrices(data);
    } catch (err) {
      setPriceError(err.message);
    } finally {
      setLoadingPrices(false);
    }
  }

  function openBuyModal(metal) {
    setSelectedMetal(metal);
    setQuantity(1);
    setBuyError(null);
    setReceipt(null);
  }

  function closeBuyModal() {
    setSelectedMetal(null);
  }

  async function handleConfirmBuy(e) {
    e.preventDefault();
    if (!selectedMetal) return;

    setBuying(true);
    setBuyError(null);
    try {
      const result = await buyMetal({ metal: selectedMetal.id, quantityOz: quantity });
      setReceipt(result);
    } catch (err) {
      setBuyError(err.message);
    } finally {
      setBuying(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Investments"
        title="Precious Metals"
        description="Buy Platinum, Gold, and Silver, priced live and settled in SGD via PayPal."
      />

      {priceError && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--down)" }}>
          {priceError}{" "}
          <button className="btn btn-primary" onClick={loadPrices} style={{ marginLeft: "0.75rem" }}>
            Retry
          </button>
        </div>
      )}

      {prices?.mocked && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--ink-soft)", fontSize: "0.9rem" }}>
          Showing sample prices - add a METALS_API_KEY on the backend for live rates.
        </div>
      )}

      {loadingPrices ? (
        <p>Loading prices...</p>
      ) : (
        <div className="metal-grid">
          {prices?.metals.map((metal) => (
            <div className="card metal-card" key={metal.id}>
              <div className="metal-card-header">
                <span className="metal-icon">{METAL_ICONS[metal.id]}</span>
                <h3>{metal.name}</h3>
              </div>

              <div className="metal-price">
                SGD {metal.pricePerOunceSgd.toLocaleString()}
                <span className="metal-price-unit"> / oz</span>
              </div>
              <div className="metal-price-sub">USD {metal.pricePerOunceUsd.toLocaleString()} / oz</div>

              <button className="btn btn-primary btn-block" onClick={() => openBuyModal(metal)}>
                Buy {metal.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedMetal && (
        <div className="modal-overlay" onClick={closeBuyModal}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            {!receipt ? (
              <>
                <h3>Buy {selectedMetal.name}</h3>
                <p style={{ color: "var(--ink-soft)" }}>
                  {selectedMetal.pricePerOunceSgd.toLocaleString()} SGD per troy ounce
                </p>

                <form onSubmit={handleConfirmBuy}>
                  <div className="field">
                    <label htmlFor="quantity">Quantity (oz)</label>
                    <input
                      id="quantity"
                      className="input"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="buyerEmail">Paying with PayPal account</label>
                    <input
                      id="buyerEmail"
                      className="input"
                      type="email"
                      value={user?.email || ""}
                      disabled
                    />
                  </div>

                  <p className="metal-total">
                    Total: SGD {(selectedMetal.pricePerOunceSgd * quantity).toFixed(2)}
                  </p>

                  {buyError && <p style={{ color: "var(--down)" }}>{buyError}</p>}

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button type="button" className="btn btn-danger" onClick={closeBuyModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-block" disabled={buying}>
                      {buying ? "Processing with PayPal..." : "Confirm & Pay"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3>Purchase Complete</h3>
                <p className="status-badge">{receipt.status}</p>
                <p>
                  Bought {receipt.quantityOz} oz of {receipt.metal} for SGD{" "}
                  {receipt.totalSgd.toFixed(2)}.
                </p>
                <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
                  PayPal order ID: {receipt.orderId}
                  {receipt.mocked && " (simulated - add PayPal sandbox keys for real orders)"}
                </p>
                <button className="btn btn-primary btn-block" onClick={closeBuyModal}>
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}