'use client';

import { Button } from '@/components/ui/button';
import { CHAT_CONSTANTS } from '../../../constants/chat/chat.constants';

interface PushNotificationSettingsProps {
	isSupported: boolean;
	permission: NotificationPermission;
	subscription: any;
	onRequestPermission: () => Promise<{ success: boolean }>;
	onSubscribe: () => Promise<{ success: boolean; error?: any }>;
	onUnsubscribe: () => Promise<{ success: boolean; error?: any }>;
}

export function PushNotificationSettings({
	isSupported,
	permission,
	subscription,
	onRequestPermission,
	onSubscribe,
	onUnsubscribe,
}: PushNotificationSettingsProps) {
	if (!isSupported) return null;

	return (
		<div className="mb-4 p-2 bg-muted rounded">
			{permission === 'default' && (
				<Button
					size="sm"
					variant="outline"
					className="w-full"
					onClick={async () => {
						const result = await onRequestPermission();
						if (result.success) {
							await onSubscribe();
						}
					}}
				>
					{CHAT_CONSTANTS.PUSH_NOTIFICATIONS.ENABLE}
				</Button>
			)}
			{permission === 'granted' && (
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">
						{subscription
							? CHAT_CONSTANTS.PUSH_NOTIFICATIONS.ENABLED
							: CHAT_CONSTANTS.PUSH_NOTIFICATIONS.SUBSCRIBE}
					</span>
					{subscription ? (
						<Button size="sm" variant="ghost" onClick={onUnsubscribe} className="h-6 text-xs">
							{CHAT_CONSTANTS.PUSH_NOTIFICATIONS.UNSUBSCRIBE}
						</Button>
					) : (
						<Button size="sm" variant="ghost" onClick={onSubscribe} className="h-6 text-xs">
							{CHAT_CONSTANTS.PUSH_NOTIFICATIONS.SUBSCRIBE}
						</Button>
					)}
				</div>
			)}
			{permission === 'denied' && (
				<span className="text-xs text-destructive">
					{CHAT_CONSTANTS.PUSH_NOTIFICATIONS.BLOCKED}
				</span>
			)}
		</div>
	);
}
