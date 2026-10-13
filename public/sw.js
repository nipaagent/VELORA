// Service Worker for Web Push Notifications (plain JS, NO imports)

self.addEventListener('push', function (event) {
  var data = {};
  if (event.data) {
    try {
      data = JSON.parse(event.data.text());
    } catch (err) {
      data = { title: 'নতুন নোটিফিকেশন', body: event.data.text() };
    }
  }

  var title = data.title || 'NIPA NETWORK';
  var options = {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      for (var j = 0; j < clientList.length; j++) {
        var openClient = clientList[j];
        if ('focus' in openClient) {
          if ('navigate' in openClient && targetUrl !== '/') {
            openClient.navigate(targetUrl);
          }
          return openClient.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
