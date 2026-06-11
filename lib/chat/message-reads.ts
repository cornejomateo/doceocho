import { getSupabaseClient } from '../supabase-client';

const TABLE = 'message_reads';

export async function markMessageAsRead(
	messageId: number,
	userId: string
): Promise<{ data: any | null; error: any }> {
	const supabase = getSupabaseClient();

	// Check if already read
	const { data: existing } = await supabase
		.from(TABLE)
		.select('*')
		.eq('message_id', messageId)
		.eq('user_id', userId)
		.maybeSingle();

	if (existing) {
		return { data: existing, error: null };
	}

	// Insert new read record
	const { data, error } = await supabase
		.from(TABLE)
		.insert({ message_id: messageId, user_id: userId })
		.select()
		.single();

	return { data, error };
}

export async function markChannelMessagesAsRead(
	channelId: number,
	userId: string
): Promise<{ data: null; error: any }> {
	const supabase = getSupabaseClient();

	// Get all messages in the channel
	const { data: messages, error: messagesError } = await supabase
		.from('messages')
		.select('id')
		.eq('channel_id', channelId)
		.is('deleted_at', null);

	if (messagesError || !messages) {
		return { data: null, error: messagesError };
	}

	// Get already read messages
	const { data: readMessages } = await supabase
		.from(TABLE)
		.select('message_id')
		.eq('user_id', userId)
		.in(
			'message_id',
			messages.map((m: any) => m.id)
		);

	const readMessageIds = new Set(readMessages?.map((m: any) => m.message_id) || []);

	// Mark unread messages as read
	const unreadMessageIds = messages
		.map((m: any) => m.id)
		.filter((id: number) => !readMessageIds.has(id));

	if (unreadMessageIds.length === 0) {
		return { data: null, error: null };
	}

	const { error } = await supabase.from(TABLE).insert(
		unreadMessageIds.map((id: number) => ({
			message_id: id,
			user_id: userId,
		}))
	);

	return { data: null, error };
}

export async function getUnreadCount(
	channelId: number,
	userId: string
): Promise<{ data: number; error: any }> {
	const supabase = getSupabaseClient();

	// Get all messages in channel
	const { data: messages, error: messagesError } = await supabase
		.from('messages')
		.select('id')
		.eq('channel_id', channelId)
		.is('deleted_at', null);

	if (messagesError || !messages) {
		return { data: 0, error: messagesError };
	}

	// Get read messages for this user
	const { data: readMessages } = await supabase
		.from(TABLE)
		.select('message_id')
		.eq('user_id', userId)
		.in(
			'message_id',
			messages.map((m: any) => m.id)
		);

	const readMessageIds = new Set(readMessages?.map((m: any) => m.message_id) || []);
	const unreadCount = messages.filter((m: any) => !readMessageIds.has(m.id)).length;

	return { data: unreadCount, error: null };
}
