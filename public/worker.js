console.log('Service Worker loaded!')

self.addEventListener('push', ev => {
    const data = ev.data.json();
    console.log('Got push', data);
    const { title, body, icon } = data;
    self.registration.showNotification(title, {
        body,
        icon
    })
})