# Goldenacre Bowling Club Website

Welcome to the Goldenacre Bowling Club website repository! This is the official web presence for our bowling club.

**Visit the live website**: [https://goldenacrebc.co.uk](https://goldenacrebc.co.uk/)

## About

The Goldenacre Bowling Club website is a modern, responsive web platform designed to showcase our club's activities, events, and community. 

## Project Stack

- **HTML** (40.8%) - Semantic markup for content structure
- **CSS** (59.2%) - Styling and responsive design

## Getting Started

### Prerequisites
- A modern web browser
- A code editor (VS Code, Sublime Text, etc.)
- Git

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/goldenacrebc/goldenacre.git
```

2. Navigate to the project directory:
```bash
cd goldenacre
```

3. Open `index.html` in your browser or use a local server.

## Features

- Responsive design for mobile, tablet, and desktop
- Clean and intuitive user interface
- Easy-to-maintain HTML and CSS structure

## Stylesheets

Pages that load `style.css` continue to use it as the shared stylesheet entry point. It imports the styles in `styles/` in their original cascade order:

- `foundation.css` - reset, colour variables, shared header, hero, and buttons
- `club-sections.css` - news, about, schedule, sponsors, social, and hall hire sections
- `membership-footer.css` - membership/contact sections, footer, and shared responsive rules
- `timelines.css` - news and event timeline layouts
- `modals.css` - dialogs and modal content
- `competition-draws.css` - competition draw cards and their responsive layout

When updating the styling, edit the relevant file in `styles/`; keep the `style.css` import order unchanged unless you intend to change style precedence.

## Background event push reminders

GitHub Actions checks `events.json` and `fixtures.json` every five minutes and sends enabled event and fixture reminders four and/or two hours before their start time, including when a member's phone is not running the site. Delivery is attempted during a 30-minute window after each reminder time.

To enable the workflow:

1. Apply `supabase/migrations/20261109170000_push_reminder_deliveries.sql` to the Supabase project used by the site.
2. Add these GitHub Actions repository secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_ADMIN_EMAIL` (optional; defaults to `mailto:admin@goldenacrebc.co.uk`)
3. Ensure GitHub Actions is enabled for the repository. Run the **Scheduled event push reminders** workflow manually once to verify its configuration.

The workflow reads subscriptions from the existing `push_subscriptions` table. Keep the Supabase service-role key and VAPID private key in GitHub Secrets; do not put them in website files.

## Contributing

We welcome contributions from club members and the community! Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For inquiries about the Goldenacre Bowling Club, please visit our website or contact us through the site's contact form.

---

**Website**: [Goldenacre Bowling Club](https://goldenacrebc.co.uk)
