console.log('Service Worker loaded!')

self.addEventListener('push', ev => {
    const data = ev.data.json();
    console.log('Got push', data);
    const { title, body, icon, actions } = data;

    

    self.registration.showNotification(title, {
        body,
        icon,
        actions
    })
})

self.addEventListener('notificationclick', function(event) {
    console.log('event: ' + JSON.stringify(event))
    console.log('event.notification: ' + JSON.stringify(event.notification))
    
    //Clients.openWindow()
})