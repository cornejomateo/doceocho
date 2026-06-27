'use server';

import { configureWebPush, sendPushNotification } from '@/lib/push/vapid';
import { getChannelPushSubscriptions } from '@/lib/push/subscriptions';
import { getSupabaseClient } from '@/lib/supabase-client';

export async function sendPushNotificationToChannel(
	channelId: number,
	senderUserId: string,
	message: string,
	channelName: string
) {
	const supabase = getSupabaseClient();
	try {
		const configured = configureWebPush();

		if (!configured) {
			return {
				success: false,
				error: 'VAPID keys are not configured',
				sentCount: 0,
			};
		}

		const { data: subscriptions, error } = await getChannelPushSubscriptions(
			channelId,
			senderUserId
		);

		if (error) {
			return {
				success: false,
				error,
				sentCount: 0,
			};
		}

		if (!subscriptions?.length) {
			return {
				success: true,
				sentCount: 0,
			};
		}

		const { data: senderProfile } = await supabase
			.from('users')
			.select('username')
			.eq('uid_user', senderUserId)
			.single();

		const senderName = senderProfile?.username ?? 'Usuario';

		let sentCount = 0;

		for (const subscription of subscriptions) {
			const result = await sendPushNotification(subscription, {
				title: `Nuevo mensaje en ${channelName}`,
				body: `${senderName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
				icon: '/icon-192.png',
				data: {
					channelId,
					channelName,
					senderUserId,
				},
			});

			if (result.success) {
				sentCount++;
			}
		}

		return {
			success: true,
			sentCount,
		};
	} catch (error: any) {
		console.error(error);

		return {
			success: false,
			error: error.message,
		};
	}
}
