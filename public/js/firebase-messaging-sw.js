importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js');
firebase.initializeApp({
  apiKey: 'apiKey',
  authDomain: 'authDomain',
  projectId: 'projectId',
  storageBucket: 'storageBucket',
  messagingSenderId: 'messagingSenderId',
  appId: 'appId',
  measurementId: 'measurementId',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const url = payload.data.url;
  const message = payload.notification.body;
  const title = payload.notification.title;

  const options = {
    body: message + '.',
    data: { body: message, url: url },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  const notificationData = event.notification.data;
  const url = notificationData.url;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
  event.notification.close();
});
