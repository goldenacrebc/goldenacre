// sw.js - Complete Service Worker with Live Cache-Busting and 2-Hour Advance Timing

const CACHE_NAME = 'goldenacre-notification-memory-v1';

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    return self.clients.claim();
});

// Redirects members straight back to the website when an alert card is clicked
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    const targetUrl = (e.notification.data && e.notification.data.url) || '/index.html';
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});

// PASS-THROUGH NETWORKING: Stops the service worker from blocking or caching site data files
self.addEventListener('fetch', (event) => {
    return; 
});

// Helper function to convert time strings like "1:00 pm" or "19:30" into total minutes from midnight
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    let cleanStr = timeStr.trim().toLowerCase();
    let isPM = cleanStr.includes('pm');
    let isAM = cleanStr.includes('am');
    
    cleanStr = cleanStr.replace('pm', '').replace('am', '').trim();
    let parts = cleanStr.split(':');
    if (parts.length < 2) return null;
    
    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    
    return (hours * 60) + minutes;
}

// BACKGROUND DATA ENGINE: Checks fixtures and events for exactly 2 hours before start time
async function checkForUpcomingMatches() {
    try {
        let now = new Date();
        
        // Format current UK date as YYYY-MM-DD
        let todayStr = now.toLocaleDateString('en-GB', {
            timeZone: 'Europe/London',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).split('/').reverse().join('-'); 

        let currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();

        let allCombinedItems = [];
        let cacheBuster = '?t=' + Date.now();

        // 1. Fetch match fixtures JSON file with cache-buster to prevent GitHub Pages stale caching
        try {
            const fixturesResponse = await fetch('/fixtures.json' + cacheBuster, { cache: 'no-store' });
            const fixtures = await fixturesResponse.json();
            for (const f of fixtures) {
                allCombinedItems.push(f);
            }
        } catch (err) {
            console.log("No fixtures.json file found or failed to parse.");
        }

        // 2. Fetch club events JSON file with cache-buster
        try {
            const eventsResponse = await fetch('/events.json' + cacheBuster, { cache: 'no-store' });
            const events = await eventsResponse.json();
            for (const ev of events) {
                allCombinedItems.push(ev);
            }
        } catch (err) {
            console.log("No events.json file found or failed to parse.");
        }
        
        // Filter items scheduled for today where notify is not false
        const todaysEntries = allCombinedItems.filter(item => {
            if (item.date !== todayStr) return false;
            if (item.notify === false) return false;
            return true;
        });
        
        if (todaysEntries.length === 0) {
            return;
        }

        // Open our secure background storage memory
        const notificationCache = await caches.open(CACHE_NAME);

        // Reminder windows: fire at 4 hours before and again at 2 hours before
        const REMINDERS = [
            { minutesBefore: 240, label: '4hr',  prefix: '4 hours'  },
            { minutesBefore: 120, label: '2hr',  prefix: '2 hours'  },
        ];

        for (const item of todaysEntries) {
            const matchMinutes = parseTimeToMinutes(item.time);
            const title    = item.title || "Goldenacre BC Alert";
            const teamInfo = item.team ? `(${item.team}) ` : "";
            const matchTime = item.time ? `at ${item.time}` : "Today";

            // All-day / no-time events: fire once, no reminder window
            if (matchMinutes === null) {
                const notificationKey = `/notified-${item.date}-all-day-${item.title || 'alert'}`;
                const alreadyNotified = await notificationCache.match(notificationKey);
                if (alreadyNotified) continue;

                await self.registration.showNotification(title, {
                    body: `${teamInfo}On today. ${item.description || ''}`.trim(),
                    icon: 'logo.jpeg', badge: 'logo.jpeg',
                    tag: notificationKey,
                    data: { dateOfArrival: Date.now() }
                });
                await notificationCache.put(notificationKey, new Response('sent'));
                continue;
            }

            // Timed events: check each reminder window independently
            for (const reminder of REMINDERS) {
                const windowStart = matchMinutes - reminder.minutesBefore;
                // Fire if we're within a 30-minute window of the reminder time
                // and the event hasn't started yet
                if (
                    currentTotalMinutes >= windowStart &&
                    currentTotalMinutes <  windowStart + 30 &&
                    currentTotalMinutes <  matchMinutes
                ) {
                    const notificationKey = `/notified-${item.date}-${item.time}-${item.title || 'alert'}-${reminder.label}`;
                    const alreadyNotified = await notificationCache.match(notificationKey);
                    if (alreadyNotified) continue;

                    await self.registration.showNotification(`${title} — ${reminder.prefix} to go`, {
                        body: `${teamInfo}${reminder.prefix} until kick-off ${matchTime}. ${item.description || ''}`.trim(),
                        icon: 'logo.jpeg', badge: 'logo.jpeg',
                        tag: notificationKey,
                        data: { dateOfArrival: Date.now() }
                    });
                    await notificationCache.put(notificationKey, new Response('sent'));
                }
            }
        }
    } catch (err) {
        console.error("Background match checking synchronization failed:", err);
    }
}

// PERIODIC BACKGROUND SYNC
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-match-reminders') {
        event.waitUntil(checkForUpcomingMatches());
    }
});

// MESSAGE LISTENER
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'checkReminders') {
        event.waitUntil(checkForUpcomingMatches());
    }
});

// PUSH HOOK — handles server-sent push notifications from the admin panel
self.addEventListener('push', (event) => {
    // If the push has a payload (sent from admin), show it directly
    if (event.data) {
        try {
            const data = event.data.json();
            event.waitUntil(
                self.registration.showNotification(data.title || 'Goldenacre BC', {
                    body: data.body || '',
                    icon: data.icon || '/logo.jpeg',
                    badge: 'logo.jpeg',
                    ...(data.image ? { image: data.image } : {}),
                    tag: 'admin-push-' + Date.now(),
                    data: { url: data.url || '/index.html' }
                })
            );
            return;
        } catch (e) {
            // fall through to fixture check if payload isn't JSON
        }
    }
    // No payload — fall back to checking fixtures as before
    event.waitUntil(checkForUpcomingMatches());
});
