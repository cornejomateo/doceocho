import webpush from 'web-push';

// Generate VAPID keys (run this once and save to environment variables)
export function generateVapidKeys() {
	const vapidKeys = webpush.generateVAPIDKeys();
	return vapidKeys;
}

// Configure web-push with VAPID keys
export function configureWebPush() {
	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	const privateKey = process.env.VAPID_PRIVATE_KEY;
	const subject = process.env.VAPID_SUBJECT;

	if (!publicKey || !privateKey) {
		console.warn('VAPID keys not configured. Push notifications will not work.');
		return false;
	}

	if (!subject) {
		console.warn(
			'VAPID_SUBJECT environment variable not configured. Push notifications will not work.'
		);
		return false;
	}

	webpush.setVapidDetails(subject, publicKey, privateKey);

	return true;
}

// Send push notification
export async function sendPushNotification(
	subscription: webpush.PushSubscription,
	payload: { title: string; body: string; icon?: string; data?: any }
) {
	try {
		await webpush.sendNotification(subscription, JSON.stringify(payload));
		return { success: true };
	} catch (error: any) {
		console.error('Error sending push notification:', error);
		return { success: false, error: error.message };
	}
}
