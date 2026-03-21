self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.notification.body,
    icon: 'https://path/to/your/icon.png' // Placeholder, needs replacement
  };

  event.waitUntil(
    self.registration.showNotification(data.notification.title, options)
  );
});

// Register OneSignal Push with the SDK
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
