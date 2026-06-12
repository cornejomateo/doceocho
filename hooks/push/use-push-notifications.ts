import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/provider/auth-provider';
import {
	savePushSubscription,
	deletePushSubscription,
	type PushSubscription,
} from '@/lib/push/subscriptions';

export function usePushNotifications() {
	const { user } = useAuth();
	const [permission, setPermission] = useState<NotificationPermission>('default');
	const [subscription, setSubscription] = useState<PushSubscription | null>(null);
	const [isSupported, setIsSupported] = useState(false);

	// Check if push notifications are supported
	useEffect(() => {
		setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
		setPermission(Notification.permission);
	}, []);

	// Request notification permission
	const requestPermission = useCallback(async () => {
		if (!isSupported) {
			return { success: false, error: 'Push notifications not supported' };
		}

		const permissionResult = await Notification.requestPermission();
		setPermission(permissionResult);

		if (permissionResult !== 'granted') {
			return { success: false, error: 'Permission denied' };
		}

		return { success: true };
	}, [isSupported]);

	// Subscribe to push notifications
	const subscribe = useCallback(async () => {
		if (!isSupported || !user || permission !== 'granted') {
			return { success: false, error: 'Not supported or permission not granted' };
		}

		try {
			// Register service worker
			const registration = await navigator.serviceWorker.register('/sw.js');
			console.log('Service Worker registered:', registration);

			// Subscribe to push
			const pushSubscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
			});

			const p256dh = pushSubscription.getKey('p256dh');
			const auth = pushSubscription.getKey('auth');

			const subscriptionData: PushSubscription = {
				endpoint: pushSubscription.endpoint,
				keys: {
					p256dh: p256dh ? btoa(String.fromCharCode(...new Uint8Array(p256dh))) : '',
					auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
				},
			};

			// Save subscription to database
			const result = await savePushSubscription(user.username, subscriptionData);

			if (result.success) {
				setSubscription(subscriptionData);
				return { success: true };
			} else {
				return { success: false, error: result.error };
			}
		} catch (error: any) {
			console.error('Error subscribing to push:', error);
			return { success: false, error: error.message };
		}
	}, [isSupported, user, permission]);

	// Unsubscribe from push notifications
	const unsubscribe = useCallback(async () => {
		if (!subscription || !user) {
			return { success: false, error: 'No subscription' };
		}

		try {
			// Delete from database
			await deletePushSubscription(user.username, subscription.endpoint);

			// Unsubscribe from push
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration) {
				const pushSubscription = await registration.pushManager.getSubscription();
				if (pushSubscription) {
					await pushSubscription.unsubscribe();
				}
			}

			setSubscription(null);
			return { success: true };
		} catch (error: any) {
			console.error('Error unsubscribing:', error);
			return { success: false, error: error.message };
		}
	}, [subscription, user]);

	// Load existing subscription on mount
	useEffect(() => {
		if (!isSupported || !user) return;

		const loadSubscription = async () => {
			try {
				const registration = await navigator.serviceWorker.getRegistration();
				if (registration) {
					const pushSubscription = await registration.pushManager.getSubscription();
					if (pushSubscription) {
						const p256dh = pushSubscription.getKey('p256dh');
						const auth = pushSubscription.getKey('auth');

						const subscriptionData: PushSubscription = {
							endpoint: pushSubscription.endpoint,
							keys: {
								p256dh: p256dh ? btoa(String.fromCharCode(...new Uint8Array(p256dh))) : '',
								auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
							},
						};
						setSubscription(subscriptionData);
					}
				}
			} catch (error) {
				console.error('Error loading subscription:', error);
			}
		};

		loadSubscription();
	}, [isSupported, user]);

	return {
		isSupported,
		permission,
		subscription,
		requestPermission,
		subscribe,
		unsubscribe,
	};
}
