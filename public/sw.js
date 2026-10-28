self.addEventListener("push", (event) => {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/assets/icono-tlaxapp-beige.png", // Icono por defecto (el backend puede omitir `icon`)
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
  