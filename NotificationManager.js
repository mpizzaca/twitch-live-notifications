var secrets;
if (process.env.NODE_ENV != 'production') secrets = require('./secrets')
const webpush = require('web-push')
webpush.setVapidDetails(process.env.VAPID_MAILTO || secrets.VAPID_MAILTO, 
                        process.env.VAPID_PUBLICKEY || secrets.VAPID_PUBLICKEY, 
                        process.env.VAPID_PRIVATEKEY || secrets.VAPID_PRIVATEKEY);

class NotificationManager {
    constructor() {
        this.webpush = webpush
        this.channels = {}
    }

    sendNotification(pushSubscription, payload) {
        

        this.webpush.sendNotification(pushSubscription, payload).then(result => {
            console.log(result)
        })
    }
}

module.exports = NotificationManager