const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.VAPID_PUBLICKEY,
  process.env.VAPID_PRIVATEKEY
);

const sendNotification = (pushSubscription, payload) => {
  webpush.sendNotification(pushSubscription, payload).catch(console.log);
};

module.exports = { sendNotification };
