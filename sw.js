// sw.js - Complete Service Worker with Duplicate Prevention

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    return self.clients.claim();
});

// Redirects members straight back to the website dashboard when an alert card is clicked
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url.endsWith('/index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/index.html');
            }
        })
    );
});

// PASS-THROUGH NETWORKING: Stops the service worker from blocking or caching site data files
self.addEventListener('fetch', (event) => {
    return; 
});

// BACKGROUND DATA ENGINE: Wakes up and checks BOTH fixtures.json and events.json on your server
async function checkForUpcomingMatches() {
    try {
        let rawDateStr = new Date().toLocaleDateString('en-GB', {
            timeZone: 'Europe/London',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).split('/').reverse().join('-'); 
        
        const todayStr = rawDateStr;
        let allCombinedItems = [];

        // 1. Fetch match fixtures JSON file
        try {
            const fixturesResponse = await fetch('/fixtures.json', { cache: 'no-store' });
            const fixtures = await fixturesResponse.json();
            const taggedFixtures = fixtures.map(f => ({ ...f, isFixture: true }));
            allCombinedItems = allCombinedItems.concat(taggedFixtures);
        } catch (err) {
            console.log("No fixtures.json file found or failed to parse.");
        }

        // 2. Fetch club events JSON file
        try {
            const eventsResponse = await fetch('/events.json', { cache: 'no-store' });
            const events = await eventsResponse.json();
            allCombinedItems = allCombinedItems.concat(events);
        } catch (err) {
            console.log("No events.json file found or failed to parse.");
        }
        
        const todaysEntries = allCombinedItems.filter(item => {
            if (item.date !== todayStr) return false;
            if (item.isFixture) return true;
            if (item.notify === false) return false;
            return true;
        });
        
        if (todaysEntries.length === 0) {
            return;
        }

        // Fetch currently active notifications in the user's tray to prevent duplicates on reload[cite: 10]
        const activeNotifications = await self.registration.getNotifications();
        const activeTags = activeNotifications.map(n => n.tag);

        for (const item of todaysEntries) {
            const title = item.title || "Goldenacre BC Alert";
            const teamInfo = item.team ? `(${item.team}) ` : "";
            const matchTime = item.time ? `at ${item.time}` : "Today";
            const notificationTag = `match-${item.date}-${item.time || 'all-day'}`;
            
            // Skip showing this notification if it's already active in the tray[cite: 10]
            if (activeTags.includes(notificationTag)) {
                continue;
            }

            const options = {
                body: `${teamInfo}Playing/Happening ${matchTime}. ${item.description || ''}`.trim(),
                icon: 'logo.jpeg',
                badge: 'logo.jpeg',
                tag: notificationTag,
                data: {
                    dateOfArrival: Date.now()
                }
            };

            await self.registration.showNotification(title, options);
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

// PUSH HOOK
self.addEventListener('push', (event) => {
    event.waitUntil(checkForUpcomingMatches());
});
