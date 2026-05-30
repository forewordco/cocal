// CoCal Service Worker — handles push notifications

self.addEventListener("push", (event) => {
  let data = { title: "CoCal", body: "Something changed." };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "icon-192.png",
      badge: "icon-192.png",
      tag: "cocal-" + Date.now(),
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/cocal/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/cocal") && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
