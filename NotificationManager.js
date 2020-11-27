var secrets;
if (process.env.NODE_ENV != 'production') secrets = require('./secrets')
const webpush = require('web-push')
webpush.setVapidDetails(process.env.VAPID_MAILTO || secrets.VAPIDKEYS.MAILTO, process.env.VAPID_PUBLICKEY || secrets.VAPIDKEYS.PUBLICKEY, process.env.VAPID_PRIVATEKEY || secrets.VAPIDKEYS.PRIVATEKEY);

class NotificationManager {
    constructor() {
        this.webpush = webpush
        this.channels = {}
    }

    sendNotification() {
        this.webpush.sendNotification()
    }

}

module.exports = NotificationManager