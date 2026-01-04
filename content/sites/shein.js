/**
 * CartShame - Shein-specific cart detection
 */

(function() {
  const SHEIN_SELECTORS = [
    '.summary-total .total-price',
    '.cart-summary__total-value',
    '[class*="totalPrice"]',
    '.checkout-summary .price-total',
    '.j-cart-total',
    '.cart-drawer__total-price',
    '[class*="CartTotal"]',
    '.bag-total .price',
    '[data-testid="cart-total"]'
  ];

  function detectSheinTotal() {
    for (const selector of SHEIN_SELECTORS) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          const price = CartDetector.parsePrice(el.textContent);
          if (price !== null && price > 0) {
            return { element: el, price, source: 'shein-override' };
          }
        }
      } catch (e) {
        // Skip invalid selector
      }
    }
    return null;
  }

  // Register override for Shein domains
  if (window.CartDetector) {
    CartDetector.registerOverride('shein.com', detectSheinTotal);
    CartDetector.registerOverride('us.shein.com', detectSheinTotal);
    CartDetector.registerOverride('uk.shein.com', detectSheinTotal);
    CartDetector.registerOverride('m.shein.com', detectSheinTotal);
    CartDetector.registerOverride('shein.co.uk', detectSheinTotal);
    console.log('[CartShame] Shein override registered');
  }
})();
