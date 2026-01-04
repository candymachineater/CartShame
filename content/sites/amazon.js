/**
 * CartShame - Amazon-specific cart detection
 */

(function() {
  const AMAZON_SELECTORS = [
    '#sc-subtotal-amount-activecart',
    '#sc-subtotal-amount-buybox',
    '.sc-price-sign + .sc-price',
    '[data-name="Active Cart Subtotal"] .sc-price',
    '.sc-subtotal-activecart .sc-price',
    '#subtotals-marketplace-table .sc-price',
    '#sc-buy-box-ptc-button ~ .sc-price'
  ];

  function detectAmazonTotal() {
    for (const selector of AMAZON_SELECTORS) {
      try {
        const el = document.querySelector(selector);
        if (el) {
          const price = CartDetector.parsePrice(el.textContent);
          if (price !== null && price > 0) {
            return { element: el, price, source: 'amazon-override' };
          }
        }
      } catch (e) {
        // Skip invalid selector
      }
    }
    return null;
  }

  // Register override for Amazon domains
  if (window.CartDetector) {
    CartDetector.registerOverride('amazon.com', detectAmazonTotal);
    CartDetector.registerOverride('amazon.co.uk', detectAmazonTotal);
    CartDetector.registerOverride('amazon.ca', detectAmazonTotal);
    CartDetector.registerOverride('amazon.de', detectAmazonTotal);
    CartDetector.registerOverride('amazon.fr', detectAmazonTotal);
    CartDetector.registerOverride('amazon.es', detectAmazonTotal);
    CartDetector.registerOverride('amazon.it', detectAmazonTotal);
    CartDetector.registerOverride('amazon.co.jp', detectAmazonTotal);
    CartDetector.registerOverride('amazon.in', detectAmazonTotal);
    CartDetector.registerOverride('amazon.com.au', detectAmazonTotal);
    console.log('[CartShame] Amazon override registered');
  }
})();
