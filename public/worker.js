console.log('Service Worker loaded!')

// When push event is received, display notification to the user (you!?)
self.addEventListener('push', event => {
    //console.log('Got push', event.data.json());
    const { title, icon, actions, data } = event.data.json();
    const contents = { icon, actions, data };
    const sentNotification = self.registration.showNotification(title, contents);
    event.waitUntil(sentNotification);
});



// When notification is clicked, go to provided url (ie. the Twitch stream)
self.addEventListener('notificationclick', function(event) {
    clients.openWindow(event.notification.data.url)
});