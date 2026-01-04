/**
 * CartShame - Background Service Worker
 * Handles storage, weekly reports, and message passing
 */

const WEEKLY_ALARM_NAME = 'cartshame-weekly-report';
const WEEK_IN_MINUTES = 60 * 24 * 7; // 10080 minutes

// Default settings
const DEFAULT_SETTINGS = {
  hourlyRate: 50,
  showBanner: true,
  notificationsEnabled: true
};

// Default stats
const DEFAULT_STATS = {
  lifetimeCartValue: 0,
  lifetimeHoursEquivalent: 0,
  cartSightings: 0,
  sites: {}
};

// Default weekly tracking
const DEFAULT_WEEKLY = {
  weekStartDate: new Date().toISOString(),
  carts: [],
  totalValue: 0,
  totalHours: 0
};

/**
 * Initialize storage with defaults on install
 */
async function initializeStorage() {
  const result = await chrome.storage.local.get(['settings', 'stats', 'weekly']);

  if (!result.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    console.log('[CartShame] Initialized default settings');
  }

  if (!result.stats) {
    await chrome.storage.local.set({ stats: DEFAULT_STATS });
    console.log('[CartShame] Initialized default stats');
  }

  if (!result.weekly) {
    await chrome.storage.local.set({ weekly: DEFAULT_WEEKLY });
    console.log('[CartShame] Initialized weekly tracking');
  }
}

/**
 * Schedule the weekly report alarm
 */
async function scheduleWeeklyReport() {
  const existingAlarm = await chrome.alarms.get(WEEKLY_ALARM_NAME);

  if (!existingAlarm) {
    // Schedule for next Sunday at 10am local time
    const now = new Date();
    const nextSunday = new Date(now);
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(10, 0, 0, 0);

    chrome.alarms.create(WEEKLY_ALARM_NAME, {
      when: nextSunday.getTime(),
      periodInMinutes: WEEK_IN_MINUTES
    });

    console.log('[CartShame] Weekly report scheduled for:', nextSunday.toLocaleString());
  }
}

/**
 * Generate and show the weekly report
 */
async function generateWeeklyReport() {
  const result = await chrome.storage.local.get(['weekly', 'settings']);
  const weekly = result.weekly || DEFAULT_WEEKLY;
  const settings = result.settings || DEFAULT_SETTINGS;

  if (settings.notificationsEnabled && weekly.totalHours > 0) {
    const formattedValue = formatCurrency(weekly.totalValue);

    // Create notification
    chrome.notifications.create('weekly-report', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'CartShame Weekly Report',
      message: `This week, you almost spent ${weekly.totalHours.toFixed(1)} hours of work (${formattedValue}) browsing shopping carts! Abandoned carts up 340%.`,
      priority: 2
    });

    console.log('[CartShame] Weekly report generated:', weekly);
  }

  // Reset weekly stats for next week
  await chrome.storage.local.set({
    weekly: {
      weekStartDate: new Date().toISOString(),
      carts: [],
      totalValue: 0,
      totalHours: 0
    }
  });
}

/**
 * Handle cart view events from content scripts
 */
async function handleCartViewed({ site, value, hours, timestamp }) {
  const result = await chrome.storage.local.get(['stats', 'weekly', 'lastCart']);

  // Debounce: don't count if same site within 5 minutes
  const lastCart = result.lastCart || {};
  const lastTimestamp = lastCart[site];
  if (lastTimestamp) {
    const elapsed = Date.now() - new Date(lastTimestamp).getTime();
    if (elapsed < 5 * 60 * 1000) {
      console.log('[CartShame] Debounced cart view for', site);
      return;
    }
  }

  // Update last cart timestamp
  await chrome.storage.local.set({
    lastCart: { ...lastCart, [site]: timestamp }
  });

  // Update lifetime stats
  const stats = result.stats || DEFAULT_STATS;
  stats.lifetimeCartValue += value;
  stats.lifetimeHoursEquivalent += hours;
  stats.cartSightings += 1;

  // Update site-specific stats
  if (!stats.sites[site]) {
    stats.sites[site] = { totalValue: 0, visits: 0, lastSeen: null };
  }
  stats.sites[site].totalValue += value;
  stats.sites[site].visits += 1;
  stats.sites[site].lastSeen = timestamp;

  // Update weekly tracking
  const weekly = result.weekly || DEFAULT_WEEKLY;
  weekly.carts.push({ site, value, hours, timestamp });
  weekly.totalValue += value;
  weekly.totalHours += hours;

  await chrome.storage.local.set({ stats, weekly });

  console.log('[CartShame] Tracked cart view:', { site, value, hours });
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// ============================================
// Event Listeners
// ============================================

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[CartShame] Extension installed/updated:', details.reason);
  await initializeStorage();
  await scheduleWeeklyReport();
});

// Re-initialize alarms on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('[CartShame] Extension started');
  await scheduleWeeklyReport();
});

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === WEEKLY_ALARM_NAME) {
    console.log('[CartShame] Weekly report alarm triggered');
    await generateWeeklyReport();
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CART_VIEWED') {
    handleCartViewed(message.payload);
    sendResponse({ success: true });
  } else if (message.type === 'GET_STATS') {
    chrome.storage.local.get(['stats', 'weekly'], (result) => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  } else if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get('settings', (result) => {
      sendResponse(result.settings || DEFAULT_SETTINGS);
    });
    return true;
  }
});

console.log('[CartShame] Service worker loaded');
