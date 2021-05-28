importScripts("./ngsw-worker.js");

(function () {
  self.addEventListener("notificationclick", (event) => {
    if (clients.openWindow && event.notification.data.url) {
      event.waitUntil(clients.openWindow(event.notification.data.url));
    }
  });
})();
