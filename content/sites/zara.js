/**
 * CartShame - Zara-specific cart detection
 */

(function() {
  const ZARA_SELECTORS = [
    '.shop-cart-summary__total-price',
    '[data-qa="shopping-bag-total"]',
    '.cart-summary .total-price',
    '[class*="cartTotal"]',
    '.bag-total-price',
    '.shop-cart-item__price--total',
    '[class*="TotalPrice"]',
    '.order-summary__total .price',
    '[data-testid="cart-total"]'
  ];

  function detectZaraTotal() {
    for (const selector of ZARA_SELECTORS) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          const price = CartDetector.parsePrice(el.textContent);
          if (price !== null && price > 0) {
            return { element: el, price, source: 'zara-override' };
          }
        }
      } catch (e) {
        // Skip invalid selector
      }
    }
    return null;
  }

  // Register override for Zara domains
  if (window.CartDetector) {
    CartDetector.registerOverride('zara.com', detectZaraTotal);
    console.log('[CartShame] Zara override registered');
  }
})();
