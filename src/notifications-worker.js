// (function () {
//   console.log(
//     "Service Worker: registering 'push' and 'notificationclick' event listeners"
//   );

//   // When push event is received, display notification
//   self.addEventListener("push", (evt) => {
//     console.log("Notifications Service Worker: push received");
//     const { title, icon, actions, data } = evt.data.json();
//     const sent = self.registration.showNotification(title, contents);
//     evt.waitUntil(sent);
//   });

//   // When notification is clicked, navigate to URL
//   self.addEventListener("notificationclick", (evt) => {
//     console.log("Notifications Service Worker: notification clicked");
//     clients.openWindow(evt.notification.data.url);
//   });
// })();
