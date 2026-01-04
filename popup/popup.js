/**
 * CartShame - Popup Script
 * Handles settings management and stats display
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadStats();
  setupEventListeners();
});

/**
 * Load settings from storage
 */
async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  const settings = result.settings || {
    hourlyRate: 50,
    showBanner: true,
    notificationsEnabled: true,
    role: 'partner'
  };

  document.getElementById('hourlyRate').value = settings.hourlyRate;
  document.getElementById('showBanner').checked = settings.showBanner;
  document.getElementById('notifications').checked = settings.notificationsEnabled;

  // Update role buttons
  updateRoleButtons(settings.role);
}

/**
 * Update role button active states
 */
function updateRoleButtons(role) {
  const partnerBtn = document.getElementById('rolePartner');
  const selfBtn = document.getElementById('roleSelf');

  if (role === 'partner') {
    partnerBtn.classList.add('active');
    selfBtn.classList.remove('active');
  } else {
    partnerBtn.classList.remove('active');
    selfBtn.classList.add('active');
  }
}

/**
 * Load and display stats
 */
async function loadStats() {
  const result = await chrome.storage.local.get(['stats', 'weekly', 'settings']);
  const stats = result.stats || { lifetimeCartValue: 0, lifetimeHoursEquivalent: 0, cartSightings: 0, sites: {} };
  const weekly = result.weekly || { totalHours: 0 };
  const settings = result.settings || { hourlyRate: 50 };

  // Update main stats
  document.getElementById('lifetimeHours').textContent = stats.lifetimeHoursEquivalent.toFixed(1);
  document.getElementById('weeklyHours').textContent = weekly.totalHours.toFixed(1);
  document.getElementById('cartSightings').textContent = stats.cartSightings;

  // Update sites breakdown
  const sitesContainer = document.getElementById('sitesBreakdown');
  sitesContainer.innerHTML = '';

  const sites = Object.entries(stats.sites || {})
    .sort((a, b) => b[1].totalValue - a[1].totalValue)
    .slice(0, 5); // Top 5 sites

  if (sites.length > 0) {
    for (const [site, data] of sites) {
      const hours = (data.totalValue / settings.hourlyRate).toFixed(1);
      const item = document.createElement('div');
      item.className = 'site-item';
      item.innerHTML = `
        <span class="site-name">${formatSiteName(site)}</span>
        <span class="site-hours">${hours}h</span>
      `;
      sitesContainer.appendChild(item);
    }
  }
}

/**
 * Format site name for display
 */
function formatSiteName(hostname) {
  // Remove common prefixes and format nicely
  return hostname
    .replace(/^www\./, '')
    .replace(/^m\./, '')
    .split('.')[0]
    .charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
}

/**
 * Get current role from button states
 */
function getCurrentRole() {
  return document.getElementById('rolePartner').classList.contains('active') ? 'partner' : 'self';
}

/**
 * Save settings to storage
 */
async function saveSettings() {
  const settings = {
    hourlyRate: parseFloat(document.getElementById('hourlyRate').value) || 50,
    showBanner: document.getElementById('showBanner').checked,
    notificationsEnabled: document.getElementById('notifications').checked,
    role: getCurrentRole()
  };

  await chrome.storage.local.set({ settings });
  console.log('[CartShame] Settings saved:', settings);
}

/**
 * Set role and save settings
 */
async function setRole(role) {
  updateRoleButtons(role);
  await saveSettings();
}

/**
 * Reset all stats
 */
async function resetStats() {
  if (confirm('Are you sure you want to reset all stats? This cannot be undone.')) {
    await chrome.storage.local.set({
      stats: {
        lifetimeCartValue: 0,
        lifetimeHoursEquivalent: 0,
        cartSightings: 0,
        sites: {}
      },
      weekly: {
        weekStartDate: new Date().toISOString(),
        carts: [],
        totalValue: 0,
        totalHours: 0
      },
      lastCart: {}
    });

    await loadStats();
    console.log('[CartShame] Stats reset');
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Role buttons
  document.getElementById('rolePartner').addEventListener('click', () => setRole('partner'));
  document.getElementById('roleSelf').addEventListener('click', () => setRole('self'));

  // Settings changes
  document.getElementById('hourlyRate').addEventListener('change', saveSettings);
  document.getElementById('showBanner').addEventListener('change', saveSettings);
  document.getElementById('notifications').addEventListener('change', saveSettings);

  // Debounce hourly rate input
  let debounceTimer;
  document.getElementById('hourlyRate').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveSettings, 500);
  });

  // Reset button
  document.getElementById('resetStats').addEventListener('click', resetStats);
}
