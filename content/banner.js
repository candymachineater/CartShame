/**
 * CartShame - Multi-Step Shame Overlay System
 * A dramatic, interactive overlay that guilt-trips shoppers through multiple steps
 */

const CartShameOverlay = {
  OVERLAY_ID: 'cartshame-overlay',

  // Current state
  currentStep: 0,
  currentHours: 0,
  currentTotal: 0,
  isPartner: true,
  settings: null,

  // Step content for Partner mode (GF/Wife - shaming "him")
  STEPS_PARTNER: [
    {
      icon: '💸',
      getTitle: (hours) => `This is going to cost your man <span class="cartshame-hours">${hours}</span> hours of work.`,
      question: 'Are you sure you want to proceed?',
      yesText: "Yes, I'm sure",
      noText: "No, I'll reconsider"
    },
    {
      icon: '😰',
      getTitle: (hours) => `He will have to work overtime to afford this.`,
      question: 'Are you okay with that?',
      yesText: 'Yes, he can handle it',
      noText: 'Maybe not...'
    },
    {
      icon: '💔',
      getTitle: (hours) => `That's <span class="cartshame-hours">${hours}</span> hours he could spend with you instead.`,
      question: 'Still worth it?',
      yesText: 'Shopping is worth it',
      noText: "You're right..."
    },
    {
      icon: '😢',
      getTitle: () => `Last chance! Think about his tired face after all that overtime...`,
      question: '',
      yesText: "I don't care, I want it!",
      noText: "Fine, I'll remove some items"
    }
  ],

  // Step content for Self mode (shaming yourself)
  STEPS_SELF: [
    {
      icon: '💸',
      getTitle: (hours) => `This is going to cost you <span class="cartshame-hours">${hours}</span> hours of your life.`,
      question: 'Are you sure you want to proceed?',
      yesText: "Yes, I'm sure",
      noText: "No, I'll reconsider"
    },
    {
      icon: '😰',
      getTitle: (hours) => `You'll have to work overtime to afford this.`,
      question: 'Is it really worth it?',
      yesText: 'Yes, I deserve it',
      noText: 'Maybe not...'
    },
    {
      icon: '💔',
      getTitle: (hours) => `That's <span class="cartshame-hours">${hours}</span> hours you could spend doing literally anything else.`,
      question: 'Still want it?',
      yesText: 'Shopping is self-care',
      noText: "You're right..."
    },
    {
      icon: '😢',
      getTitle: () => `Last chance! Think about your bank account crying...`,
      question: '',
      yesText: "I don't care, I want it!",
      noText: "Fine, I'll remove some items"
    }
  ],

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
   * Get current step content based on role
   */
  getSteps() {
    return this.isPartner ? this.STEPS_PARTNER : this.STEPS_SELF;
  },

  /**
   * Render the overlay with current step
   */
  renderOverlay() {
    const steps = this.getSteps();
    const step = steps[this.currentStep];

    const overlay = document.createElement('div');
    overlay.id = this.OVERLAY_ID;
    overlay.innerHTML = `
      <div class="cartshame-backdrop"></div>
      <div class="cartshame-modal">
        <div class="cartshame-step">
          <span class="cartshame-emoji">${step.icon}</span>
          <h1 class="cartshame-title">${step.getTitle(this.currentHours)}</h1>
          ${step.question ? `<p class="cartshame-question">${step.question}</p>` : ''}
          <div class="cartshame-buttons">
            <button class="cartshame-btn yes">${step.yesText}</button>
            <button class="cartshame-btn no">${step.noText}</button>
          </div>
          <div class="cartshame-dots">
            ${steps.map((_, i) => `<span class="cartshame-dot ${i < this.currentStep ? 'completed' : ''} ${i === this.currentStep ? 'active' : ''}"></span>`).join('')}
          </div>
        </div>
      </div>
    `;

    // Add button handlers
    overlay.querySelector('.cartshame-btn.yes').addEventListener('click', () => this.handleYes());
    overlay.querySelector('.cartshame-btn.no').addEventListener('click', () => this.handleNo());

    // Click backdrop to close (optional)
    overlay.querySelector('.cartshame-backdrop').addEventListener('click', () => this.closeOverlay());

    document.body.appendChild(overlay);
  },

  /**
   * Update the step content without re-rendering entire overlay
   */
  updateStep() {
    const overlay = document.getElementById(this.OVERLAY_ID);
    if (!overlay) return;

    const steps = this.getSteps();
    const step = steps[this.currentStep];
    const modal = overlay.querySelector('.cartshame-modal');

    // Create new step content
    const stepEl = document.createElement('div');
    stepEl.className = 'cartshame-step';
    stepEl.innerHTML = `
      <span class="cartshame-emoji">${step.icon}</span>
      <h1 class="cartshame-title">${step.getTitle(this.currentHours)}</h1>
      ${step.question ? `<p class="cartshame-question">${step.question}</p>` : ''}
      <div class="cartshame-buttons">
        <button class="cartshame-btn yes">${step.yesText}</button>
        <button class="cartshame-btn no">${step.noText}</button>
      </div>
      <div class="cartshame-dots">
        ${steps.map((_, i) => `<span class="cartshame-dot ${i < this.currentStep ? 'completed' : ''} ${i === this.currentStep ? 'active' : ''}"></span>`).join('')}
      </div>
    `;

    // Add button handlers
    stepEl.querySelector('.cartshame-btn.yes').addEventListener('click', () => this.handleYes());
    stepEl.querySelector('.cartshame-btn.no').addEventListener('click', () => this.handleNo());

    // Replace old step with new
    const oldStep = modal.querySelector('.cartshame-step');
    modal.replaceChild(stepEl, oldStep);
  },

  /**
   * Handle Yes button click - advance to next step
   */
  handleYes() {
    const steps = this.getSteps();
    if (this.currentStep < steps.length - 1) {
      this.currentStep++;
      this.updateStep();
    } else {
      // Last step - she's committed! Close the overlay
      this.closeOverlay();
    }
  },

  /**
   * Handle No button click - close overlay
   */
  handleNo() {
    this.closeOverlay();
  },

  /**
   * Close the overlay with animation
   */
  closeOverlay() {
    const overlay = document.getElementById(this.OVERLAY_ID);
    if (!overlay) return;

    overlay.classList.add('closing');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  },

  /**
   * Update hours display when cart changes (live tracking)
   */
  updateHoursDisplay(newTotal) {
    this.currentTotal = newTotal;
    this.currentHours = this.calculateHours(newTotal, this.settings.hourlyRate);

    const hoursEls = document.querySelectorAll('.cartshame-hours');
    hoursEls.forEach(el => {
      el.textContent = this.currentHours;
      el.classList.add('pulse');
      setTimeout(() => el.classList.remove('pulse'), 600);
    });

    // Update the title with new hours
    const titleEl = document.querySelector('.cartshame-title');
    if (titleEl) {
      const steps = this.getSteps();
      const step = steps[this.currentStep];
      titleEl.innerHTML = step.getTitle(this.currentHours);
    }
  },

  /**
   * Show the overlay
   */
  async showOverlay(cartTotal) {
    // Remove existing overlay if present
    const existing = document.getElementById(this.OVERLAY_ID);
    if (existing) existing.remove();

    this.settings = await this.getSettings();
    if (!this.settings.showBanner) return;

    this.currentTotal = cartTotal;
    this.currentHours = this.calculateHours(cartTotal, this.settings.hourlyRate);
    this.isPartner = this.settings.role === 'partner';
    this.currentStep = 0;

    this.renderOverlay();

    // Track this cart view
    this.trackCartView(CartDetector.getSiteName(), cartTotal, parseFloat(this.currentHours));

    console.log(`[CartShame] Showing overlay: $${cartTotal.toFixed(2)} = ${this.currentHours} hours @ $${this.settings.hourlyRate}/hr`);
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
   * Initialize the overlay system
   */
  async init() {
    // Check if this is a cart page
    if (!CartDetector.isCartPage()) {
      console.log('[CartShame] Not a cart page, skipping');
      return;
    }

    console.log('[CartShame] Cart page detected, scanning for total...');

    // Get settings
    this.settings = await this.getSettings();

    // Try to detect cart total
    const result = CartDetector.detectCartTotal();
    if (result && result.price > 0) {
      await this.showOverlay(result.price);
    }

    // Watch for cart updates (live tracking)
    CartDetector.watchForChanges(async (newTotal) => {
      const overlay = document.getElementById(this.OVERLAY_ID);
      if (overlay) {
        // Update existing overlay with new total
        this.updateHoursDisplay(newTotal);
      } else {
        // Show new overlay if closed
        await this.showOverlay(newTotal);
      }
    });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CartShameOverlay.init());
} else {
  // Small delay to ensure detector.js is loaded
  setTimeout(() => CartShameOverlay.init(), 100);
}

// Make globally available
window.CartShameOverlay = CartShameOverlay;

// Keep old name for backwards compatibility
window.CartShameBanner = CartShameOverlay;
