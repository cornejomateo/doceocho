'use server';

import { configureWebPush, sendPushNotification } from '@/lib/push/vapid';
import { getChannelPushSubscriptions } from '@/lib/push/subscriptions';
import { getUser } from '@/lib/users/users';

export async function sendPushNotificationToChannel(
	channelId: number,
	senderUsername: string,
	message: string,
	channelName: string
) {
	try {
		// Configure web-push
		const configured = configureWebPush();
		if (!configured) {
			return { success: false, error: 'VAPID keys are not configured', sentCount: 0 };
		}

		// Get all push subscriptions for channel members (excluding sender)
		const { data: subscriptions, error } = await getChannelPushSubscriptions(
			channelId,
			senderUsername
		);

		if (error) {
			return { success: false, error, sentCount: 0 };
		}
		if (!subscriptions || subscriptions.length === 0) {
			return { success: true, sentCount: 0 };
		}

		// Get sender info
		const senderResult = await getUser(senderUsername);
		const senderName = senderResult.data?.username || senderUsername;

		// Send notification to all subscriptions
		let sentCount = 0;
		for (const subscription of subscriptions) {
			const result = await sendPushNotification(subscription, {
				title: `Nuevo mensaje en ${channelName}`,
				body: `${senderName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
				icon: '/icon-192.png',
				data: {
					channelId,
					channelName,
					senderUsername,
				},
			});

			if (result.success) {
				sentCount++;
			}
		}

		return { success: true, sentCount };
	} catch (error: any) {
		console.error('Error sending push notifications:', error);
		return { success: false, error: error.message };
	}
}
