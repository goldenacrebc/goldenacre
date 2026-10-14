// sw.js - Complete Service Worker with 2-Hour Advance Timing and Persistent Memory

const CACHE_NAME = 'goldenacre-notification-memory-v1';

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

// Helper function to convert time strings like "7:30 pm" or "19:30" into total minutes from midnight
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

        // 1. Fetch match fixtures JSON file
        try {
            const fixturesResponse = await fetch('/fixtures.json', { cache: 'no-store' });
            const fixtures = await fixturesResponse.json();
            for (const f of fixtures) {
                allCombinedItems.push(f);
            }
        } catch (err) {
            console.log("No fixtures.json file found or failed to parse.");
        }

        // 2. Fetch club events JSON file
        try {
            const eventsResponse = await fetch('/events.json', { cache: 'no-store' });
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

        for (const item of todaysEntries) {
            const matchMinutes = parseTimeToMinutes(item.time);
            
            // If it's an all-day event or has no valid time, notify immediately today
            let shouldNotify = false;
            if (matchMinutes === null) {
                shouldNotify = true;
            } else {
                // Calculate time exactly 2 hours (120 minutes) before the fixture time
                let notificationTargetMinutes = matchMinutes - 120;
                
                // Check if current time has reached or passed the 2-hour mark, but hasn't passed the event time yet
                if (currentTotalMinutes >= notificationTargetMinutes && currentTotalMinutes <= matchMinutes) {
                    shouldNotify = true;
                }
            }

            if (!shouldNotify) {
                continue;
            }

            const title = item.title || "Goldenacre BC Alert";
            const teamInfo = item.team ? `(${item.team}) ` : "";
            const matchTime = item.time ? `at ${item.time}` : "Today";
            const notificationKey = `/notified-${item.date}-${item.time || 'all-day'}-${item.title || 'alert'}`;
            
            // Check if we already logged this notification in storage today
            const alreadyNotified = await notificationCache.match(notificationKey);
            if (alreadyNotified) {
                continue;
            }

            const options = {
                body: `${teamInfo}Playing/Happening ${matchTime}. ${item.description || ''}`.trim(),
                icon: 'logo.jpeg',
                badge: 'logo.jpeg',
                tag: notificationKey,
                data: {
                    dateOfArrival: Date.now()
                }
            };

            await self.registration.showNotification(title, options);

            // Save a record in our background storage so it never triggers again today
            await notificationCache.put(notificationKey, new Response('sent'));
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