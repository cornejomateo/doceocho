import { useState, useEffect } from 'react';
import { useAuth } from '@/components/provider/auth-provider';
import { getSupabaseClient } from '@/lib/supabase-client';

export function useChatUnreadCount() {
	const { user } = useAuth();
	const [totalUnreadCount, setTotalUnreadCount] = useState(0);

	useEffect(() => {
		if (!user?.username) return;

		const fetchUnreadCount = async () => {
			try {
				const supabase = getSupabaseClient();
				const { data, error } = await supabase
					.from('channel_members')
					.select(
						`
						channel_id,
						channels (
							id
						)
					`
					)
					.eq('user_id', user.username);

				if (error || !data) {
					console.error('Error fetching channels:', error);
					return;
				}

				const channelIds = data.map((item: any) => item.channels.id);

				// Get all messages for user's channels
				const { data: allMessages, error: messagesError } = await supabase
					.from('messages')
					.select('id, channel_id')
					.in('channel_id', channelIds)
					.is('deleted_at', null);

				if (messagesError) {
					console.error('Error fetching messages:', messagesError);
					return;
				}

				// Get read message IDs for this user
				const { data: readMessages, error: readError } = await supabase
					.from('message_reads')
					.select('message_id')
					.eq('user_id', user.username);

				if (readError) {
					console.error('Error fetching read messages:', readError);
					return;
				}

				const readMessageIds = new Set(readMessages?.map((m: any) => m.message_id) || []);

				// Count unread messages
				const unreadCount =
					allMessages?.filter((msg: any) => !readMessageIds.has(msg.id)).length || 0;

				setTotalUnreadCount(unreadCount);
			} catch (error) {
				console.error('Error fetching unread count:', error);
			}
		};

		fetchUnreadCount();

		// Set up realtime subscription for message reads
		const supabase = getSupabaseClient();
		const channel = supabase
			.channel('unread-count')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'message_reads',
				},
				() => {
					fetchUnreadCount();
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
				},
				() => {
					fetchUnreadCount();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user?.username]);

	return totalUnreadCount;
}
