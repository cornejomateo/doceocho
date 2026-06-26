import { useState, useEffect } from 'react';
import { useAuth } from '@/components/provider/auth-provider';
import { getSupabaseClient } from '@/lib/supabase-client';

export function useChatUnreadCount() {
	const { user } = useAuth();
	const [totalUnreadCount, setTotalUnreadCount] = useState(0);

	useEffect(() => {
		if (!user?.id) return;

		const fetchUnreadCount = async () => {
			try {
				const supabase = getSupabaseClient();

				const { data, error } = await supabase.rpc('get_unread_messages_count', {
					p_user_id: user.id,
				});

				if (error) {
					console.error(error);
					return;
				}

				setTotalUnreadCount(data ?? 0);
			} catch (error) {
				console.error(error);
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
					event: '*',
					schema: 'public',
					table: 'messages',
				},
				fetchUnreadCount
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'channel_members',
				},
				fetchUnreadCount
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user?.id]);

	return totalUnreadCount;
}
