import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase-client';
import { Channel, ChannelWithMembers, ChannelWithLastMessage } from '@/lib/chat/chat-types';

const TABLE = 'channels';

export async function listChannels(
	supabase?: SupabaseClient
): Promise<{ data: Channel[] | null; error: any }> {
	const client = supabase ?? getSupabaseClient();
	const { data, error } = await client
		.from(TABLE)
		.select('*')
		.order('created_at', { ascending: false });
	return { data, error };
}

export async function getChannelById(
	id: number,
	supabase?: SupabaseClient
): Promise<{ data: Channel | null; error: any }> {
	const client = supabase ?? getSupabaseClient();
	const { data, error } = await client.from(TABLE).select('*').eq('id', id).single();
	return { data, error };
}

export async function createChannel(
	name: string,
	description: string,
	supabase?: SupabaseClient
): Promise<{ data: Channel | null; error: any }> {
	const client = supabase ?? getSupabaseClient();
	const { data, error } = await client.from(TABLE).insert({ name, description }).select().single();
	return { data, error };
}

export async function updateChannel(
	id: number,
	changes: Partial<Channel>,
	supabase?: SupabaseClient
): Promise<{ data: Channel | null; error: any }> {
	const client = supabase ?? getSupabaseClient();
	const { data, error } = await client.from(TABLE).update(changes).eq('id', id).select().single();
	return { data, error };
}

export async function deleteChannel(
	id: number,
	supabase?: SupabaseClient
): Promise<{ data: null; error: any }> {
	const client = supabase ?? getSupabaseClient();
	const { error } = await client.from(TABLE).delete().eq('id', id);
	return { data: null, error };
}

export async function getChannelsForUser(
	userId: string,
	client?: SupabaseClient
): Promise<{
	data: ChannelWithLastMessage[] | null;
	error: any;
}> {
	const supabase = client ?? getSupabaseClient();

	const { data, error } = await supabase
		.from('channel_members')
		.select(
			`
			channel_id,
			last_read_message_id,
			channels (
				id,
				created_at,
				name,
				description,
				last_message_id
			)
		`
		)
		.eq('user_id', userId);

	if (error || !data) {
		return { data: null, error };
	}

	const { data: unreadData, error: unreadError } = await supabase.rpc(
		'get_unread_counts_by_channel',
		{
			p_user_id: userId,
		}
	);

	if (unreadError) {
		return { data: null, error: unreadError };
	}

	const unreadMap = new Map(
		(unreadData || []).map((item: any) => [Number(item.channel_id), Number(item.unread_count)])
	);

	const channels = data.map((item: any) => ({
		...item.channels,
		unread_count: unreadMap.get(item.channel_id) || 0,
	}));

	return {
		data: channels,
		error: null,
	};
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

export async function updateLastMessage(
	channelId: number,
	messageId: number
): Promise<{ success: boolean; error?: any }> {
	try {
		const supabase = getSupabaseClient();
		const { error } = await supabase
			.from(TABLE)
			.update({ last_message_id: messageId })
			.eq('id', channelId);

		if (error) {
			return { success: false, error };
		}

		return { success: true };
	} catch (error) {
		return { success: false, error };
	}
}
