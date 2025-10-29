self.addEventListener("push", (event) => {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/icon-192x192.png",
      badge: "/icon-96x96.png",
      data: { url: data.url },
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
  });
  