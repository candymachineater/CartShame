# CartShame 💸

**A Chrome extension that shows your partner how many hours you'd have to work to afford everything in their cart.**

Sometimes she adds stuff at 2am while I'm asleep, so I built an extension that pulls cart totals from any shopping site, divides by my hourly rate, and injects a little banner that says **"this costs him 47 hours."**

The guilt is working. Abandoned carts up 340%.

![CartShame Banner](https://via.placeholder.com/800x200/dc3545/ffffff?text=This+cart+costs+him+47+hours!)

## Features

- **Universal cart detection** - Works on any shopping site (Amazon, Shein, Zara, Target, and thousands more)
- **Real-time updates** - Banner updates as items are added/removed
- **Lifetime tracking** - See total hours "almost spent" across all sites
- **Weekly reports** - Get notified every Sunday with guilt stats
- **Configurable hourly rate** - Set your actual rate for accurate shame

## Installation

1. Download or clone this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the CartShame folder
5. Done! Visit any shopping cart to see it in action

## Usage

1. **Set your hourly rate** - Click the extension icon and enter your rate (default: $50/hr)
2. **Visit a shopping cart** - The banner appears automatically on cart pages
3. **Watch the guilt** - See lifetime stats in the popup
4. **Get weekly reports** - Optional notifications summarizing the week's "almost spent" hours

## How It Works

CartShame uses a **universal cart detection engine** that:

1. Detects cart pages via URL patterns (`/cart`, `/basket`, `/bag`, `/checkout`)
2. Scans for total prices using smart DOM selectors
3. Falls back to text proximity detection (finds "Total" near prices)
4. Has site-specific overrides for major retailers

No data is sent anywhere. Everything stays in your browser.

## Configuration

Click the extension icon to:

- **Hourly Rate** - Your actual hourly wage (used to calculate work hours)
- **Show Banner** - Toggle the guilt-trip banner on/off
- **Weekly Reports** - Get/skip the Sunday shame summary

## Stats Tracked

- **Lifetime hours** - Total hours of work you "almost spent"
- **Weekly hours** - This week's cart browsing guilt
- **Cart sightings** - How many times you've looked at carts
- **Per-site breakdown** - Which sites are draining the most hours

## Privacy

CartShame is 100% local:

- No accounts required
- No data sent to servers
- No tracking or analytics
- All data stays in Chrome's local storage

## Contributing

PRs welcome! Some ideas:

- [ ] Better icons
- [ ] More site-specific selectors
- [ ] Currency conversion
- [ ] Multiple hourly rates (work vs freelance)
- [ ] Screenshot/share feature for maximum guilt

## License

MIT - do whatever you want with it.

---

*Built with love and a healthy dose of financial anxiety.*
