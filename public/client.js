const publicVapidKey = 'BJeAClzN07yHdjR0ZbbIb6F4zlUwg6hPxgCDO7RSvguKXcGByXw2MF7WcrKaZ9WpSce9QTk4tEWMWQq8u7S5i1g';
var notificationsEnabledCheckbox = document.getElementById('notifications-checkbox');
var sendTestNotificationButton = document.getElementById('send-test-notification-button');

var Buttons

setup()

if ('serviceWorker' in navigator) {
    run().catch(error => { 
        console.error(error);
        document.write('Error registering service worker: ' + error);
    });
} else {
    document.write('Error registering service worker: serviceWorker not in navigator')
}

async function run() {

    registration = await navigator.serviceWorker.register('/worker.js', { scope: '/' });
    console.log('Registered service worker');

    fetch('/subscribe')
        .then(response => { return response.json() })
        .then(body => {
            if (body != null) {
                // server has a saved subscription -> update with ours if different
                registration.pushManager.getSubscription()
                    .then(pushSubscription => {
                        if(JSON.stringify(body) !== JSON.stringify(pushSubscription)) {
                            // update server with our subscription
                            console.log('Server push subscription does not match local - updating server')
                            pushToServer('/subscribe', { subscription: pushSubscription })
                        } else {
                            console.log('Server push subscription matches local')
                        }
                    })
                }
        }).catch(error => console.log(error))

        Buttons.enable()
}



async function notificationsChanged() {
    if(notificationsEnabledCheckbox.checked) {
        // user is subscribing to notifications
        // disable buttons while working
        Buttons.disable()

        // subscribe to webpush notifications
        console.log('Registering webpush subscription');

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        })

        console.log('Registered webpush subscription: ' + JSON.stringify(subscription))

        // save webspush subscription on the server
        pushToServer('/subscribe', { subscription: subscription, notifications: true })
            .then(res => {
                // handle response
            })

        // re-enable buttons
        Buttons.enable()

    } else {
        // user is unsubscribing from notifications
        // (1) update server: set subscription to null and notificationsEnabled=false, (2) unsubscribe from service worker
        pushToServer('/subscribe', { subscription: null, notifications: false })

        const subscription = await registration.pushManager.getSubscription()
        subscription.unsubscribe().then(success => {
            if(success) { console.log('Successfully unregistered subscription')}
            else { console.log('Error unregistering subscription')}
        })

    }
}

function pushToServer(endpoint, payload) {
    return new Promise((resolve, reject) => {
        fetch (endpoint, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            resolve(response)
        })
    })
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
   
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
   
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function setup() { 

    Buttons = { 
        enable: () => {
            notificationsEnabledCheckbox.disabled = false
            sendTestNotificationButton.disabled = false
        },
        disable: () => {
            notificationsEnabledCheckbox.disabled = true
            sendTestNotificationButton.disabled = true
        },
        unchecked: () => {
            notificationsEnabledCheckbox.disabled = false
            notificationsEnabledCheckbox.checked = false
        },
        checked: () => {
            notificationsEnabledCheckbox.disabled = false
            notificationsEnabledCheckbox.checked = true
            sendTestNotificationButton.disabled = false
        }
    }

    while(!document.getElementById("notifications-checkbox")) {
        await new Promise(r => setTimeout(r, 500));
    }
    // now the element is loaded
    notificationsEnabledCheckbox = document.getElementById('notifications-checkbox');

    while(!document.getElementById("notifications-checkbox")) {
        await new Promise(r => setTimeout(r, 500));
    }
    // now the element is loaded
    sendTestNotificationButton = document.getElementById('send-test-notification-button');
    // create event listener for 'notifications' checkbox
    notificationsEnabledCheckbox.addEventListener('click', notificationsChanged);
    Buttons.disable()
}
