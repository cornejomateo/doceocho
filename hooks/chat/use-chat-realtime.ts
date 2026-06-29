import { getSupabaseClient } from '@/lib/supabase-client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { MessageWithUser } from '@/lib/chat/chat-types';
import { getMessagesAction } from '@/lib/chat/messages';
import { useAuth } from '@/components/provider/auth-provider';

type CacheEntry = {
	messages: MessageWithUser[];
	timestamp: number;
};

const cache = new Map<number, CacheEntry>();

export function clearMessagesCache() {
	cache.clear();
}
const CACHE_TTL = 30_000;

export function useChatRealtime(channelId: number | null) {
	const { user } = useAuth();
	const cached = channelId ? cache.get(channelId) : undefined;
	const [messages, setMessages] = useState<MessageWithUser[]>(cached?.messages ?? []);
	const [loading, setLoading] = useState(!cached);
	const [error, setError] = useState<string | null>(null);
	const supabase = getSupabaseClient();
	const messagesRef = useRef(messages);
	messagesRef.current = messages;

	const setMessagesAndCache = useCallback(
		(msgs: MessageWithUser[] | ((prev: MessageWithUser[]) => MessageWithUser[])) => {
			setMessages(msgs);
			if (channelId) {
				if (typeof msgs === 'function') {
					const prev = cache.get(channelId);
					const next = msgs(prev?.messages ?? []);
					cache.set(channelId, { messages: next, timestamp: Date.now() });
				} else {
					cache.set(channelId, { messages: msgs, timestamp: Date.now() });
				}
			}
		},
		[channelId]
	);

	const addMessage = useCallback(
		(message: MessageWithUser) => {
			setMessagesAndCache((prev) => {
				if (prev.some((m) => m.id === message.id)) return prev;
				return [...prev, message];
			});
		},
		[setMessagesAndCache]
	);

	const fetchMessages = useCallback(
		async (force = false) => {
			if (!channelId || !user) {
				setMessagesAndCache([]);
				setLoading(false);
				return;
			}

			const cached = cache.get(channelId);
			const isFresh = cached && Date.now() - cached.timestamp < CACHE_TTL;

			if (cached && !force) {
				setMessagesAndCache(cached.messages);
				setLoading(false);
			} else {
				setLoading(true);
			}

			if (isFresh && !force) return;

			setError(null);

			try {
				const result = await getMessagesAction(channelId);
				if (result.error) {
					setError(result.error || 'Error al cargar mensajes');
				} else if (result.data) {
					setMessagesAndCache(result.data);
				}
			} catch (err: any) {
				setError(err.message || 'Error al cargar mensajes');
			} finally {
				setLoading(false);
			}
		},
		[channelId, user, setMessagesAndCache]
	);

	useEffect(() => {
		fetchMessages();
	}, [fetchMessages]);

	useEffect(() => {
		const handler = (e: CustomEvent<MessageWithUser>) => {
			addMessage(e.detail);
		};
		window.addEventListener('new-message', handler as EventListener);
		return () => window.removeEventListener('new-message', handler as EventListener);
	}, [addMessage]);

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
						const alreadyPresent = messagesRef.current.some((m) => m.id === newRecord.id);
						if (alreadyPresent) return;

						const { data } = await supabase
							.from('messages')
							.select(
								`
									id, created_at, content, edited_at, deleted_at, user_id, channel_id, reply_to,
									users!inner (
										username,
										role,
										name,
										last_name,
										uid_user
									)
								`
							)
							.eq('id', newRecord.id)
							.single();

						if (data) {
							setMessagesAndCache((prev) => {
								if (prev.some((m) => m.id === data.id)) return prev;
								return [...prev, data as unknown as MessageWithUser];
							});
						}
					} else if (eventType === 'UPDATE') {
						setMessagesAndCache((prev) =>
							prev.map((msg) =>
								msg.id === newRecord.id ? { ...msg, ...newRecord, users: msg.users } : msg
							)
						);
					} else if (eventType === 'DELETE') {
						setMessagesAndCache((prev) => prev.filter((msg) => msg.id !== (oldRecord as any)?.id));
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [channelId, supabase, setMessagesAndCache]);

	const refresh = useCallback(() => {
		cache.delete(channelId!);
		fetchMessages(true);
	}, [channelId, fetchMessages]);

	return {
		messages,
		loading,
		error,
		refresh,
	};
}
