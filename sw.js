// sw.js

// Clean background lifecycle event handlers
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

// BACKGROUND DATA ENGINE: Wakes up and checks fixtures.json on your server
async function checkForUpcomingMatches() {
    try {
        // Fetch your match JSON file from the root directory of your server
        const response = await fetch('/fixtures.json', { cache: 'no-store' });
        const fixtures = await response.json();
        
        // Calculate the current date matching the club's UK local time zone
        const todayStr = new Date().toLocaleDateString('en-GB', {
            timeZone: 'Europe/London',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).split('/').reverse().join('-'); // Results in "YYYY-MM-DD"
        
        // Filter matches scheduled for today
        const todaysMatches = fixtures.filter(match => match.date === todayStr);
        
        if (todaysMatches.length === 0) {
            console.log("No club matches scheduled for today.");
            return;
        }

        // Loop through matches scheduled for today and show notification banners
        for (const match of todaysMatches) {
            const title = match.title || "Goldenacre BC Match";
            const teamInfo = match.team ? `(${match.team}) ` : "";
            const matchTime = match.time ? `at ${match.time}` : "Today";
            
                   const options = {
            body: `${teamInfo}Playing ${matchTime}. ${match.description || ''}`.trim(),
            icon: 'logo.jpeg',
            badge: 'logo.jpeg',
            vibrate:, // Changed from vibrate:, to a clean bracket sequence
            tag: `match-${match.date}-${match.time || 'all-day'}`,
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

// PERIODIC BACKGROUND SYNC: Fired natively by browser engine cycles
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-match-reminders') {
        event.waitUntil(checkForUpcomingMatches());
    }
});

// FALLBACK LISTENER: Also check for match updates when the page is being loaded
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'checkReminders') {
        event.waitUntil(checkForUpcomingMatches());
    }
});

