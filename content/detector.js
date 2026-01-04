/**
 * CartShame - Universal Cart Detection Engine
 * Detects shopping cart pages and extracts totals from any e-commerce site
 */

const CartDetector = {
  // URL patterns that indicate a cart page
  CART_URL_PATTERNS: [
    '/cart',
    '/basket',
    '/bag',
    '/shopping-bag',
    '/shopping-cart',
    '/checkout',
    '/viewcart',
    '/shoppingcart',
    '/mycart',
    '/your-cart'
  ],

  // Selectors to find cart totals (ordered by specificity)
  TOTAL_SELECTORS: [
    // Data attributes (most reliable)
    '[data-testid*="total" i]',
    '[data-qa*="total" i]',
    '[data-test*="total" i]',
    '[data-automation*="total" i]',

    // ID patterns
    '[id*="cart"][id*="total" i]',
    '[id*="order"][id*="total" i]',
    '[id*="subtotal" i]',
    '[id*="grand-total" i]',
    '[id*="cart-total" i]',
    '[id*="checkout-total" i]',

    // Class patterns
    '[class*="cart-total" i]',
    '[class*="order-total" i]',
    '[class*="grand-total" i]',
    '[class*="subtotal" i]',
    '[class*="summary-total" i]',
    '[class*="checkout-total" i]',
    '[class*="bag-total" i]',
    '[class*="basket-total" i]',

    // Common semantic selectors
    '.cart-summary .total',
    '.order-summary .total',
    '.cart-totals .amount',
    '.summary-row.total',
    '.price-total',
    '.total-price'
  ],

  // Site-specific overrides (loaded dynamically)
  siteOverrides: {},

  /**
   * Check if current page is a cart page
   */
  isCartPage() {
    const url = window.location.href.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    // Check URL patterns
    for (const pattern of this.CART_URL_PATTERNS) {
      if (path.includes(pattern) || url.includes(pattern)) {
        return true;
      }
    }

    // Check page title
    const title = document.title.toLowerCase();
    if (title.includes('cart') || title.includes('basket') || title.includes('bag') || title.includes('checkout')) {
      return true;
    }

    // Check for cart-related meta tags or structured data
    const ldJsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of ldJsonScripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'CheckoutPage' || data['@type'] === 'ShoppingCart') {
          return true;
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    return false;
  },

  /**
   * Get the current site's hostname for tracking
   */
  getSiteName() {
    return window.location.hostname.replace('www.', '');
  },

  /**
   * Check if we have a site-specific override
   */
  hasSiteOverride() {
    const hostname = this.getSiteName();
    return this.siteOverrides[hostname] !== undefined;
  },

  /**
   * Extract price from text, handling various currency formats
   */
  parsePrice(text) {
    if (!text) return null;

    // Remove common currency symbols and words
    let cleaned = text
      .replace(/[A-Za-z$€£¥₹₽฿]/g, '')
      .replace(/,/g, '')
      .trim();

    // Extract number with optional decimals
    const match = cleaned.match(/(\d+\.?\d*)/);
    if (match) {
      const price = parseFloat(match[1]);
      // Sanity check: price should be reasonable (between $0.01 and $1,000,000)
      if (price >= 0.01 && price <= 1000000) {
        return price;
      }
    }

    return null;
  },

  /**
   * Find elements containing "total" text and adjacent prices
   */
  findTotalByTextProximity() {
    const totalKeywords = ['total', 'subtotal', 'grand total', 'order total', 'cart total'];

    // Find all text nodes containing "total"
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent.toLowerCase().trim();
          if (totalKeywords.some(keyword => text.includes(keyword))) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    const candidates = [];
    let node;
    while (node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent) continue;

      // Look for price in sibling elements or parent's children
      const container = parent.closest('div, span, li, tr, p') || parent;
      const priceElements = container.querySelectorAll('span, div, strong, b, [class*="price"], [class*="amount"]');

      for (const el of priceElements) {
        const price = this.parsePrice(el.textContent);
        if (price !== null && price > 0) {
          candidates.push({ element: el, price, text: el.textContent });
        }
      }
    }

    // Return the highest reasonable price found
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.price - a.price);
      return candidates[0];
    }

    return null;
  },

  /**
   * Try to extract cart total using selectors
   */
  findTotalBySelectors() {
    for (const selector of this.TOTAL_SELECTORS) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const price = this.parsePrice(el.textContent);
          if (price !== null && price > 0) {
            return { element: el, price, selector };
          }
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }
    return null;
  },

  /**
   * Main detection function - returns cart total or null
   */
  detectCartTotal() {
    // Check if site has custom override
    const hostname = this.getSiteName();
    if (this.siteOverrides[hostname]) {
      const result = this.siteOverrides[hostname].detect();
      if (result) return result;
    }

    // Try selector-based detection first
    const selectorResult = this.findTotalBySelectors();
    if (selectorResult) {
      console.log('[CartShame] Found total via selector:', selectorResult.selector, selectorResult.price);
      return selectorResult;
    }

    // Fall back to text proximity detection
    const textResult = this.findTotalByTextProximity();
    if (textResult) {
      console.log('[CartShame] Found total via text proximity:', textResult.price);
      return textResult;
    }

    console.log('[CartShame] No cart total found on this page');
    return null;
  },

  /**
   * Register a site-specific override
   */
  registerOverride(hostname, detectFn) {
    this.siteOverrides[hostname] = { detect: detectFn };
  },

  /**
   * Set up mutation observer to watch for cart changes
   */
  watchForChanges(callback) {
    const observer = new MutationObserver(() => {
      // Debounce rapid changes
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }
      this._debounceTimer = setTimeout(() => {
        const result = this.detectCartTotal();
        if (result) {
          callback(result.price);
        }
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return observer;
  }
};

// Make globally available
window.CartDetector = CartDetector;
