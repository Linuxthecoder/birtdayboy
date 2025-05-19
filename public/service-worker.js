self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  const title = data.title || 'Birthday Notification!';
  const options = {
    body: data.body || '',
    icon: '/cake.png',
    badge: '/cake.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
}); 