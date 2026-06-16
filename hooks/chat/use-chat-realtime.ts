import { getSupabaseClient } from '@/lib/supabase-client';
import { useEffect, useState, useCallback } from 'react';
import { MessageWithUser } from '@/types/chat';
import { getMessagesByChannel } from '@/lib/chat/messages';
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

		setLoading(true);
		setError(null);

		try {
			const result = await getMessagesAction(channelId, user.username);
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
						// Fetch the new message with user data
						const { data: newMessageWithUser } = await supabase
							.from('messages')
							.select(
								`
								*,
								users:user_id (
									username,
									role
								)
							`
							)
							.eq('id', newRecord.id)
							.single();

						if (newMessageWithUser) {
							setMessages((prev) => [...prev, newMessageWithUser as MessageWithUser]);
						}
					} else if (eventType === 'UPDATE') {
						setMessages((prev) =>
							prev.map((msg) => (msg.id === newRecord.id ? { ...msg, ...newRecord } : msg))
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
