import { getSupabaseClient } from '@/lib/supabase-client';
import { useEffect, useState, useCallback } from 'react';
import { MessageWithUser } from '@/lib/chat/chat-types';
import { getMessagesAction } from '@/actions/chat/messages';
import { useAuth } from '@/components/provider/auth-provider';

export function useChatRealtime(channelId: number | null) {
	const { user } = useAuth();
	const [messages, setMessages] = useState<MessageWithUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const supabase = getSupabaseClient();

	const fetchMessages = useCallback(async () => {
		if (!channelId || !user) {
			setMessages([]);
			setLoading(false);
			return;
		}
		console.time(`channel-${channelId}`);

		setLoading(true);
		setError(null);

		try {
			const result = await getMessagesAction(channelId, user.id);
			console.timeEnd(`channel-${channelId}`);

			if (result.error) {
				setError(result.error || 'Error al cargar mensajes');
			} else if (result.data) {
				setMessages(result.data);
			}
		} catch (err: any) {
			setError(err.message || 'Error al cargar mensajes');
		} finally {
			setLoading(false);
		}
	}, [channelId, user]);

	useEffect(() => {
		fetchMessages();
	}, [fetchMessages]);

	useEffect(() => {
		if (!channelId) return;

		const channel = supabase
			.channel(`messages-${channelId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'messages',
					filter: `channel_id=eq.${channelId}`,
				},
				async (payload) => {
					const { eventType, new: newRecord, old: oldRecord } = payload;

					if (eventType === 'INSERT') {
						const { data } = await supabase
							.from('messages')
							.select(
								`
									*,
									users (
										username,
										role,
										name,
										last_name
									)
								`
							)
							.eq('id', newRecord.id)
							.single();

						if (data) {
							setMessages((prev) => [...prev, data as MessageWithUser]);
						}
					} else if (eventType === 'UPDATE') {
						setMessages((prev) =>
							prev.map((msg) =>
								msg.id === newRecord.id ? { ...msg, ...newRecord, users: msg.users } : msg
							)
						);
					} else if (eventType === 'DELETE') {
						setMessages((prev) => prev.filter((msg) => msg.id !== oldRecord.id));
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [channelId, supabase]);

	const refresh = useCallback(() => {
		fetchMessages();
	}, [fetchMessages]);

	return {
		messages,
		loading,
		error,
		refresh,
	};
}
