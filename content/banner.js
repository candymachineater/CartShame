/**
 * CartShame - Banner Injection System
 * Injects the guilt-trip banner showing work hours
 */

const CartShameBanner = {
  BANNER_ID: 'cartshame-banner',

  /**
   * Get settings from chrome storage
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get('settings', (result) => {
        resolve(result.settings || {
          hourlyRate: 50,
          showBanner: true,
          notificationsEnabled: true,
          role: 'partner'
        });
      });
    });
  },

  /**
   * Calculate hours from cart total
   */
  calculateHours(total, hourlyRate) {
    return (total / hourlyRate).toFixed(1);
  },

  /**
   * Create and inject the banner
   */
  async injectBanner(cartTotal) {
    // Remove existing banner if present
    this.removeBanner();

    const settings = await this.getSettings();
    if (!settings.showBanner) return;

    const hours = this.calculateHours(cartTotal, settings.hourlyRate);
    const siteName = CartDetector.getSiteName();

    // Dynamic messaging based on role
    const isPartner = settings.role === 'partner';
    const subject = isPartner ? 'him' : 'you';

    // Create banner element
    const banner = document.createElement('div');
    banner.id = this.BANNER_ID;
    banner.innerHTML = `
      <div class="cartshame-content">
        <span class="cartshame-icon">💸</span>
        <span class="cartshame-text">This cart costs ${subject}</span>
        <span class="cartshame-hours">${hours} hours</span>
        <span class="cartshame-text">of work!</span>
      </div>
      <button class="cartshame-close" aria-label="Close">&times;</button>
    `;

    // Add close button handler
    banner.querySelector('.cartshame-close').addEventListener('click', () => {
      this.removeBanner();
    });

    // Insert at top of body
    document.body.insertBefore(banner, document.body.firstChild);
    document.body.classList.add('cartshame-active');

    // Track this cart view
    this.trackCartView(siteName, cartTotal, parseFloat(hours));

    console.log(`[CartShame] Injected banner: $${cartTotal.toFixed(2)} = ${hours} hours @ $${settings.hourlyRate}/hr`);
  },

  /**
   * Update existing banner with new total
   */
  async updateBanner(cartTotal) {
    const banner = document.getElementById(this.BANNER_ID);
    if (!banner) {
      await this.injectBanner(cartTotal);
      return;
    }

    const settings = await this.getSettings();
    const hours = this.calculateHours(cartTotal, settings.hourlyRate);

    const hoursElement = banner.querySelector('.cartshame-hours');
    if (hoursElement) {
      hoursElement.textContent = `${hours} hours`;
      // Add pulse animation on update
      hoursElement.classList.add('cartshame-pulse');
      setTimeout(() => hoursElement.classList.remove('cartshame-pulse'), 600);
    }
  },

  /**
   * Remove the banner
   */
  removeBanner() {
    const banner = document.getElementById(this.BANNER_ID);
    if (banner) {
      banner.remove();
      document.body.classList.remove('cartshame-active');
    }
  },

  /**
   * Send cart view event to background script for tracking
   */
  trackCartView(site, value, hours) {
    try {
      chrome.runtime.sendMessage({
        type: 'CART_VIEWED',
        payload: { site, value, hours, timestamp: new Date().toISOString() }
      });
    } catch (e) {
      console.log('[CartShame] Could not send tracking message:', e.message);
    }
  },

  /**
   * Initialize the banner system
   */
  async init() {
    // Check if this is a cart page
    if (!CartDetector.isCartPage()) {
      console.log('[CartShame] Not a cart page, skipping');
      return;
    }

    console.log('[CartShame] Cart page detected, scanning for total...');

    // Try to detect cart total
    const result = CartDetector.detectCartTotal();
    if (result && result.price > 0) {
      await this.injectBanner(result.price);
    }

    // Watch for cart updates
    CartDetector.watchForChanges(async (newTotal) => {
      await this.updateBanner(newTotal);
    });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CartShameBanner.init());
} else {
  // Small delay to ensure detector.js is loaded
  setTimeout(() => CartShameBanner.init(), 100);
}

// Make globally available
window.CartShameBanner = CartShameBanner;
