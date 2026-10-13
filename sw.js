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
        clients.openWindow('/index.html')
    );
});

// Listen for incoming match reminders or system alerts
self.addEventListener('push', (e) => {
    let data = { title: 'Goldenacre BC Alert', body: 'New match update!' };
    
    if (e.data) {
        try {
            data = e.data.json();
        } catch (err) {
            data.body = e.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: 'logo.jpeg',
        badge: 'logo.jpeg',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now()
        }
    };

    e.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
