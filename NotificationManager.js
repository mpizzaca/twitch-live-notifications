const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.VAPID_PUBLICKEY,
  process.env.VAPID_PRIVATEKEY);

class NotificationManager {
  constructor() {
    this.webpush = webpush;
    this.channels = {};
  }

  sendNotification(pushSubscription, payload) {
    this.webpush.sendNotification(pushSubscription, payload)
      .catch(console.log);
  }
}

module.exports = NotificationManager;
