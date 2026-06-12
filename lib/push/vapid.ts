import webpush from 'web-push';

// Generate VAPID keys (run this once and save to environment variables)
export function generateVapidKeys() {
	const vapidKeys = webpush.generateVAPIDKeys();
	console.log('VAPID Keys generated:');
	console.log('Public Key:', vapidKeys.publicKey);
	console.log('Private Key:', vapidKeys.privateKey);
	return vapidKeys;
}

// Configure web-push with VAPID keys
export function configureWebPush() {
	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	const privateKey = process.env.VAPID_PRIVATE_KEY;

	if (!publicKey || !privateKey) {
		console.warn('VAPID keys not configured. Push notifications will not work.');
		return false;
	}

	webpush.setVapidDetails(
		'mailto:your-email@example.com', // Replace with your email
		publicKey,
		privateKey
	);

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
