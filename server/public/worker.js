console.log('Service Worker loaded!')

self.addEventListener('push', event => {
    const mData = event.data.json();
    console.log('Got push', mData);
    const { title, icon, actions, data } = mData;
    
    event.waitUntil(
        self.registration.showNotification(title, {
            icon,
            actions,
            data
        })
    )
})

self.addEventListener('notificationclick', function(event) {
    clients.openWindow(event.notification.data.url)
})
