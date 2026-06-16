import { getSupabaseClient } from '../supabase-client';
import { Channel, ChannelWithMembers, ChannelWithLastMessage } from '@/types/chat';

const TABLE = 'channels';

export async function listChannels(): Promise<{ data: Channel[] | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select('*')
		.order('created_at', { ascending: false });
	return { data, error };
}

export async function getChannelById(id: number): Promise<{ data: Channel | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
	return { data, error };
}

export async function createChannel(
	channel: Omit<Channel, 'id' | 'created_at'>
): Promise<{ data: Channel | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).insert(channel).select().single();
	return { data, error };
}

export async function updateChannel(
	id: number,
	changes: Partial<Channel>
): Promise<{ data: Channel | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase.from(TABLE).update(changes).eq('id', id).select().single();
	return { data, error };
}

export async function deleteChannel(id: number): Promise<{ data: null; error: any }> {
	const supabase = getSupabaseClient();
	const { error } = await supabase.from(TABLE).delete().eq('id', id);
	return { data: null, error };
}

export async function getChannelsForUser(userId: string): Promise<{
	data: ChannelWithLastMessage[] | null;
	error: any;
}> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from('channel_members')
		.select(
			`
			channel_id,
			channels (
				id,
				created_at,
				name,
				description
			)
		`
		)
		.eq('user_id', userId);

	if (error || !data) {
		return { data: null, error };
	}

	// Get all messages for user's channels
	const channelIds = data.map((item: any) => item.channels.id);
	const { data: allMessages, error: messagesError } = await supabase
		.from('messages')
		.select('id, channel_id')
		.in('channel_id', channelIds)
		.is('deleted_at', null);

	if (messagesError) {
		return { data: null, error: messagesError };
	}

	// Get read message IDs for this user
	const { data: readMessages, error: readError } = await supabase
		.from('message_reads')
		.select('message_id')
		.eq('user_id', userId);

	if (readError) {
		return { data: null, error: readError };
	}

	const readMessageIds = new Set(readMessages?.map((m: any) => m.message_id) || []);

	// Count unread messages per channel
	const unreadCounts: Record<number, number> = {};
	if (allMessages) {
		allMessages.forEach((msg: any) => {
			if (!readMessageIds.has(msg.id)) {
				unreadCounts[msg.channel_id] = (unreadCounts[msg.channel_id] || 0) + 1;
			}
		});
	}

	const channels = data.map((item: any) => ({
		...item.channels,
		unread_count: unreadCounts[item.channels.id] || 0,
	}));

	return { data: channels, error: null };
}

export async function getChannelWithMembers(
	channelId: number
): Promise<{ data: ChannelWithMembers | null; error: any }> {
	const supabase = getSupabaseClient();
	const { data, error } = await supabase
		.from(TABLE)
		.select(
			`
			*,
			channel_members (
				id,
				joined_at,
				user_id,
				channel_id
			)
		`
		)
		.eq('id', channelId)
		.single();

	return { data, error };
}
