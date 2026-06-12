// Service Worker for PWA and Push Notifications

const CACHE_NAME = 'doceocho-v1';
const urlsToCache = ['/'];

// Install event - cache assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(urlsToCache);
		})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			if (response) {
				return response;
			}
			return fetch(event.request);
		})
	);
});

// Push notification event
self.addEventListener('push', (event) => {
	if (!event.data) {
		return;
	}

	let data;
	try {
		data = event.data.json();
	} catch (e) {
		// Fallback to text if JSON parsing fails
		const text = event.data.text() || 'Nuevo mensaje';
		data = { body: text, title: 'Notificación' };
	}

	const options = {
		body: data.body || 'Nuevo mensaje',
		icon: data.icon || '/icon-192.png',
		badge: '/icon-192.png',
		vibrate: [100, 50, 100],
		data: data.data || {},
		tag: 'chat-notification',
		requireInteraction: true,
		renotify: true,
		actions: [
			{
				action: 'open',
				title: 'Abrir',
			},
			{
				action: 'dismiss',
				title: 'Descartar',
			},
		],
	};

	event.waitUntil(self.registration.showNotification(data.title || 'Notificación', options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	if (event.action === 'open') {
		event.waitUntil(
			self.clients.matchAll({ type: 'window' }).then((clientList) => {
				// If a window is already open, focus it
				for (const client of clientList) {
					if (client.url === '/' && 'focus' in client) {
						return client.focus();
					}
				}
				// Otherwise, open a new window
				if (clients.openWindow) {
					return clients.openWindow('/');
				}
			})
		);
	}
});
