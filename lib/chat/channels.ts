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

	const channels = data.map((item: any) => ({
		...item.channels,
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
